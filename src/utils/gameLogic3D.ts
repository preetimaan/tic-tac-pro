import { PlayerId, GameStatus } from '../types/game'

// Generate 3D winning lines (3x3x3 cube)
function generate3DWinningLines(): number[][] {
  const lines: number[][] = []
  
  // Helper to convert (layer, row, col) to index
  const toIndex = (layer: number, row: number, col: number) => layer * 9 + row * 3 + col
  
  // Within-layer wins (8 per layer × 3 layers = 24)
  for (let layer = 0; layer < 3; layer++) {
    // Rows
    for (let row = 0; row < 3; row++) {
      lines.push([
        toIndex(layer, row, 0),
        toIndex(layer, row, 1),
        toIndex(layer, row, 2),
      ])
    }
    // Columns
    for (let col = 0; col < 3; col++) {
      lines.push([
        toIndex(layer, 0, col),
        toIndex(layer, 1, col),
        toIndex(layer, 2, col),
      ])
    }
    // Diagonals
    lines.push([
      toIndex(layer, 0, 0),
      toIndex(layer, 1, 1),
      toIndex(layer, 2, 2),
    ])
    lines.push([
      toIndex(layer, 0, 2),
      toIndex(layer, 1, 1),
      toIndex(layer, 2, 0),
    ])
  }
  
  // Vertical lines through layers (9)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      lines.push([
        toIndex(0, row, col),
        toIndex(1, row, col),
        toIndex(2, row, col),
      ])
    }
  }
  
  // 3D space diagonals (4 main diagonals)
  lines.push([toIndex(0, 0, 0), toIndex(1, 1, 1), toIndex(2, 2, 2)])
  lines.push([toIndex(0, 0, 2), toIndex(1, 1, 1), toIndex(2, 2, 0)])
  lines.push([toIndex(0, 2, 0), toIndex(1, 1, 1), toIndex(2, 0, 2)])
  lines.push([toIndex(0, 2, 2), toIndex(1, 1, 1), toIndex(2, 0, 0)])
  
  return lines
}

const WINNING_LINES_3D = generate3DWinningLines()

export function checkWinner(board: PlayerId[]): {
  winner: PlayerId
  winningLine: number[] | null
} {
  for (const line of WINNING_LINES_3D) {
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

