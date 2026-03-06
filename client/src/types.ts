export type FigureType =
  | 'peg-large'
  | 'peg-medium'
  | 'peg-small'
  | 'cone-large'
  | 'cone-medium'
  | 'cone-small'
  | 'cylinder-large'
  | 'cylinder-medium'
  | 'cylinder-small'
  | 'stick'

export type FigureColor =
  | 'wood'
  | 'red'
  | 'blue'
  | 'green'
  | 'black'
  | 'white'

export const ALL_COLORS: { id: FigureColor; label: string; hex: string }[] = [
  { id: 'wood', label: 'Holz', hex: '#c4923a' },
  { id: 'red', label: 'Rot', hex: '#cc2936' },
  { id: 'blue', label: 'Blau', hex: '#2660a4' },
  { id: 'green', label: 'Grün', hex: '#2d6a4f' },
  { id: 'black', label: 'Schwarz', hex: '#2b2b2b' },
  { id: 'white', label: 'Weiß', hex: '#f0ece2' },
]

export interface FigureData {
  id: string
  type: FigureType
  color: FigureColor
  position: [number, number, number]
  rotation: number
  boardHalf: 'left' | 'right'
}

export interface BoardState {
  figures: FigureData[]
  isSplit: boolean
  metadata?: {
    name?: string
    date?: string
  }
}

export interface RoomState {
  roomId: string | null
  isConnected: boolean
  peerCount: number
}

export const FIGURE_CATALOG: { type: FigureType; label: string; group?: string }[] = [
  { type: 'peg-large', label: 'Große Figur', group: 'Figuren' },
  { type: 'peg-medium', label: 'Mittlere Figur', group: 'Figuren' },
  { type: 'peg-small', label: 'Kleine Figur', group: 'Figuren' },
  { type: 'cone-large', label: 'Großer Kegel', group: 'Kegel' },
  { type: 'cone-medium', label: 'Mittlerer Kegel', group: 'Kegel' },
  { type: 'cone-small', label: 'Kleiner Kegel', group: 'Kegel' },
  { type: 'cylinder-large', label: 'Großer Zylinder', group: 'Zylinder' },
  { type: 'cylinder-medium', label: 'Mittlerer Zylinder', group: 'Zylinder' },
  { type: 'cylinder-small', label: 'Kleiner Zylinder', group: 'Zylinder' },
  { type: 'stick', label: 'Stab', group: 'Sonstige' },
]

export const BOARD_SIZE = 10
export const BOARD_HEIGHT = 0.3
export const SPLIT_OFFSET = 1.5
export const GAP_CLOSED = 0.03
export const BOARD_SURFACE_Y = BOARD_HEIGHT + 0.04
export const INSET_MARGIN = 0.6
