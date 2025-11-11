import { useGame } from '../../context/GameContext'
import './UIOverlay.css'

export default function UIOverlay() {
  const { state, resetGame } = useGame()

  const getStatusMessage = () => {
    if (state.status === 'won') {
      return `Player ${state.winner} Wins!`
    }
    if (state.status === 'draw') {
      return "It's a Draw!"
    }
    return `Player ${state.currentPlayer}'s Turn`
  }

  return (
    <div className="ui-overlay">
      <div className="ui-panel">
        <h1 className="title">3D Tic-Tac-Toe</h1>
        
        <div className="scores">
          <div className="score-item">
            <span className="score-label">Player X</span>
            <span className="score-value">{state.scores.X}</span>
          </div>
          <div className="score-item">
            <span className="score-label">Player O</span>
            <span className="score-value">{state.scores.O}</span>
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
  )
}

