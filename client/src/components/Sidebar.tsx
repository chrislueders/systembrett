import React, { useState } from 'react'
import { useBoardStore } from '../store/boardStore'
import { FIGURE_CATALOG, ALL_COLORS } from '../types'
import type { FigureType, FigureColor } from '../types'

const COLOR_HEX: Record<string, string> = Object.fromEntries(
  ALL_COLORS.map((c) => [c.id, c.hex])
)

const TYPE_ICON: Record<string, string> = {
  'peg-large': '🧍',
  'peg-medium': '🧑',
  'peg-small': '👶',
  'cone-large': '△',
  'cone-medium': '▲',
  'cone-small': '▴',
  'cylinder-large': '⬤',
  'cylinder-medium': '●',
  'cylinder-small': '•',
  'stick': '│',
}

function FigureButton({ type, label }: { type: FigureType; label: string }) {
  const placingFigure = useBoardStore((s) => s.placingFigure)
  const setPlacingFigure = useBoardStore((s) => s.setPlacingFigure)
  const isActive = placingFigure === type

  const handleClick = () => {
    setPlacingFigure(isActive ? null : type)
  }

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/x-systembrett-figure-type', type)
    useBoardStore.getState().setSidebarDraggingType(type)
    const ghost = document.createElement('div')
    ghost.style.cssText = 'position:fixed;top:-9999px;width:1px;height:1px;'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    requestAnimationFrame(() => document.body.removeChild(ghost))
  }

  const handleDragEnd = () => {
    useBoardStore.getState().setSidebarDraggingType(null)
    useBoardStore.getState().setSidebarDragPreview(null)
  }

  return (
    <button
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '10px 14px',
        borderRadius: '10px',
        textAlign: 'left',
        fontSize: '14px',
        transition: 'all 150ms',
        border: isActive ? '1px solid rgba(251,191,36,0.5)' : '1px solid rgba(255,255,255,0.1)',
        background: isActive ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.05)',
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.8)',
      }}
    >
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          flexShrink: 0,
          backgroundColor: COLOR_HEX.wood,
        }}
      >
        {TYPE_ICON[type] || '?'}
      </div>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  )
}

function ColorPicker({ figureId, currentColor }: { figureId: string; currentColor: FigureColor }) {
  const colorFigure = useBoardStore((s) => s.colorFigure)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {ALL_COLORS.map((c) => (
        <button
          key={c.id}
          onClick={() => colorFigure(figureId, c.id)}
          title={c.label}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: currentColor === c.id ? '2px solid #fbbf24' : '2px solid rgba(255,255,255,0.2)',
            backgroundColor: c.hex,
            cursor: 'pointer',
            transform: currentColor === c.id ? 'scale(1.15)' : 'scale(1)',
            transition: 'all 100ms',
            boxShadow: currentColor === c.id ? '0 0 0 3px rgba(251,191,36,0.4)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

function GroupLabel({ label }: { label: string }) {
  return (
    <p
      style={{
        color: 'rgba(255,255,255,0.4)',
        fontSize: '10px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        paddingTop: '12px',
        paddingBottom: '4px',
      }}
    >
      {label}
    </p>
  )
}

const panelBg: React.CSSProperties = {
  background: 'rgba(0,0,0,0.4)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.1)',
}

const toggleBtnStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(0,0,0,0.4)',
  backdropFilter: 'blur(24px)',
  color: 'rgba(255,255,255,0.7)',
  fontSize: '18px',
  transition: 'background 150ms',
}

export function Sidebar() {
  const selectedFigureId = useBoardStore((s) => s.selectedFigureId)
  const figures = useBoardStore((s) => s.figures)
  const removeFigure = useBoardStore((s) => s.removeFigure)
  const selectFigure = useBoardStore((s) => s.selectFigure)
  const [collapsed, setCollapsed] = useState(false)

  const selectedFigure = figures.find((f) => f.id === selectedFigureId)

  let lastGroup = ''

  if (collapsed) {
    return (
      <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
        <button
          onClick={() => setCollapsed(false)}
          style={toggleBtnStyle}
          title="Figurenauswahl öffnen"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="4" width="14" height="2" rx="1" fill="currentColor" />
            <rect x="3" y="9" width="14" height="2" rx="1" fill="currentColor" />
            <rect x="3" y="14" width="14" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        width: '260px',
        maxHeight: 'calc(100vh - 32px)',
        ...panelBg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          overflowY: 'auto',
          flex: 1,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h2 style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '15px' }}>
            Figuren
          </h2>
          <button
            onClick={() => setCollapsed(true)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '16px',
              transition: 'background 150ms',
            }}
            title="Einklappen"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10 5.5L7 8.5L4 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(90 7 7)" />
            </svg>
          </button>
        </div>

        {FIGURE_CATALOG.map((item) => {
          const showGroup = item.group && item.group !== lastGroup
          lastGroup = item.group || ''
          return (
            <div key={item.type}>
              {showGroup && <GroupLabel label={item.group!} />}
              <FigureButton type={item.type} label={item.label} />
            </div>
          )
        })}

        {selectedFigure && (
          <div
            style={{
              marginTop: '14px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
              Markierte Figur
            </p>

            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '8px' }}>
                Farbe
              </p>
              <ColorPicker figureId={selectedFigure.id} currentColor={selectedFigure.color} />
            </div>

            <button
              onClick={() => {
                removeFigure(selectedFigure.id)
                selectFigure(null)
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: 'rgb(252,165,165)',
                cursor: 'pointer',
                transition: 'background 150ms',
              }}
            >
              Entfernen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
