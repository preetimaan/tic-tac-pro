import { useMemo, useState } from 'react'
import { useGame } from '../../context/GameContext'
import Cell from './Cell'
import Piece from './Piece'

const BOARD_SIZE = 3
const CELL_SIZE = 1
const CELL_SPACING = 1.2
const BOARD_OFFSET = ((BOARD_SIZE - 1) * CELL_SPACING) / 2
const LAYER_SPACING = 1.25 // Spacing between layers in 3D mode

export default function Board3D() {
  const { state } = useGame()
  const [hoveredCell, setHoveredCell] = useState<number | null>(null)

  // Generate 3D cube cell positions (3x3x3 = 27 cells)
  const cells = useMemo(() => {
    const cellPositions = []
    
    for (let layer = 0; layer < BOARD_SIZE; layer++) {
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const index = layer * 9 + row * BOARD_SIZE + col
          
          // 3D cube positioning:
          // X: horizontal (columns)
          // Y: vertical (layers, going up)
          // Z: depth (rows, going back)
          const x = col * CELL_SPACING - BOARD_OFFSET
          const y = layer * LAYER_SPACING
          const z = row * CELL_SPACING - BOARD_OFFSET
          
          cellPositions.push({
            index,
            position: [x, y, z] as [number, number, number],
          })
        }
      }
    }
    
    return cellPositions
  }, [])

  // Calculate board dimensions
  const boardWidth = (BOARD_SIZE - 1) * CELL_SPACING + CELL_SIZE
  const boardHeight = (BOARD_SIZE - 1) * CELL_SPACING + CELL_SIZE

  return (
    <group>
      {/* Base platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <boxGeometry args={[boardWidth + 0.4, boardHeight + 0.4, 0.2]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Cells */}
      {cells.map(({ index, position }) => {
        const board = state.board as (1 | 2 | null)[]
        const cellValue = board[index]
        return (
          <group key={index}>
            <Cell
              index={index}
              position={position}
              onHover={(hovered) => setHoveredCell(hovered ? index : null)}
            />
            {cellValue && (
              <Piece
                playerId={cellValue}
                position={position}
                isWinning={state.winningLine?.includes(index) ?? false}
              />
            )}
            {hoveredCell === index && !cellValue && state.status === 'playing' && (
              <Piece
                playerId={state.currentPlayer}
                position={position}
                isPreview={true}
              />
            )}
          </group>
        )
      })}
    </group>
  )
}

