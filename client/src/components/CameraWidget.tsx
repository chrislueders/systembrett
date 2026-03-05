import { useRef, useCallback, useEffect, useState } from 'react'
import { useBoardStore } from '../store/boardStore'

type Mode = 'rotate' | 'pan'

export function CameraWidget() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const setCameraAngle = useBoardStore((s) => s.setCameraAngle)
  const setCameraPitch = useBoardStore((s) => s.setCameraPitch)
  const setCameraPan = useBoardStore((s) => s.setCameraPan)
  const cameraAngle = useBoardStore((s) => s.cameraAngle)
  const cameraPitch = useBoardStore((s) => s.cameraPitch)
  const cameraPanX = useBoardStore((s) => s.cameraPanX)
  const cameraPanZ = useBoardStore((s) => s.cameraPanZ)

  const [localAngle, setLocalAngle] = useState(cameraAngle)
  const [localPitch, setLocalPitch] = useState(cameraPitch)
  const [localPanX, setLocalPanX] = useState(cameraPanX)
  const [localPanZ, setLocalPanZ] = useState(cameraPanZ)
  const [mode, setMode] = useState<Mode>('rotate')
  const isMiddleDragging = useRef(false)
  const isRightDragging = useRef(false)

  useEffect(() => {
    setLocalAngle(cameraAngle)
    setLocalPitch(cameraPitch)
  }, [cameraAngle, cameraPitch])

  useEffect(() => {
    setLocalPanX(cameraPanX)
    setLocalPanZ(cameraPanZ)
  }, [cameraPanX, cameraPanZ])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }

      if (mode === 'rotate') {
        const newAngle = localAngle + dx * 0.8
        const newPitch = localPitch + dy * 0.5
        setLocalAngle(newAngle)
        setLocalPitch(newPitch)
        setCameraAngle(newAngle)
        setCameraPitch(newPitch)
      } else {
        const angleRad = (localAngle * Math.PI) / 180
        const speed = 0.05
        const moveX = localPanX + (-dx * Math.cos(angleRad) - dy * Math.sin(angleRad)) * speed
        const moveZ = localPanZ + (dx * Math.sin(angleRad) - dy * Math.cos(angleRad)) * speed
        setLocalPanX(moveX)
        setLocalPanZ(moveZ)
        setCameraPan(moveX, moveZ)
      }
    },
    [mode, localAngle, localPitch, localPanX, localPanZ, setCameraAngle, setCameraPitch, setCameraPan]
  )

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  // Middle mouse = Drehen, rechte Maustaste = Bewegen (Pan) – ueberall im Fenster
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (e.button === 1) {
        // mittlere Maustaste (Scrollrad)
        isMiddleDragging.current = true
        isRightDragging.current = false
        lastPos.current = { x: e.clientX, y: e.clientY }
        e.preventDefault()
      } else if (e.button === 2) {
        // rechte Maustaste
        isRightDragging.current = true
        isMiddleDragging.current = false
        lastPos.current = { x: e.clientX, y: e.clientY }
        e.preventDefault()
      }
    }

    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }

      if (isMiddleDragging.current) {
        // Drehen
        const state = useBoardStore.getState()
        const newAngle = state.cameraAngle + dx * 0.8
        const newPitch = state.cameraPitch + dy * 0.5
        setCameraAngle(newAngle)
        setCameraPitch(newPitch)
      } else if (isRightDragging.current) {
        // Bewegen (Pan) – gleiches Verhalten wie Widget im Modus \"Bewegen\"
        const state = useBoardStore.getState()
        const angleRad = (state.cameraAngle * Math.PI) / 180
        const speed = 0.05
        const moveX = state.cameraPanX + (-dx * Math.cos(angleRad) - dy * Math.sin(angleRad)) * speed
        const moveZ = state.cameraPanZ + (dx * Math.sin(angleRad) - dy * Math.cos(angleRad)) * speed
        setCameraPan(moveX, moveZ)
      }
    }

    const handleUp = () => {
      isMiddleDragging.current = false
      isRightDragging.current = false
    }

    window.addEventListener('mousedown', handleDown)
    // Kontextmenue global unterdruecken, solange rechte Maustaste fuer Panning dient
    const handleContext = (e: MouseEvent) => {
      if (isRightDragging.current) e.preventDefault()
    }
    window.addEventListener('contextmenu', handleContext)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousedown', handleDown)
      window.removeEventListener('contextmenu', handleContext)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [setCameraAngle, setCameraPitch])

  const presets = [
    { label: 'Oben', angle: 0, pitch: 88, panX: 0, panZ: 0 },
    { label: 'Schraeg', angle: 25, pitch: 45, panX: 0, panZ: 0 },
    { label: 'Seite', angle: 90, pitch: 20, panX: 0, panZ: 0 },
  ]

  return (
    <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2">
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={() => setMode('rotate')}
          style={{
            padding: '6px 14px',
            fontSize: '11px',
            borderRadius: '16px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 150ms',
            background: mode === 'rotate' ? 'rgba(255,255,255,0.2)' : 'transparent',
            color: mode === 'rotate' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
          }}
        >
          Drehen
        </button>
        <button
          onClick={() => setMode('pan')}
          style={{
            padding: '6px 14px',
            fontSize: '11px',
            borderRadius: '16px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 150ms',
            background: mode === 'pan' ? 'rgba(255,255,255,0.2)' : 'transparent',
            color: mode === 'pan' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
          }}
        >
          Bewegen
        </button>
      </div>

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20
                   cursor-grab active:cursor-grabbing flex items-center justify-center
                   hover:bg-white/15 transition-colors select-none"
      >
        <div className="text-white/60 text-xs text-center pointer-events-none leading-tight">
          {mode === 'rotate' ? (
            <>
              <svg width="32" height="32" viewBox="0 0 32 32" className="mx-auto mb-0.5 opacity-50">
                <path d="M16 4 L16 28 M4 16 L28 16" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M16 4 L13 8 M16 4 L19 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M16 28 L13 24 M16 28 L19 24" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M4 16 L8 13 M4 16 L8 19" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M28 16 L24 13 M28 16 L24 19" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              Drehen
            </>
          ) : (
            <>
              <svg width="32" height="32" viewBox="0 0 32 32" className="mx-auto mb-0.5 opacity-50">
                <rect x="8" y="8" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M16 4 L16 8 M16 28 L16 24 M4 16 L8 16 M28 16 L24 16" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M16 4 L13 7 M16 4 L19 7" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M16 28 L13 25 M16 28 L19 25" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M4 16 L7 13 M4 16 L7 19" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M28 16 L25 13 M28 16 L25 19" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              Bewegen
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px' }}>
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setCameraAngle(p.angle)
              setCameraPitch(p.pitch)
              setCameraPan(p.panX, p.panZ)
            }}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'background 150ms',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
