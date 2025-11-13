import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import Board from './Board'
import Board3D from './Board3D'
import BoardStacked from './BoardStacked'
import { useSettings } from '../../context/SettingsContext'

export default function GameScene() {
  const { gameMode } = useSettings()
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      // Subtle rotation animation
      groupRef.current.rotation.y += 0.001
    }
  })

  return (
    <group ref={groupRef}>
      {gameMode === '3d' ? (
        <Board3D />
      ) : gameMode === 'stacked' ? (
        <BoardStacked />
      ) : (
        <Board />
      )}
    </group>
  )
}

