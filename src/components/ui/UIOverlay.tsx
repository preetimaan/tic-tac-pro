import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { useSettings } from '../../context/SettingsContext'
import { MODE_CONFIGS, GameMode } from '../../types/game'
import RulesModal from './RulesModal'
import './UIOverlay.css'

export default function UIOverlay() {
  const { state, resetGame } = useGame()
  const { gameMode, setGameMode } = useSettings()
  const config = MODE_CONFIGS[gameMode]
  const [showRules, setShowRules] = useState(false)
  // Allow switching if no pieces have been placed yet
  const hasPiecesPlaced = state.board.some(cell => cell !== null)
  const isGameActive = state.status === 'playing' && hasPiecesPlaced

  const getStatusMessage = () => {
    if (state.status === 'won') {
      const winnerName = state.winner === 1 ? config.player1.name : config.player2.name
      return `${winnerName} Wins!`
    }
    if (state.status === 'draw') {
      return "It's a Draw!"
    }
    const currentPlayerName = state.currentPlayer === 1 ? config.player1.name : config.player2.name
    return `${currentPlayerName}'s Turn`
  }

  const handleModeChange = (mode: GameMode) => {
    if (!isGameActive) {
      // Reset game when switching modes
      if (gameMode !== mode) {
        resetGame()
      }
      setGameMode(mode)
    }
  }

  return (
    <>
      <div className="ui-overlay">
        <div className="ui-panel">
          <div className="title-section">
            <h1 className="title">3D Tic-Tac-Toe</h1>
            <button className="rules-button" onClick={() => setShowRules(true)} title="View Game Rules">
              ?
            </button>
          </div>
        
        <div className="avatar-selector">
          <label>Game Mode:</label>
          {isGameActive && (
            <div className="avatar-lock-message">
              Finish or reset current game to switch modes
            </div>
          )}
          <div className="avatar-options">
            <button
              className={`avatar-button ${gameMode === 'regular' ? 'active' : ''} ${isGameActive ? 'disabled' : ''}`}
              onClick={() => handleModeChange('regular')}
              disabled={isGameActive}
              title={isGameActive ? 'Finish or reset current game to switch' : 'Regular Tic-Tac-Toe (X & O)'}
            >
              Regular
            </button>
            <button
              className={`avatar-button ${gameMode === '3d' ? 'active' : ''} ${isGameActive ? 'disabled' : ''}`}
              onClick={() => handleModeChange('3d')}
              disabled={isGameActive}
              title={isGameActive ? 'Finish or reset current game to switch' : '3D Tic-Tac-Toe (Red & Blue)'}
            >
              3D
            </button>
          </div>
          <div className="game-mode-indicator">
            Players: <span className="mode-name">{config.player1.name} & {config.player2.name}</span>
          </div>
        </div>
        
        <div className="scores">
          <div className="score-item">
            <span className="score-label">{config.player1.name}</span>
            <span className="score-value">{state.scores[1]}</span>
          </div>
          <div className="score-item">
            <span className="score-label">{config.player2.name}</span>
            <span className="score-value">{state.scores[2]}</span>
          </div>
        </div>

        <div className={`status ${state.status}`}>
          {getStatusMessage()}
        </div>

        <button className="reset-button" onClick={resetGame}>
          Reset Game
        </button>

        <div className="instructions">
          <p>Click on a cell to place your piece</p>
          <p>Rotate: Click + Drag | Zoom: Scroll</p>
        </div>
        </div>
      </div>
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </>
  )
}
