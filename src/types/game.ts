export type PlayerId = 1 | 2 | null
export type GameStatus = 'playing' | 'won' | 'draw'
export type GameMode = 'regular' | '3d' | 'stacked'
export type PieceSize = 'small' | 'medium' | 'large'

export interface StackedPiece {
  playerId: 1 | 2
  size: PieceSize
}

export interface GameState {
  board: PlayerId[] | StackedPiece[][]
  currentPlayer: 1 | 2
  status: GameStatus
  winner: PlayerId
  winningLine: number[] | null
  scores: { 1: number; 2: number }
  mode: GameMode
  // Stacked mode specific
  selectedPieceSize?: PieceSize
  remainingPieces?: {
    1: { small: number; medium: number; large: number }
    2: { small: number; medium: number; large: number }
  }
}

export interface Position {
  x: number
  y: number
  z: number
}

export interface PlayerConfig {
  name: string
  color: string
  shape: 'x' | 'o' | 'sphere' | 'cube' | 'stacked'
}

export interface ModeConfig {
  mode: GameMode
  player1: PlayerConfig
  player2: PlayerConfig
  boardSize: number
}

export const MODE_CONFIGS: Record<GameMode, ModeConfig> = {
  regular: {
    mode: 'regular',
    player1: {
      name: 'X',
      color: '#4488ff',
      shape: 'x',
    },
    player2: {
      name: 'O',
      color: '#ffff88',
      shape: 'o',
    },
    boardSize: 9,
  },
  '3d': {
    mode: '3d',
    player1: {
      name: 'Red',
      color: '#ff6666',
      shape: 'sphere',
    },
    player2: {
      name: 'Blue',
      color: '#4488ff',
      shape: 'cube',
    },
    boardSize: 27,
  },
  stacked: {
    mode: 'stacked',
    player1: {
      name: 'Blue',
      color: '#4488ff',
      shape: 'stacked',
    },
    player2: {
      name: 'Pink',
      color: '#ff69b4',
      shape: 'stacked',
    },
    boardSize: 9,
  },
}
