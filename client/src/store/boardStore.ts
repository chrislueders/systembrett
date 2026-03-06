import { create } from 'zustand'
import type { FigureData, FigureType, FigureColor, BoardState } from '../types'

interface BoardStore {
  figures: FigureData[]
  isSplit: boolean
  selectedFigureId: string | null
  draggingFigureId: string | null
  placingFigure: FigureType | null
  sidebarDraggingType: FigureType | null
  sidebarDragPreview: [number, number, number] | null

  cameraAngle: number
  cameraPitch: number
  cameraZoom: number
  cameraPanX: number
  cameraPanZ: number

  roomId: string | null
  isConnected: boolean
  peerCount: number

  addFigure: (figure: FigureData) => void
  moveFigure: (id: string, position: [number, number, number], boardHalf: 'left' | 'right') => void
  removeFigure: (id: string) => void
  rotateFigure: (id: string, rotation: number) => void
  colorFigure: (id: string, color: FigureColor) => void
  selectFigure: (id: string | null) => void
  setDraggingFigure: (id: string | null) => void
  setPlacingFigure: (type: FigureType | null) => void
  setSidebarDraggingType: (type: FigureType | null) => void
  setSidebarDragPreview: (pos: [number, number, number] | null) => void
  toggleSplit: () => void
  setSplit: (split: boolean) => void
  setCameraAngle: (angle: number) => void
  setCameraPitch: (pitch: number) => void
  setCameraZoom: (zoom: number) => void
  setCameraPan: (x: number, z: number) => void
  setRoomState: (state: { roomId?: string | null; isConnected?: boolean; peerCount?: number }) => void
  loadState: (state: BoardState) => void
  getExportState: () => BoardState
  reset: () => void

  onSync: ((event: string, data: unknown) => void) | null
  setOnSync: (fn: ((event: string, data: unknown) => void) | null) => void
}

let nextId = 1
export const generateId = () => `fig_${Date.now()}_${nextId++}`

export const useBoardStore = create<BoardStore>((set, get) => ({
  figures: [],
  isSplit: false,
  selectedFigureId: null,
  draggingFigureId: null,
  placingFigure: null,
  sidebarDraggingType: null,
  sidebarDragPreview: null,

  cameraAngle: 0,
  cameraPitch: 45,
  cameraZoom: 14,
  cameraPanX: 0,
  cameraPanZ: 0,

  roomId: null,
  isConnected: false,
  peerCount: 0,

  onSync: null,
  setOnSync: (fn) => set({ onSync: fn }),

  addFigure: (figure) => {
    set((s) => ({ figures: [...s.figures, figure] }))
    get().onSync?.('figure:add', figure)
  },

  moveFigure: (id, position, boardHalf) => {
    set((s) => ({
      figures: s.figures.map((f) =>
        f.id === id ? { ...f, position, boardHalf } : f
      ),
    }))
    get().onSync?.('figure:move', { id, position, boardHalf })
  },

  removeFigure: (id) => {
    set((s) => ({
      figures: s.figures.filter((f) => f.id !== id),
      selectedFigureId: s.selectedFigureId === id ? null : s.selectedFigureId,
    }))
    get().onSync?.('figure:remove', { id })
  },

  rotateFigure: (id, rotation) => {
    set((s) => ({
      figures: s.figures.map((f) =>
        f.id === id ? { ...f, rotation } : f
      ),
    }))
    get().onSync?.('figure:rotate', { id, rotation })
  },

  colorFigure: (id, color) => {
    set((s) => ({
      figures: s.figures.map((f) =>
        f.id === id ? { ...f, color } : f
      ),
    }))
    get().onSync?.('figure:color', { id, color })
  },

  selectFigure: (id) => set({ selectedFigureId: id, placingFigure: null }),

  setDraggingFigure: (id) => set({ draggingFigureId: id }),

  setPlacingFigure: (type) => set({ placingFigure: type, selectedFigureId: null }),

  setSidebarDraggingType: (type) => set({ sidebarDraggingType: type }),

  setSidebarDragPreview: (pos) => set({ sidebarDragPreview: pos }),

  toggleSplit: () => {
    const newSplit = !get().isSplit
    set({ isSplit: newSplit })
    get().onSync?.('board:split', { isSplit: newSplit })
  },

  setSplit: (split) => set({ isSplit: split }),

  setCameraAngle: (angle) => set({ cameraAngle: angle }),
  setCameraPitch: (pitch) => set({ cameraPitch: Math.max(10, Math.min(90, pitch)) }),
  setCameraZoom: (zoom) => set({ cameraZoom: Math.max(6, Math.min(30, zoom)) }),
  setCameraPan: (x, z) => set({ cameraPanX: Math.max(-8, Math.min(8, x)), cameraPanZ: Math.max(-8, Math.min(8, z)) }),

  setRoomState: (state) =>
    set((s) => ({
      roomId: state.roomId !== undefined ? state.roomId : s.roomId,
      isConnected: state.isConnected !== undefined ? state.isConnected : s.isConnected,
      peerCount: state.peerCount !== undefined ? state.peerCount : s.peerCount,
    })),

  loadState: (state) =>
    set({
      figures: state.figures,
      isSplit: state.isSplit,
      selectedFigureId: null,
      draggingFigureId: null,
      placingFigure: null,
      sidebarDraggingType: null,
      sidebarDragPreview: null,
    }),

  getExportState: () => {
    const { figures, isSplit } = get()
    return {
      figures,
      isSplit,
      metadata: { date: new Date().toISOString() },
    }
  },

  reset: () => {
    set({ figures: [], isSplit: false, selectedFigureId: null, draggingFigureId: null, placingFigure: null, sidebarDraggingType: null, sidebarDragPreview: null })
    get().onSync?.('board:reset', {})
  },
}))
