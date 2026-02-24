import { OpponentType, Difficulty } from '../../types/game'

interface PlayerSelectorProps {
  opponentType: OpponentType
  aiDifficulty: Difficulty
  onOpponentTypeChange: (t: OpponentType) => void
  onDifficultyChange: (difficulty: Difficulty) => void
  disabled?: boolean
}

export default function PlayerSelector({
  opponentType,
  aiDifficulty,
  onOpponentTypeChange,
  onDifficultyChange,
  disabled = false,
}: PlayerSelectorProps) {
  return (
    <div className={`player-selector ${disabled ? 'player-selector-disabled' : ''}`}>
      <div className="player-option">
        <label>Opponent:</label>
        <select
          value={opponentType}
          onChange={(e) => onOpponentTypeChange(e.target.value as OpponentType)}
          disabled={disabled}
        >
          <option value="human">Human vs Human</option>
          <option value="computer">Human vs Computer</option>
        </select>
      </div>
      {opponentType === 'computer' && (
        <div className="difficulty-option">
          <label>AI difficulty:</label>
          <select
            value={aiDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}
            disabled={disabled}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      )}
    </div>
  )
}
