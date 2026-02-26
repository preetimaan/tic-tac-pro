# AI Implementation Guide - Human vs Computer Mode

**Status:** Regular (3×3) and 3D (3×3×3) modes are implemented. This guide describes the approach and can be used to extend AI to Stacked mode.

The AI uses the Minimax algorithm with alpha-beta pruning. Three difficulty levels are supported.

## Overview

The AI will use Minimax algorithm to evaluate all possible moves and choose the best one. We'll support three difficulty levels:
- **Easy**: Random valid moves (for beginners)
- **Medium**: Minimax with limited depth (2-3 moves ahead)
- **Hard**: Full Minimax with alpha-beta pruning (optimal play)

## Architecture

### 1. AI Player Type

Add AI player type to game state:

```typescript
// src/types/game.ts
export type PlayerType = 'human' | 'ai'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface GameState {
  // ... existing fields
  player1Type?: PlayerType
  player2Type?: PlayerType
  aiDifficulty?: Difficulty
}
```

### 2. AI Move Calculation

Create AI utility functions:

```typescript
// src/utils/ai.ts
import { GameState, GameMode, PlayerId, PieceSize } from '../types/game'
import { checkWinner as checkWinnerRegular, checkDraw as checkDrawRegular } from './gameLogic'
import { checkWinner as checkWinner3D, checkDraw as checkDraw3D } from './gameLogic3D'
import { checkWinner as checkWinnerStacked, checkDraw as checkDrawStacked, canPlacePiece } from './gameLogicStacked'

export function calculateAIMove(
  state: GameState,
  difficulty: Difficulty
): number | null {
  if (difficulty === 'easy') {
    return getRandomValidMove(state)
  }
  
  const depth = difficulty === 'medium' ? 3 : 10
  return minimax(state, depth, -Infinity, Infinity, true).move
}

function getRandomValidMove(state: GameState): number | null {
  const validMoves = getValidMoves(state)
  if (validMoves.length === 0) return null
  return validMoves[Math.floor(Math.random() * validMoves.length)]
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean
): { score: number; move: number | null } {
  // Terminal states
  if (state.status === 'won') {
    return { 
      score: state.winner === state.currentPlayer ? 100 : -100, 
      move: null 
    }
  }
  if (state.status === 'draw') {
    return { score: 0, move: null }
  }
  if (depth === 0) {
    return { score: evaluatePosition(state), move: null }
  }

  const validMoves = getValidMoves(state)
  if (validMoves.length === 0) {
    return { score: 0, move: null }
  }

  let bestMove = validMoves[0]
  let bestScore = maximizing ? -Infinity : Infinity

  for (const move of validMoves) {
    const newState = makeMoveInState(state, move)
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
    
    if (beta <= alpha) break // Alpha-beta pruning
  }

  return { score: bestScore, move: bestMove }
}

function evaluatePosition(state: GameState): number {
  // Heuristic evaluation of board position
  // Positive = good for current player, Negative = bad
  // This is a simple evaluation - can be improved
  
  if (state.mode === 'stacked') {
    return evaluateStackedPosition(state)
  } else if (state.mode === '3d') {
    return evaluate3DPosition(state)
  } else {
    return evaluateRegularPosition(state)
  }
}

function evaluateRegularPosition(state: GameState): number {
  const board = state.board as PlayerId[]
  const currentPlayer = state.currentPlayer
  const opponent = currentPlayer === 1 ? 2 : 1
  
  let score = 0
  
  // Check all winning lines
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ]
  
  for (const line of lines) {
    const [a, b, c] = line
    const values = [board[a], board[b], board[c]]
    const currentCount = values.filter(v => v === currentPlayer).length
    const opponentCount = values.filter(v => v === opponent).length
    const emptyCount = values.filter(v => v === null).length
    
    if (currentCount === 2 && emptyCount === 1) score += 10 // Two in a row
    if (opponentCount === 2 && emptyCount === 1) score -= 10 // Block opponent
    if (currentCount === 3) score += 100 // Win
    if (opponentCount === 3) score -= 100 // Loss
  }
  
  return score
}

function evaluate3DPosition(state: GameState): number {
  // Similar to regular but check 3D winning lines
  // More complex - check all 37 possible winning lines
  // Implementation similar to regular but with 3D coordinates
  return 0 // Placeholder - implement based on 3D win detection
}

function evaluateStackedPosition(state: GameState): number {
  // Evaluate based on top pieces only
  // Consider piece sizes and remaining pieces
  return 0 // Placeholder - implement based on stacked logic
}

function getValidMoves(state: GameState): number[] {
  if (state.mode === 'stacked') {
    return getValidStackedMoves(state)
  }
  
  const board = state.board as PlayerId[]
  const moves: number[] = []
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      moves.push(i)
    }
  }
  return moves
}

function getValidStackedMoves(state: GameState): number[] {
  if (!state.selectedPieceSize || !state.remainingPieces) return []
  
  const board = state.board as StackedPiece[][]
  const moves: number[] = []
  
  for (let i = 0; i < board.length; i++) {
    if (canPlacePiece(board, i, state.selectedPieceSize)) {
      moves.push(i)
    }
  }
  
  return moves
}

function makeMoveInState(state: GameState, moveIndex: number): GameState {
  // Create a new state with the move applied
  // This should mirror the logic in gameReducer but return new state
  // Implementation depends on game mode
  return { ...state } // Placeholder
}
```

### 3. Update Game Context

Modify `GameContext` to handle AI moves:

```typescript
// src/context/GameContext.tsx

// Add to GameContextType
interface GameContextType {
  // ... existing
  player1Type: PlayerType
  player2Type: PlayerType
  aiDifficulty: Difficulty
  setPlayerTypes: (p1: PlayerType, p2: PlayerType) => void
  setAIDifficulty: (difficulty: Difficulty) => void
}

// In GameProvider, add effect to trigger AI moves
useEffect(() => {
  if (state.status === 'playing') {
    const currentPlayerType = state.currentPlayer === 1 
      ? player1Type 
      : player2Type
    
    if (currentPlayerType === 'ai') {
      // Add delay for "thinking" effect
      const timer = setTimeout(() => {
        const move = calculateAIMove(state, aiDifficulty)
        if (move !== null) {
          handleMakeMove(move)
        }
      }, 500 + Math.random() * 1000) // 0.5-1.5 second delay
      
      return () => clearTimeout(timer)
    }
  }
}, [state.currentPlayer, state.status, player1Type, player2Type, aiDifficulty])
```

### 4. UI Components

Create player selection UI:

```typescript
// src/components/ui/PlayerSelector.tsx
import { useState } from 'react'
import { PlayerType, Difficulty } from '../../types/game'

interface PlayerSelectorProps {
  player1Type: PlayerType
  player2Type: PlayerType
  aiDifficulty: Difficulty
  onPlayer1Change: (type: PlayerType) => void
  onPlayer2Change: (type: PlayerType) => void
  onDifficultyChange: (difficulty: Difficulty) => void
}

export default function PlayerSelector({
  player1Type,
  player2Type,
  aiDifficulty,
  onPlayer1Change,
  onPlayer2Change,
  onDifficultyChange,
}: PlayerSelectorProps) {
  return (
    <div className="player-selector">
      <div className="player-option">
        <label>Player 1:</label>
        <select 
          value={player1Type} 
          onChange={(e) => onPlayer1Change(e.target.value as PlayerType)}
        >
          <option value="human">Human</option>
          <option value="ai">AI</option>
        </select>
      </div>
      
      <div className="player-option">
        <label>Player 2:</label>
        <select 
          value={player2Type} 
          onChange={(e) => onPlayer2Change(e.target.value as PlayerType)}
        >
          <option value="human">Human</option>
          <option value="ai">AI</option>
        </select>
      </div>
      
      {(player1Type === 'ai' || player2Type === 'ai') && (
        <div className="difficulty-option">
          <label>AI Difficulty:</label>
          <select 
            value={aiDifficulty} 
            onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      )}
    </div>
  )
}
```

### 5. AI Thinking Indicator

Add visual feedback when AI is thinking:

```typescript
// src/components/ui/AIThinkingIndicator.tsx
export default function AIThinkingIndicator() {
  return (
    <div className="ai-thinking">
      <span>AI is thinking...</span>
      <div className="spinner" />
    </div>
  )
}

// In UIOverlay, show when it's AI's turn
{state.currentPlayer === 1 && player1Type === 'ai' && state.status === 'playing' && (
  <AIThinkingIndicator />
)}
{state.currentPlayer === 2 && player2Type === 'ai' && state.status === 'playing' && (
  <AIThinkingIndicator />
)}
```

## Implementation Steps

### Step 1: Create AI Utilities
1. Create `src/utils/ai.ts` with Minimax implementation
2. Implement `calculateAIMove()` function
3. Implement evaluation functions for each game mode
4. Test with simple cases

### Step 2: Update Game Types
1. Add `PlayerType` and `Difficulty` types
2. Update `GameState` interface
3. Update `GameContextType` interface

### Step 3: Modify Game Context
1. Add player type state
2. Add AI difficulty state
3. Add effect to trigger AI moves
4. Prevent human moves when it's AI's turn

### Step 4: Create UI Components
1. Create `PlayerSelector` component
2. Add to settings or main UI
3. Create `AIThinkingIndicator` component
4. Integrate into game overlay

### Step 5: Testing
1. Test Easy AI (should make random moves)
2. Test Medium AI (should be beatable)
3. Test Hard AI (should be very difficult)
4. Test all game modes with AI
5. Test AI vs AI (should result in draws)

## Mode-Specific Considerations

### Regular Mode
- Simplest to implement
- 9 possible moves per turn
- 8 winning lines to check
- Good starting point for testing

### 3D Mode
- 27 possible moves per turn
- 37 winning lines to check
- More complex evaluation
- May need deeper search for hard difficulty

### Stacked Mode
- Most complex
- Must consider piece sizes
- Valid moves depend on selected piece size
- Evaluation must consider remaining pieces
- Top piece only counts for wins

## Performance Optimization

1. **Memoization**: Cache evaluated positions
2. **Early Termination**: Stop searching if win/loss found
3. **Move Ordering**: Try best moves first (alpha-beta pruning benefit)
4. **Transposition Table**: Store previously evaluated positions
5. **Iterative Deepening**: Start shallow, go deeper if time allows

## Difficulty Tuning

- **Easy**: Pure random (0% optimal)
- **Medium**: Depth 2-3, some randomness (60-70% optimal)
- **Hard**: Full depth, optimal play (100% optimal)

Can also add:
- **Very Easy**: Random but avoids obvious mistakes
- **Expert**: Hard + opening book for perfect play

## Testing Checklist

- [ ] AI makes valid moves only
- [ ] AI respects game rules (turn order, piece sizes)
- [ ] Easy AI is beatable
- [ ] Hard AI is challenging
- [ ] AI works in all three game modes
- [ ] AI handles edge cases (near win, near loss)
- [ ] No infinite loops or hangs
- [ ] Performance is acceptable (< 2 seconds per move)
- [ ] AI vs AI games complete successfully

## Future Enhancements

1. **Opening Book**: Pre-computed best first moves
2. **Endgame Tablebase**: Perfect play for endgame positions
3. **Learning AI**: Improve over time (machine learning)
4. **Adaptive Difficulty**: Adjust based on player skill
5. **Move Hints**: Show best move to human players (optional)

