import { GameState, PlayerId, Difficulty, PieceSize, StackedPiece } from '../types/game'
import {
  checkWinner,
  checkDraw,
  getGameStatus,
  makeMove as makeMoveOnBoard,
} from './gameLogic'
import {
  checkWinner as checkWinner3D,
  checkDraw as checkDraw3D,
  getGameStatus as getGameStatus3D,
  makeMove as makeMoveOnBoard3D,
  getWinningLines3D,
} from './gameLogic3D'
import {
  checkWinner as checkWinnerStacked,
  checkDraw as checkDrawStacked,
  getGameStatus as getGameStatusStacked,
  placeStackedPiece,
  canPlacePiece as canPlacePieceStacked,
  getTopPieces,
} from './gameLogicStacked'

/**
 * AI for Regular (3×3) mode only. Returns move index or null if not regular / no moves.
 */
export function calculateAIMoveRegular(
  state: GameState,
  difficulty: Difficulty
): number | null {
  if (state.mode !== 'regular' || state.status !== 'playing') {
    return null
  }

  const board = state.board as PlayerId[]
  const validMoves = getValidMovesRegular(board)
  if (validMoves.length === 0) return null

  if (difficulty === 'easy') {
    return validMoves[Math.floor(Math.random() * validMoves.length)]
  }

  const depth = difficulty === 'medium' ? 3 : 8
  const result = minimax(state, depth, -Infinity, Infinity, true)
  return result.move
}

function getValidMovesRegular(board: PlayerId[]): number[] {
  const moves: number[] = []
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) moves.push(i)
  }
  return moves
}

interface MinimaxResult {
  score: number
  move: number | null
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean
): MinimaxResult {
  const board = state.board as PlayerId[]
  const currentPlayer = state.currentPlayer
  const opponent: 1 | 2 = currentPlayer === 1 ? 2 : 1

  const { winner } = checkWinner(board)
  const isDraw = checkDraw(board)
  const status = getGameStatus(winner, isDraw)

  if (status === 'won') {
    const score = winner === currentPlayer ? 100 : -100
    return { score, move: null }
  }
  if (status === 'draw') {
    return { score: 0, move: null }
  }
  if (depth === 0) {
    return { score: evaluateRegularPosition(board, currentPlayer), move: null }
  }

  const validMoves = getValidMovesRegular(board)
  if (validMoves.length === 0) {
    return { score: 0, move: null }
  }

  let bestMove = validMoves[0]
  let bestScore = maximizing ? -Infinity : Infinity

  for (const move of validMoves) {
    const playerToMove = maximizing ? currentPlayer : opponent
    const newBoard = makeMoveOnBoard(board, move, playerToMove)
    const nextPlayer = (playerToMove === 1 ? 2 : 1) as 1 | 2
    const newState: GameState = {
      ...state,
      board: newBoard,
      currentPlayer: nextPlayer,
    }
    const { winner: w } = checkWinner(newBoard)
    const draw = checkDraw(newBoard)
    newState.status = getGameStatus(w, draw)
    newState.winner = w

    const result = minimax(newState, depth - 1, alpha, beta, !maximizing)

    if (maximizing) {
      if (result.score > bestScore) {
        bestScore = result.score
        bestMove = move
      }
      alpha = Math.max(alpha, bestScore)
    } else {
      if (result.score < bestScore) {
        bestScore = result.score
        bestMove = move
      }
      beta = Math.min(beta, bestScore)
    }
    if (beta <= alpha) break
  }

  return { score: bestScore, move: bestMove }
}

function evaluateRegularPosition(board: PlayerId[], currentPlayer: 1 | 2): number {
  const opponent: 1 | 2 = currentPlayer === 1 ? 2 : 1
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  let score = 0
  for (const [a, b, c] of lines) {
    const values = [board[a], board[b], board[c]]
    const currentCount = values.filter((v) => v === currentPlayer).length
    const opponentCount = values.filter((v) => v === opponent).length
    const emptyCount = values.filter((v) => v === null).length

    if (currentCount === 2 && emptyCount === 1) score += 10
    if (opponentCount === 2 && emptyCount === 1) score -= 10
    if (currentCount === 3) score += 100
    if (opponentCount === 3) score -= 100
  }
  return score
}

// --- 3D mode AI ---

/**
 * AI for 3D (3×3×3) mode. Returns move index 0..26 or null if not 3d / no moves.
 */
export function calculateAIMove3D(
  state: GameState,
  difficulty: Difficulty
): number | null {
  if (state.mode !== '3d' || state.status !== 'playing') {
    return null
  }

  const board = state.board as PlayerId[]
  const validMoves = getValidMoves3D(board)
  if (validMoves.length === 0) return null

  if (difficulty === 'easy') {
    return validMoves[Math.floor(Math.random() * validMoves.length)]
  }

  const depth = difficulty === 'medium' ? 2 : 3
  const result = minimax3D(state, depth, -Infinity, Infinity, true)
  return result.move
}

function getValidMoves3D(board: PlayerId[]): number[] {
  const moves: number[] = []
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) moves.push(i)
  }
  return moves
}

function minimax3D(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean
): MinimaxResult {
  const board = state.board as PlayerId[]
  const currentPlayer = state.currentPlayer
  const opponent: 1 | 2 = currentPlayer === 1 ? 2 : 1

  const { winner } = checkWinner3D(board)
  const isDraw = checkDraw3D(board)
  const status = getGameStatus3D(winner, isDraw)

  if (status === 'won') {
    const score = winner === currentPlayer ? 100 : -100
    return { score, move: null }
  }
  if (status === 'draw') {
    return { score: 0, move: null }
  }
  if (depth === 0) {
    return { score: evaluate3DPosition(board, currentPlayer), move: null }
  }

  const validMoves = getValidMoves3D(board)
  if (validMoves.length === 0) {
    return { score: 0, move: null }
  }

  let bestMove = validMoves[0]
  let bestScore = maximizing ? -Infinity : Infinity

  for (const move of validMoves) {
    const playerToMove = maximizing ? currentPlayer : opponent
    const newBoard = makeMoveOnBoard3D(board, move, playerToMove)
    const nextPlayer = (playerToMove === 1 ? 2 : 1) as 1 | 2
    const newState: GameState = {
      ...state,
      board: newBoard,
      currentPlayer: nextPlayer,
    }
    const { winner: w } = checkWinner3D(newBoard)
    const draw = checkDraw3D(newBoard)
    newState.status = getGameStatus3D(w, draw)
    newState.winner = w

    const result = minimax3D(newState, depth - 1, alpha, beta, !maximizing)

    if (maximizing) {
      if (result.score > bestScore) {
        bestScore = result.score
        bestMove = move
      }
      alpha = Math.max(alpha, bestScore)
    } else {
      if (result.score < bestScore) {
        bestScore = result.score
        bestMove = move
      }
      beta = Math.min(beta, bestScore)
    }
    if (beta <= alpha) break
  }

  return { score: bestScore, move: bestMove }
}

const LINES_3D = getWinningLines3D()

function evaluate3DPosition(board: PlayerId[], currentPlayer: 1 | 2): number {
  const opponent: 1 | 2 = currentPlayer === 1 ? 2 : 1
  let score = 0
  for (const [a, b, c] of LINES_3D) {
    const values = [board[a], board[b], board[c]]
    const currentCount = values.filter((v) => v === currentPlayer).length
    const opponentCount = values.filter((v) => v === opponent).length
    const emptyCount = values.filter((v) => v === null).length

    if (currentCount === 2 && emptyCount === 1) score += 10
    if (opponentCount === 2 && emptyCount === 1) score -= 10
    if (currentCount === 3) score += 100
    if (opponentCount === 3) score -= 100
  }
  return score
}

// --- Stacked mode AI ---

export interface StackedMove {
  index: number
  pieceSize: PieceSize
}

/**
 * AI for Stacked mode. Returns { index, pieceSize } or null if not stacked / no moves.
 */
export function calculateAIMoveStacked(
  state: GameState,
  difficulty: Difficulty
): StackedMove | null {
  if (state.mode !== 'stacked' || state.status !== 'playing' || !state.remainingPieces) {
    return null
  }

  const validMoves = getValidMovesStacked(state)
  if (validMoves.length === 0) return null

  if (difficulty === 'easy') {
    return validMoves[Math.floor(Math.random() * validMoves.length)]
  }

  const depth = difficulty === 'medium' ? 2 : 3
  const result = minimaxStacked(state, depth, -Infinity, Infinity, true)
  return result.move
}

function getValidMovesStacked(state: GameState): StackedMove[] {
  const board = state.board as StackedPiece[][]
  const remaining = state.remainingPieces!
  const player = state.currentPlayer
  const pieces = remaining[player]
  const moves: StackedMove[] = []
  for (let index = 0; index < 9; index++) {
    if (pieces.small > 0 && canPlacePieceStacked(board, index, 'small')) {
      moves.push({ index, pieceSize: 'small' })
    }
    if (pieces.medium > 0 && canPlacePieceStacked(board, index, 'medium')) {
      moves.push({ index, pieceSize: 'medium' })
    }
    if (pieces.large > 0 && canPlacePieceStacked(board, index, 'large')) {
      moves.push({ index, pieceSize: 'large' })
    }
  }
  return moves
}

interface StackedMinimaxResult {
  score: number
  move: StackedMove | null
}

function minimaxStacked(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean
): StackedMinimaxResult {
  const board = state.board as StackedPiece[][]
  const remaining = state.remainingPieces!
  const currentPlayer = state.currentPlayer
  const opponent: 1 | 2 = currentPlayer === 1 ? 2 : 1

  const { winner } = checkWinnerStacked(board)
  const isDraw = checkDrawStacked(board, remaining)
  const status = getGameStatusStacked(winner, isDraw)

  if (status === 'won') {
    const score = winner === currentPlayer ? 100 : -100
    return { score, move: null }
  }
  if (status === 'draw') {
    return { score: 0, move: null }
  }
  if (depth === 0) {
    return { score: evaluateStackedPosition(board, currentPlayer), move: null }
  }

  const validMoves = getValidMovesStacked(state)
  if (validMoves.length === 0) {
    return { score: 0, move: null }
  }

  let bestMove = validMoves[0]
  let bestScore = maximizing ? -Infinity : Infinity

  for (const { index, pieceSize } of validMoves) {
    const playerToMove = maximizing ? currentPlayer : opponent
    const newBoard = placeStackedPiece(board, index, playerToMove, pieceSize)
    const newRemaining = {
      ...remaining,
      [playerToMove]: {
        ...remaining[playerToMove],
        [pieceSize]: remaining[playerToMove][pieceSize] - 1,
      },
    }
    const nextPlayer = (playerToMove === 1 ? 2 : 1) as 1 | 2
    const nextPieces = newRemaining[nextPlayer]
    let nextSize: PieceSize = 'small'
    if (nextPieces.small > 0) nextSize = 'small'
    else if (nextPieces.medium > 0) nextSize = 'medium'
    else if (nextPieces.large > 0) nextSize = 'large'

    const newState: GameState = {
      ...state,
      board: newBoard,
      currentPlayer: nextPlayer,
      remainingPieces: newRemaining,
      selectedPieceSize: nextSize,
    }
    const { winner: w } = checkWinnerStacked(newBoard)
    const draw = checkDrawStacked(newBoard, newRemaining)
    newState.status = getGameStatusStacked(w, draw)
    newState.winner = w

    const result = minimaxStacked(newState, depth - 1, alpha, beta, !maximizing)

    if (maximizing) {
      if (result.score > bestScore) {
        bestScore = result.score
        bestMove = { index, pieceSize }
      }
      alpha = Math.max(alpha, bestScore)
    } else {
      if (result.score < bestScore) {
        bestScore = result.score
        bestMove = { index, pieceSize }
      }
      beta = Math.min(beta, bestScore)
    }
    if (beta <= alpha) break
  }

  return { score: bestScore, move: bestMove }
}

const STACKED_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function evaluateStackedPosition(board: StackedPiece[][], currentPlayer: 1 | 2): number {
  const topPieces = getTopPieces(board)
  const opponent: 1 | 2 = currentPlayer === 1 ? 2 : 1
  let score = 0
  for (const [a, b, c] of STACKED_LINES) {
    const values = [topPieces[a], topPieces[b], topPieces[c]]
    const currentCount = values.filter((v) => v === currentPlayer).length
    const opponentCount = values.filter((v) => v === opponent).length
    const emptyCount = values.filter((v) => v === null).length
    if (currentCount === 2 && emptyCount === 1) score += 10
    if (opponentCount === 2 && emptyCount === 1) score -= 10
    if (currentCount === 3) score += 100
    if (opponentCount === 3) score -= 100
  }
  return score
}
