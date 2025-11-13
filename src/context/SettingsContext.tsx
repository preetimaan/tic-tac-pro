import React, { createContext, useContext, useState, useCallback } from 'react'
import { GameMode } from '../types/game'

interface SettingsContextType {
  gameMode: GameMode
  setGameMode: (mode: GameMode) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [gameMode, setGameModeState] = useState<GameMode>('regular')

  const setGameMode = useCallback((mode: GameMode) => {
    setGameModeState(mode)
  }, [])

  return (
    <SettingsContext.Provider
      value={{
        gameMode,
        setGameMode,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

