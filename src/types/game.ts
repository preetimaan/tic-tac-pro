export type PlayerId = 1 | 2 | null
export type GameStatus = 'playing' | 'won' | 'draw'
export type GameMode = 'regular' | '3d'

export interface GameState {
  board: PlayerId[]
  currentPlayer: 1 | 2
  status: GameStatus
  winner: PlayerId
  winningLine: number[] | null
  scores: { 1: number; 2: number }
  mode: GameMode
}

export interface Position {
  x: number
  y: number
  z: number
}

export interface PlayerConfig {
  name: string
  color: string
  shape: 'x' | 'o' | 'sphere' | 'cube'
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
}
