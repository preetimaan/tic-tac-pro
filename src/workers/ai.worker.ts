/**
 * Web Worker: runs AI minimax off the main thread to avoid freezing the UI.
 */
import {
  calculateAIMoveRegular,
  calculateAIMove3D,
  calculateAIMoveStacked,
} from '../utils/ai'
import type { GameState, GameMode, Difficulty } from '../types/game'

export type AIWorkerRequest = {
  state: GameState
  mode: GameMode
  difficulty: Difficulty
}

export type AIWorkerResponse = {
  move: number | { index: number; pieceSize: 'small' | 'medium' | 'large' } | null
}

self.onmessage = (e: MessageEvent<AIWorkerRequest>) => {
  const { state, mode, difficulty } = e.data
  let move: AIWorkerResponse['move'] = null
  try {
    if (mode === '3d') {
      move = calculateAIMove3D(state, difficulty)
    } else if (mode === 'stacked') {
      move = calculateAIMoveStacked(state, difficulty)
    } else {
      move = calculateAIMoveRegular(state, difficulty)
    }
  } catch (err) {
    console.error('AI worker error', err)
  }
  self.postMessage({ move } as AIWorkerResponse)
}
