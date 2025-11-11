import { useRef } from 'react'
import { useGame } from '../../context/GameContext'
import * as THREE from 'three'

interface CellProps {
  index: number
  position: [number, number, number]
  onHover: (hovered: boolean) => void
}

export default function Cell({ index, position, onHover }: CellProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { state, makeMove } = useGame()

  const handleClick = (event: any) => {
    event.stopPropagation()
    if (state.status === 'playing' && state.board[index] === null) {
      makeMove(index)
    }
  }

  const handlePointerOver = (event: any) => {
    event.stopPropagation()
    if (state.status === 'playing' && state.board[index] === null) {
      onHover(true)
    }
  }

  const handlePointerOut = () => {
    onHover(false)
  }

  const isHoverable = state.status === 'playing' && state.board[index] === null

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

