import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import GameScene from './components/3d/GameScene'
import UIOverlay from './components/ui/UIOverlay'
import { GameProvider } from './context/GameContext'
import './App.css'

function App() {
  return (
    <GameProvider>
      <div className="app-container">
        <Canvas
          camera={{ position: [5, 5, 5], fov: 50 }}
          gl={{ antialias: true }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <GameScene />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={15}
          />
        </Canvas>
        <UIOverlay />
      </div>
    </GameProvider>
  )
}

export default App

