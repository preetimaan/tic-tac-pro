# 3D Tic-Tac-Toe

A beautiful 3D Tic-Tac-Toe game built with React, Three.js, and Vite. Features multiple game modes with unique gameplay mechanics.

## Game Modes

### Regular Mode (X & O)

Classic 3×3 Tic-Tac-Toe with X and O pieces. Play against a friend or the computer.

**Rules:**
- Players take turns placing their pieces on a 3×3 grid
- First player to get 3 pieces in a row (horizontal, vertical, or diagonal) wins
- If all 9 cells are filled with no winner, it's a draw
- Starting player is randomized each game

**Human vs Computer (Regular only):**
- Choose **Human vs Human** or **Human vs Computer**
- When vs Computer: AI side (X or O) is chosen at random; select difficulty (Easy, Medium, Hard)
- Easy: random valid moves. Medium: Minimax depth 3. Hard: full Minimax with alpha-beta
- "AI is thinking..." shown on computer's turn; total games played is tracked and resets when you switch opponent type

**Winning Lines:** 8 possible (3 rows, 3 columns, 2 diagonals)

---

### 3D Mode (Red & Blue)

3×3×3 cube Tic-Tac-Toe with Red spheres and Blue cubes.

**Rules:**
- Players take turns placing pieces in a 3×3×3 cube (27 cells total)
- First player to get 3 pieces in a row wins
- Winning lines can be:
  - Within any layer (same as regular mode)
  - Vertical lines through layers
  - 3D space diagonals through the cube
- If all 27 cells are filled with no winner, it's a draw
- Starting player is randomized each game

**Winning Lines:** 37 possible
- 24 within-layer wins (8 per layer × 3 layers)
- 9 vertical lines through layers
- 4 space diagonals through the cube

---

### Stacked Mode (Blue & Pink)

3×3 Tic-Tac-Toe with stackable pieces of different sizes.

**Rules:**
- Each player has 9 pieces: 3 small, 3 medium, 3 large
- Players take turns placing pieces on a 3×3 grid
- Pieces can be placed on:
  - Empty cells
  - Cells occupied by smaller pieces (stacking)
- Only larger pieces can be placed on smaller pieces (from either player)
- Stacking keeps both pieces in place, but only the top piece counts for wins
- First player to get 3 top pieces in a row (horizontal, vertical, or diagonal) wins
- If all pieces are placed with no winner, it's a draw
- Starting player is randomized each game

**Piece Sizes:**
- Small pieces (3 per player)
- Medium pieces (3 per player)
- Large pieces (3 per player)

**Visual Design:**
- Pieces are designed like nested dolls with cylindrical bodies and semi-sphere tops
- Stacked pieces show size progression visually

**Winning Lines:** 8 possible (3 rows, 3 columns, 2 diagonals) - only top pieces count

---

## Controls

- **Click** on a cell to place your piece
- **Click + Drag** to rotate the camera
- **Scroll** to zoom in/out
- **Pan** to move the camera

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## Tech Stack

- React 18
- Three.js (via @react-three/fiber)
- @react-three/drei for helpers
- Vite for fast development
- TypeScript

## Features

- 🎮 Multiple game modes (Regular, 3D, Stacked)
- 🤖 **Human vs Computer** in Regular mode (Easy / Medium / Hard AI, Minimax)
- ✨ Smooth animations and visual effects
- 🎯 Win detection with highlighted winning line
- 📊 Score tracking and total games played count
- 🎨 Modern, polished UI
- 🖱️ Intuitive camera controls
- 🎲 Randomized starting player

## Future Enhancements

- AI for 3D and Stacked modes
- Sound effects
- Particle effects on win
- Online multiplayer
