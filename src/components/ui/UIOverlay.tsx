import { useState, useEffect } from 'react'
import { useGame } from '../../context/GameContext'
import { useSettings } from '../../context/SettingsContext'
import { MODE_CONFIGS, GameMode, StackedPiece } from '../../types/game'
import RulesModal from './RulesModal'
import PieceSelectorModal from './PieceSelectorModal'
import PlayerSelector from './PlayerSelector'
import AIThinkingIndicator from './AIThinkingIndicator'
import './UIOverlay.css'

export default function UIOverlay() {
  const { state, resetGame, opponentType, aiPlayerId, aiDifficulty, totalGamesPlayed, setOpponentType, setAIDifficulty } = useGame()
  const { gameMode, setGameMode } = useSettings()
  const config = MODE_CONFIGS[gameMode]
  const [showRules, setShowRules] = useState(false)
  const [countdown, setCountdown] = useState(30)
  // Allow switching if no pieces have been placed yet
  const hasPiecesPlaced = gameMode === 'stacked'
    ? Array.isArray(state.board) && (state.board as StackedPiece[][]).some(stack => Array.isArray(stack) && stack.length > 0)
    : Array.isArray(state.board) && (state.board as any[]).some(cell => cell !== null)
  const isGameActive = state.status === 'playing' && hasPiecesPlaced
  const showGameOverlay = state.status === 'won' || state.status === 'draw'

  const isVsComputer = gameMode === 'regular' && opponentType === 'computer' && aiPlayerId !== null
  const getPlayerLabel = (playerId: 1 | 2) => {
    const name = playerId === 1 ? config.player1.name : config.player2.name
    if (!isVsComputer) return name
    return aiPlayerId === playerId ? `${name} (Computer)` : `${name} (You)`
  }

  const getWinMessage = () => {
    if (state.status !== 'won' || !state.winner) return ''
    if (isVsComputer && state.winner !== aiPlayerId) return 'You Win!'
    if (isVsComputer && state.winner === aiPlayerId) return 'Computer Wins!'
    const winnerLabel = state.winner === 1 ? getPlayerLabel(1) : getPlayerLabel(2)
    return `${winnerLabel} Wins!`
  }

  // Countdown timer for auto-reset
  useEffect(() => {
    if (showGameOverlay) {
      setCountdown(30)
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    } else {
      setCountdown(30)
    }
  }, [showGameOverlay])

  const getStatusMessage = () => {
    if (state.status === 'won') {
      return getWinMessage()
    }
    if (state.status === 'draw') {
      return "It's a Draw!"
    }
    const pieceName = state.currentPlayer === 1 ? config.player1.name : config.player2.name
    if (isVsComputer) {
      const isHumanTurn = state.currentPlayer !== aiPlayerId
      return isHumanTurn ? `${pieceName}'s (Your) Turn` : `${pieceName} (Computer)'s Turn`
    }
    return `${pieceName}'s Turn`
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

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only reset if clicking the overlay itself, not the content
    if (e.target === e.currentTarget) {
      resetGame()
    }
  }

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent clicks on content from closing the modal
    e.stopPropagation()
  }

  return (
    <>
      {showGameOverlay && (
        <div className="game-over-overlay" onClick={handleOverlayClick}>
          <div className="game-over-content" onClick={handleContentClick}>
            <h2 className="game-over-title">
              {state.status === 'won' 
                ? getWinMessage()
                : "It's a Draw!"}
            </h2>
            <p className="game-over-subtitle">
              Game will reset in {countdown} seconds
            </p>
          </div>
        </div>
      )}
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
            <button
              className={`avatar-button ${gameMode === 'stacked' ? 'active' : ''} ${isGameActive ? 'disabled' : ''}`}
              onClick={() => handleModeChange('stacked')}
              disabled={isGameActive}
              title={isGameActive ? 'Finish or reset current game to switch' : 'Stacked Tic-Tac-Toe (Red & Blue)'}
            >
              Stacked
            </button>
          </div>
          <div className="game-mode-indicator">
            Players: <span className="mode-name">{getPlayerLabel(1)} & {getPlayerLabel(2)}</span>
          </div>
        </div>

        {gameMode === 'regular' && (
          <PlayerSelector
            opponentType={opponentType}
            aiDifficulty={aiDifficulty}
            onOpponentTypeChange={setOpponentType}
            onDifficultyChange={setAIDifficulty}
            disabled={isGameActive}
          />
        )}

        {gameMode === 'regular' &&
          state.status === 'playing' &&
          aiPlayerId !== null &&
          state.currentPlayer === aiPlayerId && (
            <AIThinkingIndicator />
          )}
        
        <div className="scores">
          <div className="score-item">
            <span className="score-label">{getPlayerLabel(1)}</span>
            <span className="score-value">{state.scores[1]}</span>
          </div>
          <div className="score-item">
            <span className="score-label">{getPlayerLabel(2)}</span>
            <span className="score-value">{state.scores[2]}</span>
          </div>
        </div>

        <div className="total-games-played">
          Games played: <span className="total-games-value">{totalGamesPlayed}</span>
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

        <div className="attribution">
          <p className="attribution-text">
            Created by <a href="https://github.com/preetimaan" target="_blank" rel="noopener noreferrer" className="attribution-link">Preeti Maan</a>
          </p>
          <p className="attribution-text">
            Assisted by <a href="https://www.cursor.com/en" target="_blank" rel="noopener noreferrer" className="attribution-link">AI</a>
          </p>
        </div>
        </div>
      </div>
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      <PieceSelectorModal />
    </>
  )
}
