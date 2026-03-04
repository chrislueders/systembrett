import { useEffect } from 'react'
import { Scene } from './components/Scene'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { CameraWidget } from './components/CameraWidget'
import { useSocket } from './hooks/useSocket'
import { useBoardStore } from './store/boardStore'

export default function App() {
  useSocket()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        const state = useBoardStore.getState()
        if (state.selectedFigureId) {
          e.preventDefault()
          state.removeFigure(state.selectedFigureId)
          state.selectFigure(null)
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="w-screen h-screen bg-neutral-900 overflow-hidden relative">
      <Scene />
      <Sidebar />
      <Toolbar />
      <CameraWidget />
    </div>
  )
}
