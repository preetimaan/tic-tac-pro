import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import { GameState, GameMode, MODE_CONFIGS, PieceSize, StackedPiece, Difficulty, OpponentType } from '../types/game'
import { checkWinner as checkWinnerRegular, checkDraw as checkDrawRegular, getGameStatus, makeMove } from '../utils/gameLogic'
import { checkWinner as checkWinner3D, checkDraw as checkDraw3D } from '../utils/gameLogic3D'
import { checkWinner as checkWinnerStacked, checkDraw as checkDrawStacked, placeStackedPiece, canPlacePiece } from '../utils/gameLogicStacked'
import { calculateAIMoveRegular, calculateAIMove3D, calculateAIMoveStacked } from '../utils/ai'
import { useSettings } from './SettingsContext'

type GameAction =
  | { type: 'MAKE_MOVE'; index: number }
  | { type: 'MAKE_STACKED_MOVE'; index: number; pieceSize: PieceSize }
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
    case 'MAKE_STACKED_MOVE': {
      if (state.mode !== 'stacked' || state.status !== 'playing' || !state.remainingPieces) {
        return state
      }
      const board = state.board as StackedPiece[][]
      const remainingPieces = { ...state.remainingPieces }
      const playerPieces = remainingPieces[state.currentPlayer]
      if (playerPieces[action.pieceSize] === 0) return state
      if (!canPlacePiece(board, action.index, action.pieceSize)) return state

      const newBoard = placeStackedPiece(board, action.index, state.currentPlayer, action.pieceSize)
      const newRemainingPieces = {
        ...remainingPieces,
        [state.currentPlayer]: {
          ...playerPieces,
          [action.pieceSize]: playerPieces[action.pieceSize] - 1,
        },
      }
      const { winner, winningLine } = checkWinnerStacked(newBoard)
      const isDraw = checkDrawStacked(newBoard, newRemainingPieces)
      const status = getGameStatus(winner, isDraw)
      const nextPlayer = state.currentPlayer === 1 ? 2 : 1
      const nextPlayerPieces = newRemainingPieces[nextPlayer]
      let nextSelectedSize: PieceSize = 'small'
      if (nextPlayerPieces.small > 0) nextSelectedSize = 'small'
      else if (nextPlayerPieces.medium > 0) nextSelectedSize = 'medium'
      else if (nextPlayerPieces.large > 0) nextSelectedSize = 'large'

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
  makeMove: (index: number, pieceSize?: PieceSize) => void
  resetGame: () => void
  startGame: () => void
  setSelectedPieceSize?: (size: PieceSize) => void
  opponentType: OpponentType
  aiPlayerId: 1 | 2 | null
  aiDifficulty: Difficulty
  totalGamesPlayed: number
  gameStarted: boolean
  setOpponentType: (t: OpponentType) => void
  setAIDifficulty: (difficulty: Difficulty) => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { gameMode } = useSettings()
  const [state, dispatch] = useReducer(gameReducer, getInitialState(gameMode))
  const [opponentType, setOpponentTypeState] = React.useState<OpponentType>('computer')
  const [aiPlayerId, setAiPlayerId] = React.useState<1 | 2 | null>(null)
  const [gameStarted, setGameStarted] = React.useState(false)
  const [totalGamesPlayed, setTotalGamesPlayed] = React.useState(0)
  const [aiDifficulty, setAiDifficultyState] = React.useState<Difficulty>('easy')
  const aiScheduledRef = useRef(false)
  const stateRef = useRef(state)
  const prevStatusRef = useRef<GameState['status']>(state.status)
  stateRef.current = state

  const setOpponentType = useCallback((t: OpponentType) => {
    setOpponentTypeState(t)
    if (t === 'human') {
      setAiPlayerId(null)
    }
    setTotalGamesPlayed(0)
  }, [])

  const setAIDifficulty = useCallback((d: Difficulty) => {
    setAiDifficultyState(d)
  }, [])

  // Update board when mode changes (don't set aiPlayerId here; set on Start Game)
  React.useEffect(() => {
    dispatch({ type: 'SET_MODE', mode: gameMode })
    if (opponentType === 'human') {
      setAiPlayerId(null)
    }
    setAiDifficultyState('easy')
  }, [gameMode, opponentType])

  const handleMakeMove = useCallback((index: number, pieceSize?: PieceSize) => {
    if (gameMode === 'stacked' && pieceSize !== undefined) {
      dispatch({ type: 'MAKE_STACKED_MOVE', index, pieceSize })
    } else {
      dispatch({ type: 'MAKE_MOVE', index })
    }
  }, [gameMode])

  const handleResetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME', mode: gameMode })
    setGameStarted(false)
  }, [gameMode])

  const handleStartGame = useCallback(() => {
    setGameStarted(true)
    if (opponentType === 'computer') {
      setAiPlayerId(Math.random() < 0.5 ? 1 : 2)
    }
    dispatch({ type: 'RESET_GAME', mode: gameMode })
  }, [gameMode, opponentType])

  const handleSetSelectedPieceSize = useCallback((size: PieceSize) => {
    dispatch({ type: 'SELECT_PIECE_SIZE', size })
  }, [])

  // Update score when game is won
  React.useEffect(() => {
    if (state.status === 'won' && state.winner) {
      dispatch({ type: 'UPDATE_SCORE', winner: state.winner })
    }
  }, [state.status, state.winner])

  // Count total games played (won or draw); allow changing options again
  React.useEffect(() => {
    if ((state.status === 'won' || state.status === 'draw') && prevStatusRef.current === 'playing') {
      setTotalGamesPlayed((n) => n + 1)
      setGameStarted(false)
    }
    prevStatusRef.current = state.status
  }, [state.status])

  // AI move (Regular, 3D, Stacked modes)
  useEffect(() => {
    if (
      (gameMode !== 'regular' && gameMode !== '3d' && gameMode !== 'stacked') ||
      state.status !== 'playing' ||
      aiPlayerId === null
    ) {
      aiScheduledRef.current = false
      return
    }
    if (state.currentPlayer !== aiPlayerId) {
      aiScheduledRef.current = false
      return
    }
    if (aiScheduledRef.current) return
    aiScheduledRef.current = true

    const delay = (() => {
      if (gameMode === 'stacked') {
        return 500 + Math.random() * 1000
      }
      const board = stateRef.current.board as (1 | 2 | null)[]
      const isFirstMove = Array.isArray(board) && board.every((c) => c === null)
      return isFirstMove ? 1500 + Math.random() * 1000 : 500 + Math.random() * 1000
    })()

    const timer = setTimeout(() => {
      const s = stateRef.current
      let made = false
      if (gameMode === '3d') {
        const move = calculateAIMove3D(s, aiDifficulty)
        if (move !== null) {
          handleMakeMove(move)
          made = true
        }
      } else if (gameMode === 'stacked') {
        const move = calculateAIMoveStacked(s, aiDifficulty)
        if (move !== null) {
          handleMakeMove(move.index, move.pieceSize)
          made = true
        }
      } else {
        const move = calculateAIMoveRegular(s, aiDifficulty)
        if (move !== null) {
          handleMakeMove(move)
          made = true
        }
      }
      aiScheduledRef.current = false
    }, delay)
    return () => {
      clearTimeout(timer)
      aiScheduledRef.current = false
    }
  }, [gameStarted, gameMode, state.currentPlayer, state.status, aiPlayerId, aiDifficulty, handleMakeMove])

  return (
    <GameContext.Provider
      value={{
        state,
        makeMove: handleMakeMove,
        resetGame: handleResetGame,
        startGame: handleStartGame,
        setSelectedPieceSize: gameMode === 'stacked' ? handleSetSelectedPieceSize : undefined,
        opponentType,
        aiPlayerId,
        aiDifficulty,
        totalGamesPlayed,
        gameStarted,
        setOpponentType,
        setAIDifficulty,
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
