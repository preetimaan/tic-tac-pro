import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { GameState, GameMode, MODE_CONFIGS } from '../types/game'
import { checkWinner as checkWinnerRegular, checkDraw as checkDrawRegular, getGameStatus, makeMove } from '../utils/gameLogic'
import { checkWinner as checkWinner3D, checkDraw as checkDraw3D } from '../utils/gameLogic3D'
import { useSettings } from './SettingsContext'

type GameAction =
  | { type: 'MAKE_MOVE'; index: number }
  | { type: 'RESET_GAME'; mode: GameMode }
  | { type: 'UPDATE_SCORE'; winner: 1 | 2 }
  | { type: 'SET_MODE'; mode: GameMode }

function getInitialState(mode: GameMode): GameState {
  const config = MODE_CONFIGS[mode]
  // Randomize starting player (1 or 2)
  const startingPlayer = Math.random() < 0.5 ? 1 : 2
  return {
    board: Array(config.boardSize).fill(null),
    currentPlayer: startingPlayer,
    status: 'playing',
    winner: null,
    winningLine: null,
    scores: { 1: 0, 2: 0 },
    mode,
  }
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MAKE_MOVE': {
      if (state.status !== 'playing' || state.board[action.index] !== null) {
        return state
      }

      const newBoard = makeMove(state.board, action.index, state.currentPlayer)
      
      // Use mode-specific game logic
      const { winner, winningLine } = state.mode === '3d' 
        ? checkWinner3D(newBoard)
        : checkWinnerRegular(newBoard)
      const isDraw = state.mode === '3d'
        ? checkDraw3D(newBoard)
        : checkDrawRegular(newBoard)
      const status = getGameStatus(winner, isDraw)

      return {
        ...state,
        board: newBoard,
        currentPlayer: state.currentPlayer === 1 ? 2 : 1,
        status,
        winner,
        winningLine,
      }
    }
    case 'RESET_GAME': {
      const newState = getInitialState(action.mode)
      return {
        ...newState,
        scores: state.scores,
      }
    }
    case 'SET_MODE': {
      return getInitialState(action.mode)
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
  const { gameMode } = useSettings()
  const [state, dispatch] = useReducer(gameReducer, getInitialState(gameMode))

  // Update board when mode changes
  React.useEffect(() => {
    dispatch({ type: 'SET_MODE', mode: gameMode })
  }, [gameMode])

  const handleMakeMove = useCallback((index: number) => {
    dispatch({ type: 'MAKE_MOVE', index })
  }, [])

  const handleResetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME', mode: gameMode })
  }, [gameMode])

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
