# Remote Multiplayer Implementation Guide

This guide explains how to implement remote multiplayer functionality using Supabase (free tier) with room codes, guest play, and timeout handling.

## Overview

Two remote players can play together by:
1. One player creates a game and gets a room code
2. Second player joins using the room code
3. Both players see real-time game state updates
4. Server validates all moves to prevent cheating
5. Games timeout after 5 minutes of inactivity

## Architecture

### Tech Stack
- **Backend**: Supabase (PostgreSQL + Realtime + Edge Functions)
- **Frontend**: React with Supabase client
- **Communication**: Supabase Realtime subscriptions (WebSocket-like)

### Database Schema

```sql
-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('regular', '3d', 'stacked')),
  
  -- Game state (stored as JSONB)
  board JSONB NOT NULL,
  current_player INTEGER NOT NULL CHECK (current_player IN (1, 2)),
  status TEXT NOT NULL CHECK (status IN ('waiting', 'playing', 'won', 'draw', 'timeout')),
  winner INTEGER CHECK (winner IN (1, 2)),
  winning_line JSONB,
  
  -- Stacked mode specific
  selected_piece_size TEXT CHECK (selected_piece_size IN ('small', 'medium', 'large')),
  remaining_pieces JSONB,
  
  -- Player identification (guest sessions)
  player_1_id TEXT NOT NULL,
  player_2_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_games_room_code ON games(room_code);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_last_activity ON games(last_activity);

-- Moves table (optional, for history/audit)
CREATE TABLE moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player INTEGER NOT NULL CHECK (player IN (1, 2)),
  move_index INTEGER NOT NULL,
  piece_size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_moves_game_id ON moves(game_id);
```

### Row-Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Anyone can read games (needed for joining)
CREATE POLICY "Anyone can read games" ON games
  FOR SELECT USING (true);

-- Only allow inserts through Edge Functions
-- (or restrict to authenticated users if you add auth later)

-- Only allow updates through Edge Functions
-- (prevents direct client updates)
```

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project (free tier)
3. Note your project URL and anon key

### 2. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 3. Create Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 4. Environment Variables

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Implementation

### 1. Room Code Generation

```typescript
// src/utils/roomCode.ts
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
```

### 2. Guest Session Management

```typescript
// src/utils/session.ts
const SESSION_KEY = 'tic-tac-pro-session-id'

export function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}
```

### 3. Supabase Edge Functions

Create Edge Functions for game operations:

#### Create Game Function

```typescript
// supabase/functions/create-game/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { roomCode, mode, playerId } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Initialize game state based on mode
    const initialState = getInitialGameState(mode)
    
    const { data, error } = await supabaseClient
      .from('games')
      .insert({
        room_code: roomCode,
        mode,
        board: initialState.board,
        current_player: initialState.currentPlayer,
        status: 'waiting',
        player_1_id: playerId,
        player_2_id: null,
        last_activity: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ game: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function getInitialGameState(mode: string) {
  const startingPlayer = Math.random() < 0.5 ? 1 : 2
  
  if (mode === 'stacked') {
    return {
      board: Array(9).fill(null).map(() => []),
      currentPlayer: startingPlayer,
      remainingPieces: {
        1: { small: 3, medium: 3, large: 3 },
        2: { small: 3, medium: 3, large: 3 },
      },
      selectedPieceSize: 'small',
    }
  }
  
  const boardSize = mode === '3d' ? 27 : 9
  return {
    board: Array(boardSize).fill(null),
    currentPlayer: startingPlayer,
  }
}
```

#### Join Game Function

```typescript
// supabase/functions/join-game/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { roomCode, playerId } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Find game
    const { data: game, error: fetchError } = await supabaseClient
      .from('games')
      .select('*')
      .eq('room_code', roomCode)
      .single()

    if (fetchError || !game) {
      throw new Error('Game not found')
    }

    if (game.status !== 'waiting') {
      throw new Error('Game is not waiting for players')
    }

    if (game.player_1_id === playerId) {
      throw new Error('You are already in this game')
    }

    // Join game
    const { data, error } = await supabaseClient
      .from('games')
      .update({
        player_2_id: playerId,
        status: 'playing',
        last_activity: new Date().toISOString(),
      })
      .eq('id', game.id)
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ game: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
```

#### Make Move Function

```typescript
// supabase/functions/make-move/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameId, playerId, moveIndex, pieceSize } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get current game state
    const { data: game, error: fetchError } = await supabaseClient
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (fetchError || !game) {
      throw new Error('Game not found')
    }

    // Validate player
    const playerNumber = game.player_1_id === playerId ? 1 : 
                        game.player_2_id === playerId ? 2 : null
    if (!playerNumber) {
      throw new Error('You are not a player in this game')
    }

    // Check timeout (5 minutes)
    const lastActivity = new Date(game.last_activity)
    const now = new Date()
    if (now.getTime() - lastActivity.getTime() > 5 * 60 * 1000) {
      throw new Error('Game has timed out')
    }

    // Validate move
    if (game.status !== 'playing') {
      throw new Error('Game is not in progress')
    }

    if (game.current_player !== playerNumber) {
      throw new Error('Not your turn')
    }

    // Validate move based on game mode
    const validationError = validateMove(game, moveIndex, pieceSize, playerNumber)
    if (validationError) {
      throw new Error(validationError)
    }

    // Apply move and update game state
    const newState = applyMove(game, moveIndex, pieceSize, playerNumber)
    
    // Update game in database
    const { data: updatedGame, error: updateError } = await supabaseClient
      .from('games')
      .update({
        board: newState.board,
        current_player: newState.currentPlayer,
        status: newState.status,
        winner: newState.winner,
        winning_line: newState.winningLine,
        selected_piece_size: newState.selectedPieceSize,
        remaining_pieces: newState.remainingPieces,
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId)
      .select()
      .single()

    if (updateError) throw updateError

    // Record move in moves table (optional)
    await supabaseClient
      .from('moves')
      .insert({
        game_id: gameId,
        player: playerNumber,
        move_index: moveIndex,
        piece_size: pieceSize,
      })

    return new Response(
      JSON.stringify({ game: updatedGame }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function validateMove(game: any, moveIndex: number, pieceSize: string | null, player: number): string | null {
  // Implement validation logic based on game mode
  // Return error message if invalid, null if valid
  // This should mirror client-side validation but be authoritative
  return null // Placeholder
}

function applyMove(game: any, moveIndex: number, pieceSize: string | null, player: number): any {
  // Apply move and calculate new game state
  // This should mirror client-side game logic
  return game // Placeholder
}
```

#### Timeout Cleanup Function

```typescript
// supabase/functions/cleanup-timeouts/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role for admin operations
    )

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    // Find timed out games
    const { data: timedOutGames, error } = await supabaseClient
      .from('games')
      .select('*')
      .eq('status', 'playing')
      .lt('last_activity', fiveMinutesAgo)

    if (error) throw error

    // Mark as timeout
    for (const game of timedOutGames || []) {
      await supabaseClient
        .from('games')
        .update({
          status: 'timeout',
          winner: game.current_player === 1 ? 2 : 1, // Other player wins
        })
        .eq('id', game.id)
    }

    return new Response(
      JSON.stringify({ cleaned: timedOutGames?.length || 0 }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### 4. Frontend Integration

#### Multiplayer Context

```typescript
// src/context/MultiplayerContext.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { GameState } from '../types/game'
import { getSessionId } from '../utils/session'
import { generateRoomCode } from '../utils/roomCode'

interface MultiplayerContextType {
  isMultiplayer: boolean
  roomCode: string | null
  playerNumber: 1 | 2 | null
  gameId: string | null
  createGame: (mode: GameMode) => Promise<void>
  joinGame: (code: string) => Promise<void>
  makeMove: (index: number, pieceSize?: PieceSize) => Promise<void>
  leaveGame: () => void
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined)

export function MultiplayerProvider({ children }: { children: React.ReactNode }) {
  const [isMultiplayer, setIsMultiplayer] = useState(false)
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [playerNumber, setPlayerNumber] = useState<1 | 2 | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)

  const createGame = async (mode: GameMode) => {
    const code = generateRoomCode()
    const playerId = getSessionId()

    const { data, error } = await supabase.functions.invoke('create-game', {
      body: { roomCode: code, mode, playerId },
    })

    if (error) throw error

    setRoomCode(code)
    setGameId(data.game.id)
    setPlayerNumber(1)
    setIsMultiplayer(true)

    // Subscribe to game updates
    subscribeToGame(data.game.id)
  }

  const joinGame = async (code: string) => {
    const playerId = getSessionId()

    const { data, error } = await supabase.functions.invoke('join-game', {
      body: { roomCode: code, playerId },
    })

    if (error) throw error

    setRoomCode(code)
    setGameId(data.game.id)
    setPlayerNumber(2)
    setIsMultiplayer(true)

    // Subscribe to game updates
    subscribeToGame(data.game.id)
  }

  const subscribeToGame = (id: string) => {
    const channel = supabase
      .channel(`game:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          // Update game state from server
          const game = payload.new as any
          // Dispatch to game context
        }
      )
      .subscribe()
  }

  const makeMove = async (index: number, pieceSize?: PieceSize) => {
    if (!gameId) return

    const { data, error } = await supabase.functions.invoke('make-move', {
      body: { gameId, playerId: getSessionId(), moveIndex: index, pieceSize },
    })

    if (error) throw error
    // State will update via subscription
  }

  const leaveGame = () => {
    setIsMultiplayer(false)
    setRoomCode(null)
    setPlayerNumber(null)
    setGameId(null)
  }

  return (
    <MultiplayerContext.Provider
      value={{
        isMultiplayer,
        roomCode,
        playerNumber,
        gameId,
        createGame,
        joinGame,
        makeMove,
        leaveGame,
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  )
}

export function useMultiplayer() {
  const context = useContext(MultiplayerContext)
  if (!context) {
    throw new Error('useMultiplayer must be used within MultiplayerProvider')
  }
  return context
}
```

#### UI Components

```typescript
// src/components/ui/MultiplayerMenu.tsx
export default function MultiplayerMenu() {
  const { createGame, joinGame, roomCode } = useMultiplayer()
  const [joinCode, setJoinCode] = useState('')
  const { gameMode } = useSettings()

  return (
    <div className="multiplayer-menu">
      <button onClick={() => createGame(gameMode)}>
        Create Game
      </button>
      
      {roomCode && (
        <div className="room-code">
          <p>Room Code: <strong>{roomCode}</strong></p>
          <button onClick={() => navigator.clipboard.writeText(roomCode)}>
            Copy
          </button>
        </div>
      )}
      
      <div className="join-game">
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Enter room code"
          maxLength={6}
        />
        <button onClick={() => joinGame(joinCode)}>
          Join Game
        </button>
      </div>
    </div>
  )
}
```

## Deployment

### 1. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy create-game
supabase functions deploy join-game
supabase functions deploy make-move
supabase functions deploy cleanup-timeouts
```

### 2. Set Up Cron Job

In Supabase Dashboard:
1. Go to Database → Cron Jobs
2. Create new cron job:
   - Schedule: `*/1 * * * *` (every minute)
   - Function: `cleanup-timeouts`

### 3. Environment Variables

Add to your frontend deployment (Netlify):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Testing Checklist

- [ ] Create game generates valid room code
- [ ] Join game with valid code works
- [ ] Join game with invalid code fails gracefully
- [ ] Moves are validated server-side
- [ ] Turn order is enforced
- [ ] Game state syncs in real-time
- [ ] Timeout works after 5 minutes
- [ ] Disconnection handling works
- [ ] All three game modes work
- [ ] Stacked mode piece selection works
- [ ] Multiple concurrent games work

## Security Considerations

1. **Move Validation**: All moves validated server-side
2. **Turn Enforcement**: Server checks current player
3. **Timeout**: Server enforces timeout rules
4. **Rate Limiting**: Consider adding rate limits to Edge Functions
5. **Input Sanitization**: Validate all inputs

## Cost Estimate (Free Tier)

- **Database**: 500MB (plenty for game states)
- **Bandwidth**: 2GB/month
- **Realtime**: Included
- **Edge Functions**: 500K invocations/month
- **Storage**: 1GB (if storing move history)

For low traffic, should stay within free tier limits.

