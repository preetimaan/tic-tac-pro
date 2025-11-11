import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { GameState } from '../types/game'
import { checkWinner, checkDraw, getGameStatus, makeMove } from '../utils/gameLogic'

type GameAction =
  | { type: 'MAKE_MOVE'; index: number }
  | { type: 'RESET_GAME' }
  | { type: 'UPDATE_SCORE'; winner: 'X' | 'O' }

function getInitialState(): GameState {
  // Randomize starting player (X or O)
  const startingPlayer = Math.random() < 0.5 ? 'X' : 'O'
  return {
    board: Array(9).fill(null),
    currentPlayer: startingPlayer,
    status: 'playing',
    winner: null,
    winningLine: null,
    scores: { X: 0, O: 0 },
  }
}

const initialState = getInitialState()

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MAKE_MOVE': {
      if (state.status !== 'playing' || state.board[action.index] !== null) {
        return state
      }

      const newBoard = makeMove(state.board, action.index, state.currentPlayer)
      const { winner, winningLine } = checkWinner(newBoard)
      const isDraw = checkDraw(newBoard)
      const status = getGameStatus(winner, isDraw)

      return {
        ...state,
        board: newBoard,
        currentPlayer: state.currentPlayer === 'X' ? 'O' : 'X',
        status,
        winner,
        winningLine,
      }
    }
    case 'RESET_GAME': {
      const newState = getInitialState()
      return {
        ...newState,
        scores: state.scores,
      }
    }
    case 'UPDATE_SCORE': {
      return {
        ...state,
        scores: {
          ...state.scores,
          [action.winner]: state.scores[action.winner] + 1,
        },
      }
    }
    default:
      return state
  }
}

interface GameContextType {
  state: GameState
  makeMove: (index: number) => void
  resetGame: () => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const handleMakeMove = useCallback((index: number) => {
    dispatch({ type: 'MAKE_MOVE', index })
  }, [])

  const handleResetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' })
  }, [])

  // Update score when game is won
  React.useEffect(() => {
    if (state.status === 'won' && state.winner) {
      dispatch({ type: 'UPDATE_SCORE', winner: state.winner })
    }
  }, [state.status, state.winner])

  return (
    <GameContext.Provider
      value={{
        state,
        makeMove: handleMakeMove,
        resetGame: handleResetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

