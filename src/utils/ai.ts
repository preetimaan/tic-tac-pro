import { GameState, PlayerId, Difficulty } from '../types/game'
import {
  checkWinner,
  checkDraw,
  getGameStatus,
  makeMove as makeMoveOnBoard,
} from './gameLogic'

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

  const depth = difficulty === 'medium' ? 3 : 10
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
