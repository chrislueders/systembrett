import { useState } from 'react'
import { useBoardStore } from '../store/boardStore'
import { exportBoard, importBoard } from '../utils/export'

const panelStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.4)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  borderRadius: '14px',
  border: '1px solid rgba(255,255,255,0.1)',
}

export function Toolbar() {
  const toggleSplit = useBoardStore((s) => s.toggleSplit)
  const isSplit = useBoardStore((s) => s.isSplit)
  const getExportState = useBoardStore((s) => s.getExportState)
  const loadState = useBoardStore((s) => s.loadState)
  const reset = useBoardStore((s) => s.reset)
  const roomId = useBoardStore((s) => s.roomId)
  const isConnected = useBoardStore((s) => s.isConnected)
  const peerCount = useBoardStore((s) => s.peerCount)
  const placingFigure = useBoardStore((s) => s.placingFigure)
  const selectedFigureId = useBoardStore((s) => s.selectedFigureId)

  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleExport = () => {
    exportBoard(getExportState())
  }

  const handleImport = async () => {
    try {
      const state = await importBoard()
      loadState(state)
    } catch {
      // user cancelled
    }
  }

  const handleCopyLink = () => {
    if (roomId) {
      const url = `${window.location.origin}?room=${roomId}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
      {/* Room info + toggle row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {roomId && (
          <div
            style={{
              ...panelStyle,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isConnected ? '#34d399' : '#f87171',
                }}
              />
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                {isConnected ? `${peerCount} verbunden` : 'Getrennt'}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                border: 'none',
                fontSize: '12px',
                transition: 'background 150ms',
              }}
            >
              {copied ? 'Kopiert!' : 'Link kopieren'}
            </button>
          </div>
        )}

        {/* Brett trennen button -- always visible */}
        <button
          onClick={toggleSplit}
          style={{
            ...panelStyle,
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)',
            transition: 'background 150ms',
          }}
        >
          {isSplit ? 'Zusammenfuegen' : 'Brett trennen'}
        </button>

        {/* Menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          title={menuOpen ? 'Menue schliessen' : 'Menue oeffnen'}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            ...panelStyle,
            color: 'rgba(255,255,255,0.7)',
            fontSize: '18px',
            transition: 'background 150ms',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="4" r="1.5" fill="currentColor" />
            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
            <circle cx="10" cy="16" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Status messages */}
      {placingFigure && (
        <div
          style={{
            background: 'rgba(245,158,11,0.2)',
            backdropFilter: 'blur(24px)',
            borderRadius: '14px',
            border: '1px solid rgba(251,191,36,0.3)',
            padding: '12px 16px',
            fontSize: '12px',
            color: 'rgb(253,230,138)',
          }}
        >
          Klicke auf das Brett um die Figur zu platzieren
        </div>
      )}
      {selectedFigureId && !placingFigure && (
        <div
          style={{
            background: 'rgba(245,158,11,0.2)',
            backdropFilter: 'blur(24px)',
            borderRadius: '14px',
            border: '1px solid rgba(251,191,36,0.3)',
            padding: '12px 16px',
            fontSize: '12px',
            color: 'rgb(253,230,138)',
            maxWidth: '280px',
          }}
        >
          Figur markiert. Ziehe = verschieben. Ring = Blickrichtung. Klick daneben = abwaehlen.
        </div>
      )}

      {/* Collapsible menu */}
      {menuOpen && (
        <div
          style={{
            ...panelStyle,
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <ToolbarButton onClick={handleExport}>Exportieren</ToolbarButton>
          <ToolbarButton onClick={handleImport}>Importieren</ToolbarButton>
          <ToolbarButton onClick={reset} danger>Zuruecksetzen</ToolbarButton>
        </div>
      )}
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 16px',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: 500,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'background 150ms',
        background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
        color: danger ? 'rgb(252,165,165)' : 'rgba(255,255,255,0.7)',
        border: danger ? '1px solid rgba(248,113,113,0.2)' : '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {children}
    </button>
  )
}
