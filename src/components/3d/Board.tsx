import { useMemo, useState } from 'react'
import { useGame } from '../../context/GameContext'
import Cell from './Cell'
import Piece from './Piece'

const BOARD_SIZE = 3
const CELL_SIZE = 1
const CELL_SPACING = 1.2
const BOARD_OFFSET = ((BOARD_SIZE - 1) * CELL_SPACING) / 2

export default function Board() {
  const { state } = useGame()
  const [hoveredCell, setHoveredCell] = useState<number | null>(null)

  const cells = useMemo(() => {
    const cellPositions = []
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const index = row * BOARD_SIZE + col
        cellPositions.push({
          index,
          position: [
            col * CELL_SPACING - BOARD_OFFSET,
            0,
            row * CELL_SPACING - BOARD_OFFSET,
          ] as [number, number, number],
        })
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

      {/* Vertical grid lines (along Z axis, separating columns) */}
      {[1, 2].map((i) => (
        <mesh
          key={`vertical-${i}`}
          position={[
            (i - 0.5) * CELL_SPACING - BOARD_OFFSET,
            0.01,
            0,
          ]}
        >
          <boxGeometry args={[0.02, 0.05, boardHeight]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      ))}

      {/* Horizontal grid lines (along X axis, separating rows) */}
      {[1, 2].map((i) => (
        <mesh
          key={`horizontal-${i}`}
          position={[
            0,
            0.01,
            (i - 0.5) * CELL_SPACING - BOARD_OFFSET,
          ]}
        >
          <boxGeometry args={[boardWidth, 0.05, 0.02]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      ))}

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
