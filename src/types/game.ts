export type Player = 'X' | 'O' | null
export type GameStatus = 'playing' | 'won' | 'draw'

export interface GameState {
  board: Player[]
  currentPlayer: 'X' | 'O'
  status: GameStatus
  winner: Player
  winningLine: number[] | null
  scores: { X: number; O: number }
}

export interface Position {
  x: number
  y: number
  z: number
}

