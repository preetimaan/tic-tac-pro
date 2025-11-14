import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import GameScene from './components/3d/GameScene'
import UIOverlay from './components/ui/UIOverlay'
import { GameProvider } from './context/GameContext'
import { SettingsProvider } from './context/SettingsContext'
import './App.css'

function App() {
  const [fov, setFov] = useState(50)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const updateResponsive = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setFov(mobile ? 60 : 50)
    }
    updateResponsive()
    window.addEventListener('resize', updateResponsive)
    return () => window.removeEventListener('resize', updateResponsive)
  }, [])

  return (
    <SettingsProvider>
      <GameProvider>
        <div className="app-container">
        <Canvas
          camera={{ position: [5, 5, 5], fov }}
          gl={{ antialias: true }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <GameScene />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={isMobile ? 4 : 3}
            maxDistance={isMobile ? 12 : 15}
          />
        </Canvas>
        <UIOverlay />
      </div>
      </GameProvider>
    </SettingsProvider>
  )
}

export default App

