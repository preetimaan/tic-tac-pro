import { Player, GameStatus } from '../types/game'

const WINNING_LINES = [
  [0, 1, 2], // Row 1
  [3, 4, 5], // Row 2
  [6, 7, 8], // Row 3
  [0, 3, 6], // Column 1
  [1, 4, 7], // Column 2
  [2, 5, 8], // Column 3
  [0, 4, 8], // Diagonal 1
  [2, 4, 6], // Diagonal 2
]

export function checkWinner(board: Player[]): {
  winner: Player
  winningLine: number[] | null
} {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningLine: line }
    }
  }
  return { winner: null, winningLine: null }
}

export function checkDraw(board: Player[]): boolean {
  return board.every(cell => cell !== null) && checkWinner(board).winner === null
}

export function getGameStatus(
  winner: Player,
  isDraw: boolean
): GameStatus {
  if (winner) return 'won'
  if (isDraw) return 'draw'
  return 'playing'
}

export function makeMove(
  board: Player[],
  index: number,
  player: 'X' | 'O'
): Player[] {
  if (board[index] !== null) return board
  const newBoard = [...board]
  newBoard[index] = player
  return newBoard
}

