import { Scene } from './components/Scene'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { CameraWidget } from './components/CameraWidget'
import { useSocket } from './hooks/useSocket'

export default function App() {
  useSocket()

  return (
    <div className="w-screen h-screen bg-neutral-900 overflow-hidden relative">
      <Scene />
      <Sidebar />
      <Toolbar />
      <CameraWidget />
    </div>
  )
}
