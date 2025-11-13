import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { StackedPiece as StackedPieceType, PieceSize } from '../../types/game'
import { MODE_CONFIGS } from '../../types/game'
import { useSettings } from '../../context/SettingsContext'

interface StackedPieceProps {
  stack: StackedPieceType[]
  position: [number, number, number]
  isWinning?: boolean
  isPreview?: boolean
  previewSize?: PieceSize
  previewPlayerId?: 1 | 2
}

const SIZE_SCALE: Record<PieceSize, number> = {
  small: 0.6,
  medium: 0.8,
  large: 1.0,
}

const SIZE_HEIGHT: Record<PieceSize, number> = {
  small: 0.45,
  medium: 0.6,
  large: 0.75,
}

export default function StackedPiece({
  stack,
  position,
  isWinning = false,
  isPreview = false,
  previewSize,
  previewPlayerId,
}: StackedPieceProps) {
  const groupRef = useRef<THREE.Group>(null)
  const initialY = position[1]
  const { gameMode } = useSettings()
  const config = MODE_CONFIGS[gameMode]

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

  // Render preview piece if provided
  if (isPreview && previewSize && previewPlayerId) {
    const player = previewPlayerId === 1 ? config.player1 : config.player2
    
    return (
      <group ref={groupRef} position={[position[0], position[1] + (isPreview ? 0.3 : 2), position[2]]}>
        <NestedDollPiece
          color={player.color}
          size={previewSize}
          opacity={0.5}
          yOffset={0}
        />
      </group>
    )
  }

  // Render only the top piece in the stack (hide smaller pieces underneath)
  if (stack.length === 0) {
    return null
  }
  
  const topPiece = stack[stack.length - 1]
  const player = topPiece.playerId === 1 ? config.player1 : config.player2

  return (
    <group ref={groupRef} position={[position[0], position[1] + (isPreview ? 0.3 : 2), position[2]]}>
      <NestedDollPiece
        color={player.color}
        size={topPiece.size}
        opacity={1}
        yOffset={0}
        isWinning={isWinning}
      />
    </group>
  )
}

interface NestedDollPieceProps {
  color: string
  size: PieceSize
  opacity: number
  yOffset: number
  isWinning?: boolean
}

function NestedDollPiece({ color, size, opacity, yOffset, isWinning = false }: NestedDollPieceProps) {
  const scale = SIZE_SCALE[size]
  const height = SIZE_HEIGHT[size]
  const radius = 0.3 * scale
  const cylinderHeight = height * 0.7
  const sphereRadius = radius
  
  const finalColor = isWinning ? '#178e17' : color

  // Create a single custom geometry for seamless cylinder + hemisphere
  const customGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const segments = 32
    const hemisphereSegments = 16
    
    const vertices: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    
    let vertexIndex = 0
    
    // Cylinder body (without top cap)
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      
      // Bottom vertex
      vertices.push(x, 0, z)
      normals.push(x / radius, 0, z / radius)
      uvs.push(i / segments, 0)
      
      // Top vertex (at cylinderHeight)
      vertices.push(x, cylinderHeight, z)
      normals.push(x / radius, 0, z / radius)
      uvs.push(i / segments, 0.7)
    }
    
    // Cylinder indices
    for (let i = 0; i < segments; i++) {
      const base = i * 2
      indices.push(base, base + 1, base + 2)
      indices.push(base + 1, base + 3, base + 2)
    }
    
    vertexIndex = (segments + 1) * 2
    
    // Hemisphere top (seamlessly connected to cylinder)
    const startVertexIndex = vertexIndex
    for (let j = 0; j <= hemisphereSegments; j++) {
      const phi = (j / hemisphereSegments) * (Math.PI / 2) // 0 to PI/2
      const y = Math.sin(phi) * sphereRadius
      const r = Math.cos(phi) * sphereRadius
      
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2
        const x = Math.cos(theta) * r
        const z = Math.sin(theta) * r
        
        const ny = Math.sin(phi)
        const nx = Math.cos(phi) * Math.cos(theta)
        const nz = Math.cos(phi) * Math.sin(theta)
        
        vertices.push(x, cylinderHeight + y, z)
        normals.push(nx, ny, nz)
        uvs.push(i / segments, 0.7 + (j / hemisphereSegments) * 0.3)
        
        if (i < segments && j < hemisphereSegments) {
          const base = startVertexIndex + j * (segments + 1) + i
          indices.push(base, base + segments + 1, base + 1)
          indices.push(base + 1, base + segments + 1, base + segments + 2)
        }
      }
    }
    
    // Connect cylinder top to hemisphere bottom
    const hemisphereBottomStart = startVertexIndex
    for (let i = 0; i < segments; i++) {
      const cylTop = i * 2 + 1 // Top vertex of cylinder at segment i
      const hemBot1 = hemisphereBottomStart + i
      const hemBot2 = hemisphereBottomStart + ((i + 1) % (segments + 1))
      
      indices.push(cylTop, hemBot1, hemBot2)
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    
    return geometry
  }, [radius, cylinderHeight, sphereRadius])

  return (
    <group position={[0, yOffset, 0]}>
      <mesh geometry={customGeometry}>
        <meshStandardMaterial
          color={finalColor}
          metalness={0.1}
          roughness={0.6}
          transparent
          opacity={opacity}
          emissive={finalColor}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  )
}

