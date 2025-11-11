import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import Board from './Board'

export default function GameScene() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      // Subtle rotation animation
      groupRef.current.rotation.y += 0.001
    }
  })

  return (
    <group ref={groupRef}>
      <Board />
    </group>
  )
}

