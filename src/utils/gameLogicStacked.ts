import { StackedPiece, PlayerId, GameStatus, PieceSize } from '../types/game'

const SIZE_ORDER: Record<'small' | 'medium' | 'large', number> = {
  small: 1,
  medium: 2,
  large: 3,
}

// Regular 3x3 winning lines
const REGULAR_WINNING_LINES = [
  [0, 1, 2], // Row 1
  [3, 4, 5], // Row 2
  [6, 7, 8], // Row 3
  [0, 3, 6], // Column 1
  [1, 4, 7], // Column 2
  [2, 5, 8], // Column 3
  [0, 4, 8], // Diagonal 1
  [2, 4, 6], // Diagonal 2
]

/**
 * Get the top piece from a stack (the last piece in the array)
 */
function getTopPiece(stack: StackedPiece[]): StackedPiece | null {
  return stack.length > 0 ? stack[stack.length - 1] : null
}

/**
 * Check if a piece can be placed on a cell
 * - Can place on empty cell
 * - Can place larger piece on smaller piece (from either player)
 */
export function canPlacePiece(
  board: StackedPiece[][],
  index: number,
  pieceSize: 'small' | 'medium' | 'large'
): boolean {
  const stack = board[index]
  
  // Empty cell - can always place
  if (stack.length === 0) {
    return true
  }
  
  // Get top piece
  const topPiece = getTopPiece(stack)
  if (!topPiece) return true
  
  // Can only place if new piece is larger than top piece
  return SIZE_ORDER[pieceSize] > SIZE_ORDER[topPiece.size]
}

/**
 * Place a piece on the board (stack it if needed)
 */
export function placeStackedPiece(
  board: StackedPiece[][],
  index: number,
  playerId: 1 | 2,
  pieceSize: 'small' | 'medium' | 'large'
): StackedPiece[][] {
  if (!canPlacePiece(board, index, pieceSize)) {
    return board
  }
  
  const newBoard = board.map((stack, i) => {
    if (i === index) {
      return [...stack, { playerId, size: pieceSize }]
    }
    return stack
  })
  
  return newBoard
}

/**
 * Get the top piece player for each cell (for win detection)
 */
function getTopPieces(board: StackedPiece[][]): PlayerId[] {
  return board.map(stack => {
    const topPiece = getTopPiece(stack)
    return topPiece ? topPiece.playerId : null
  })
}

/**
 * Check for winner - only top pieces count
 */
export function checkWinner(board: StackedPiece[][]): {
  winner: PlayerId
  winningLine: number[] | null
} {
  const topPieces = getTopPieces(board)
  
  for (const line of REGULAR_WINNING_LINES) {
    const [a, b, c] = line
    if (topPieces[a] && topPieces[a] === topPieces[b] && topPieces[a] === topPieces[c]) {
      return { winner: topPieces[a], winningLine: line }
    }
  }
  
  return { winner: null, winningLine: null }
}

/**
 * Check if a player has any valid moves available
 */
function hasValidMoves(
  board: StackedPiece[][],
  playerPieces: { small: number; medium: number; large: number }
): boolean {
  // Check each cell to see if any available piece can be placed
  for (let cellIndex = 0; cellIndex < board.length; cellIndex++) {
    // Check each piece size the player has
    for (const [size, count] of Object.entries(playerPieces) as [PieceSize, number][]) {
      if (count > 0 && canPlacePiece(board, cellIndex, size)) {
        return true
      }
    }
  }
  return false
}

/**
 * Check for draw - occurs when:
 * 1. All pieces are placed and no winner, OR
 * 2. Both players have no valid moves (stalemate)
 */
export function checkDraw(
  board: StackedPiece[][],
  remainingPieces: {
    1: { small: number; medium: number; large: number }
    2: { small: number; medium: number; large: number }
  }
): boolean {
  // First check if there's a winner
  if (checkWinner(board).winner !== null) {
    return false
  }
  
  // Scenario 1: All pieces are used
  const allPiecesUsed =
    remainingPieces[1].small === 0 &&
    remainingPieces[1].medium === 0 &&
    remainingPieces[1].large === 0 &&
    remainingPieces[2].small === 0 &&
    remainingPieces[2].medium === 0 &&
    remainingPieces[2].large === 0
  
  if (allPiecesUsed) {
    return true
  }
  
  // Scenario 2: Stalemate - both players have no valid moves
  const player1HasMoves = hasValidMoves(board, remainingPieces[1])
  const player2HasMoves = hasValidMoves(board, remainingPieces[2])
  
  if (!player1HasMoves && !player2HasMoves) {
    return true
  }
  
  return false
}

export function getGameStatus(
  winner: PlayerId,
  isDraw: boolean
): GameStatus {
  if (winner) return 'won'
  if (isDraw) return 'draw'
  return 'playing'
}

