import { useGame } from '../../context/GameContext'
import { useSettings } from '../../context/SettingsContext'
import { MODE_CONFIGS, PieceSize } from '../../types/game'
import './PieceSelectorModal.css'

export default function PieceSelectorModal() {
  const { state, setSelectedPieceSize } = useGame()
  const { gameMode } = useSettings()
  
  if (gameMode !== 'stacked' || !state.remainingPieces || !state.selectedPieceSize) {
    return null
  }

  const config = MODE_CONFIGS[gameMode]
  const currentPlayerName = state.currentPlayer === 1 ? config.player1.name : config.player2.name
  const currentPlayerColor = state.currentPlayer === 1 ? config.player1.color : config.player2.color

  return (
    <div className="piece-selector-modal">
      <div className="piece-selector-modal-content">
        <div className="piece-selector-section">
          <div className="piece-selector-player-name-container">
            <label className="piece-selector-label">Select Piece Size:</label>
            <div
              className="piece-selector-player-name"
              style={{ color: currentPlayerColor }}
            >
              {currentPlayerName}'s Turn
            </div>
          </div>
          <div className="piece-size-options">
            {(["small", "medium", "large"] as PieceSize[]).map((size) => {
              const remaining =
                state.remainingPieces![state.currentPlayer][size];
              const isSelected = state.selectedPieceSize === size;
              const isDisabled = remaining === 0;

              return (
                <button
                  key={size}
                  className={`piece-size-button ${isSelected ? "active" : ""} ${
                    isDisabled ? "disabled" : ""
                  }`}
                  onClick={() => setSelectedPieceSize?.(size)}
                  disabled={isDisabled || state.status !== "playing"}
                  title={
                    isDisabled
                      ? `No ${size} pieces remaining`
                      : `Select ${size} piece (${remaining} remaining)`
                  }
                >
                  <span className="piece-size-label">
                    {size.charAt(0).toUpperCase() + size.slice(1)} ({remaining})
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

