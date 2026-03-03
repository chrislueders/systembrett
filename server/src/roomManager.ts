interface FigureData {
  id: string
  type: string
  color: string
  position: [number, number, number]
  rotation: number
  boardHalf: 'left' | 'right'
}

interface BoardState {
  figures: FigureData[]
  isSplit: boolean
}

export class RoomManager {
  private rooms = new Map<string, BoardState>()

  ensureRoom(roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, { figures: [], isSplit: false })
    }
  }

  getState(roomId: string): BoardState {
    return this.rooms.get(roomId) ?? { figures: [], isSplit: false }
  }

  addFigure(roomId: string, figure: FigureData) {
    const room = this.rooms.get(roomId)
    if (room) {
      room.figures.push(figure)
    }
  }

  moveFigure(roomId: string, id: string, position: [number, number, number], boardHalf: 'left' | 'right') {
    const room = this.rooms.get(roomId)
    if (room) {
      const fig = room.figures.find((f) => f.id === id)
      if (fig) {
        fig.position = position
        fig.boardHalf = boardHalf
      }
    }
  }

  rotateFigure(roomId: string, id: string, rotation: number) {
    const room = this.rooms.get(roomId)
    if (room) {
      const fig = room.figures.find((f) => f.id === id)
      if (fig) {
        fig.rotation = rotation
      }
    }
  }

  colorFigure(roomId: string, id: string, color: string) {
    const room = this.rooms.get(roomId)
    if (room) {
      const fig = room.figures.find((f) => f.id === id)
      if (fig) {
        fig.color = color
      }
    }
  }

  removeFigure(roomId: string, id: string) {
    const room = this.rooms.get(roomId)
    if (room) {
      room.figures = room.figures.filter((f) => f.id !== id)
    }
  }

  setSplit(roomId: string, isSplit: boolean) {
    const room = this.rooms.get(roomId)
    if (room) {
      room.isSplit = isSplit
    }
  }

  reset(roomId: string) {
    this.rooms.set(roomId, { figures: [], isSplit: false })
  }

  loadState(roomId: string, state: BoardState) {
    this.rooms.set(roomId, { figures: [...state.figures], isSplit: state.isSplit })
  }

  cleanupRoom(roomId: string) {
    setTimeout(() => {
      this.rooms.delete(roomId)
      console.log(`Room ${roomId} cleaned up`)
    }, 60000)
  }
}
