import { useRef } from 'react'
import { useGame } from '../../context/GameContext'
import { useSettings } from '../../context/SettingsContext'
import { StackedPiece } from '../../types/game'
import { canPlacePiece } from '../../utils/gameLogicStacked'
import * as THREE from 'three'

interface CellProps {
  index: number
  position: [number, number, number]
  onHover: (hovered: boolean) => void
}

export default function Cell({ index, position, onHover }: CellProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { state, makeMove } = useGame()
  const { gameMode } = useSettings()

  const canPlace = () => {
    if (state.status !== 'playing') return false
    
    if (gameMode === 'stacked') {
      if (!state.selectedPieceSize || !state.remainingPieces) return false
      
      const board = state.board as StackedPiece[][]
      const playerPieces = state.remainingPieces[state.currentPlayer]
      
      // Check if player has pieces of selected size
      if (playerPieces[state.selectedPieceSize] === 0) return false
      
      // Check if can place piece on this cell
      return canPlacePiece(board, index, state.selectedPieceSize)
    } else {
      // Regular and 3D modes
      const board = state.board as any[]
      return board[index] === null
    }
  }

  const handleClick = (event: any) => {
    event.stopPropagation()
    if (canPlace()) {
      makeMove(index)
    }
  }

  const handlePointerOver = (event: any) => {
    event.stopPropagation()
    if (canPlace()) {
      onHover(true)
    }
  }

  const handlePointerOut = () => {
    onHover(false)
  }

  const isHoverable = canPlace()

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <boxGeometry args={[1, 0.1, 1]} />
      <meshStandardMaterial
        color={isHoverable ? '#f0f0f0' : '#ffffff'}
        transparent
        opacity={isHoverable ? 0.7 : 0.9}
      />
    </mesh>
  )
}

