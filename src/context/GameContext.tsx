import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { GameState, GameMode, MODE_CONFIGS, PieceSize, StackedPiece } from '../types/game'
import { checkWinner as checkWinnerRegular, checkDraw as checkDrawRegular, getGameStatus, makeMove } from '../utils/gameLogic'
import { checkWinner as checkWinner3D, checkDraw as checkDraw3D } from '../utils/gameLogic3D'
import { checkWinner as checkWinnerStacked, checkDraw as checkDrawStacked, placeStackedPiece, canPlacePiece } from '../utils/gameLogicStacked'
import { useSettings } from './SettingsContext'

type GameAction =
  | { type: 'MAKE_MOVE'; index: number }
  | { type: 'RESET_GAME'; mode: GameMode }
  | { type: 'UPDATE_SCORE'; winner: 1 | 2 }
  | { type: 'SET_MODE'; mode: GameMode }
  | { type: 'SELECT_PIECE_SIZE'; size: PieceSize }

function getInitialState(mode: GameMode): GameState {
  const config = MODE_CONFIGS[mode]
  // Randomize starting player (1 or 2)
  const startingPlayer = Math.random() < 0.5 ? 1 : 2
  
  if (mode === 'stacked') {
    return {
      board: Array(config.boardSize).fill(null).map(() => []) as StackedPiece[][],
      currentPlayer: startingPlayer,
      status: 'playing',
      winner: null,
      winningLine: null,
      scores: { 1: 0, 2: 0 },
      mode,
      selectedPieceSize: 'small', // Default to small
      remainingPieces: {
        1: { small: 3, medium: 3, large: 3 },
        2: { small: 3, medium: 3, large: 3 },
      },
    }
  }
  
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
      if (state.status !== 'playing') {
        return state
      }

      // Handle stacked mode
      if (state.mode === 'stacked') {
        if (!state.selectedPieceSize || !state.remainingPieces) {
          return state
        }
        
        const board = state.board as StackedPiece[][]
        const remainingPieces = { ...state.remainingPieces }
        const playerPieces = remainingPieces[state.currentPlayer]
        
        // Check if player has pieces of selected size
        if (playerPieces[state.selectedPieceSize] === 0) {
          return state
        }
        
        // Check if can place piece
        if (!canPlacePiece(board, action.index, state.selectedPieceSize)) {
          return state
        }
        
        // Place the piece
        const newBoard = placeStackedPiece(board, action.index, state.currentPlayer, state.selectedPieceSize)
        
        // Decrement remaining pieces
        const newRemainingPieces = {
          ...remainingPieces,
          [state.currentPlayer]: {
            ...playerPieces,
            [state.selectedPieceSize]: playerPieces[state.selectedPieceSize] - 1,
          },
        }
        
        // Check for winner/draw
        const { winner, winningLine } = checkWinnerStacked(newBoard)
        const isDraw = checkDrawStacked(newBoard, newRemainingPieces)
        const status = getGameStatus(winner, isDraw)
        
        // Auto-select next available piece size for next player (prefer small)
        const nextPlayer = state.currentPlayer === 1 ? 2 : 1
        const nextPlayerPieces = newRemainingPieces[nextPlayer]
        let nextSelectedSize: PieceSize = 'small'
        if (nextPlayerPieces.small > 0) {
          nextSelectedSize = 'small'
        } else if (nextPlayerPieces.medium > 0) {
          nextSelectedSize = 'medium'
        } else if (nextPlayerPieces.large > 0) {
          nextSelectedSize = 'large'
        }
        
        return {
          ...state,
          board: newBoard,
          currentPlayer: nextPlayer,
          status,
          winner,
          winningLine,
          remainingPieces: newRemainingPieces,
          selectedPieceSize: nextSelectedSize,
        }
      }
      
      // Handle regular and 3d modes
      if ((state.board as any[])[action.index] !== null) {
        return state
      }

      const newBoard = makeMove(state.board as any[], action.index, state.currentPlayer)
      
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
    case 'SELECT_PIECE_SIZE': {
      if (state.mode !== 'stacked' || !state.remainingPieces) {
        return state
      }
      
      const playerPieces = state.remainingPieces[state.currentPlayer]
      // Only allow selection if player has pieces of that size
      if (playerPieces[action.size] > 0) {
        return {
          ...state,
          selectedPieceSize: action.size,
        }
      }
      return state
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
  setSelectedPieceSize?: (size: PieceSize) => void
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

  const handleSetSelectedPieceSize = useCallback((size: PieceSize) => {
    dispatch({ type: 'SELECT_PIECE_SIZE', size })
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
        setSelectedPieceSize: gameMode === 'stacked' ? handleSetSelectedPieceSize : undefined,
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
