import { useEffect } from 'react'
import './RulesModal.css'

interface RulesModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Game Rules</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="rules-section">
            <h3>Regular Mode (X & O)</h3>
            <ul>
              <li>Classic 3×3 Tic-Tac-Toe with X and O pieces</li>
              <li>Players take turns placing their pieces on a 3×3 grid</li>
              <li>First player to get 3 pieces in a row (horizontal, vertical, or diagonal) wins</li>
              <li>If all 9 cells are filled with no winner, it's a draw</li>
              <li>Starting player is randomized each game</li>
              <li><strong>Winning Lines:</strong> 8 possible (3 rows, 3 columns, 2 diagonals)</li>
            </ul>
          </div>

          <div className="rules-section">
            <h3>3D Mode (Red & Blue)</h3>
            <ul>
              <li>3×3×3 cube Tic-Tac-Toe with Red spheres and Blue cubes</li>
              <li>Players take turns placing pieces in a 3×3×3 cube (27 cells total)</li>
              <li>First player to get 3 pieces in a row wins</li>
              <li>Winning lines can be:
                <ul>
                  <li>Within any layer (same as regular mode)</li>
                  <li>Vertical lines through layers</li>
                  <li>3D space diagonals through the cube</li>
                </ul>
              </li>
              <li>If all 27 cells are filled with no winner, it's a draw</li>
              <li>Starting player is randomized each game</li>
              <li><strong>Winning Lines:</strong> 37 possible (24 within-layer, 9 vertical, 4 space diagonals)</li>
            </ul>
          </div>

          <div className="rules-section">
            <h3>Controls</h3>
            <ul>
              <li><strong>Click</strong> on a cell to place your piece</li>
              <li><strong>Click + Drag</strong> to rotate the camera</li>
              <li><strong>Scroll</strong> to zoom in/out</li>
              <li><strong>Pan</strong> to move the camera</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

