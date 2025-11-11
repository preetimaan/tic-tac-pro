import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PieceProps {
  type: 'X' | 'O'
  position: [number, number, number]
  isWinning?: boolean
  isPreview?: boolean
}

export default function Piece({ type, position, isWinning = false, isPreview = false }: PieceProps) {
  const groupRef = useRef<THREE.Group>(null)
  const initialY = position[1]

  // Animation: piece drops from above (skip for preview)
  useFrame((state) => {
    if (groupRef.current && !isPreview) {
      const elapsed = state.clock.elapsedTime
      const dropAnimation = Math.min(1, elapsed * 2) // Fast drop
      const bounce = Math.sin(elapsed * 10) * 0.05 * (1 - dropAnimation)
      
      groupRef.current.position.y = initialY + (1 - dropAnimation) * 2 + bounce
      
      // Subtle rotation
      groupRef.current.rotation.y += 0.01
      
      // Winning piece pulse
      if (isWinning) {
        const scale = 1 + Math.sin(elapsed * 5) * 0.1
        groupRef.current.scale.set(scale, scale, scale)
      }
    } else if (groupRef.current && isPreview) {
      // Preview: floating animation
      const elapsed = state.clock.elapsedTime
      groupRef.current.position.y = initialY + 0.3 + Math.sin(elapsed * 3) * 0.1
      groupRef.current.rotation.y += 0.02
    }
  })

  const getColor = () => {
    if (isWinning) return "#178e17";
    if (isPreview) return type === 'X' ? '#4ecdc4' : '#ffe66d'
    return type === 'X' ? '#4ecdc4' : '#ffe66d'
  }

  return (
    <group ref={groupRef} position={[position[0], position[1] + (isPreview ? 0.3 : 2), position[2]]}>
      {type === 'X' ? (
        <XPiece color={getColor()} opacity={isPreview ? 0.5 : 1} />
      ) : (
        <OPiece color={getColor()} opacity={isPreview ? 0.5 : 1} />
      )}
    </group>
  )
}

function XPiece({ color, opacity = 1 }: { color: string; opacity?: number }) {
  const thickness = 0.2
  const size = 0.6

  return (
    <group>
      {/* First diagonal */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[size, thickness, thickness]} />
        <meshStandardMaterial
          color={color}
          metalness={0.1}
          roughness={0.6}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Second diagonal */}
      <mesh rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[size, thickness, thickness]} />
        <meshStandardMaterial
          color={color}
          metalness={0.1}
          roughness={0.6}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  )
}

function OPiece({ color, opacity = 1 }: { color: string; opacity?: number }) {
  return (
    <mesh>
      <torusGeometry args={[0.3, 0.1, 16, 32]} />
      <meshStandardMaterial
        color={color}
        metalness={0.1}
        roughness={0.6}
        transparent
        opacity={opacity}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}
