import { PlayerId, GameStatus } from '../types/game'

// Regular 3x3 winning lines
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

export function checkWinner(board: PlayerId[]): {
  winner: PlayerId
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

export function checkDraw(board: PlayerId[]): boolean {
  return board.every(cell => cell !== null) && checkWinner(board).winner === null
}

export function getGameStatus(
  winner: PlayerId,
  isDraw: boolean
): GameStatus {
  if (winner) return 'won'
  if (isDraw) return 'draw'
  return 'playing'
}

export function makeMove(
  board: PlayerId[],
  index: number,
  player: 1 | 2
): PlayerId[] {
  if (board[index] !== null) return board
  const newBoard = [...board]
  newBoard[index] = player
  return newBoard
}
