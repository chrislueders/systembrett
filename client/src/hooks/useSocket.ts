import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useBoardStore } from '../store/boardStore'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || ''

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const setRoomState = useBoardStore((s) => s.setRoomState)
  const setOnSync = useBoardStore((s) => s.setOnSync)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    let roomId = params.get('room')

    if (!roomId) {
      roomId = Math.random().toString(36).substring(2, 8)
      window.history.replaceState(null, '', `?room=${roomId}`)
    }

    setRoomState({ roomId })

    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => {
      setRoomState({ isConnected: true })
      socket.emit('room:join', roomId)
    })

    socket.on('disconnect', () => {
      setRoomState({ isConnected: false })
    })

    socket.on('board:state', (state) => {
      useBoardStore.getState().loadState(state)
    })

    socket.on('figure:add', (data) => {
      useBoardStore.setState((s) => ({ figures: [...s.figures, data] }))
    })

    socket.on('figure:move', (data) => {
      useBoardStore.setState((s) => ({
        figures: s.figures.map((f) =>
          f.id === data.id ? { ...f, position: data.position, boardHalf: data.boardHalf } : f
        ),
      }))
    })

    socket.on('figure:remove', (data) => {
      useBoardStore.setState((s) => ({
        figures: s.figures.filter((f) => f.id !== data.id),
      }))
    })

    socket.on('figure:rotate', (data) => {
      useBoardStore.setState((s) => ({
        figures: s.figures.map((f) =>
          f.id === data.id ? { ...f, rotation: data.rotation } : f
        ),
      }))
    })

    socket.on('figure:color', (data) => {
      useBoardStore.setState((s) => ({
        figures: s.figures.map((f) =>
          f.id === data.id ? { ...f, color: data.color } : f
        ),
      }))
    })

    socket.on('board:split', (data) => {
      useBoardStore.getState().setSplit(data.isSplit)
    })

    socket.on('board:reset', () => {
      useBoardStore.setState({ figures: [], isSplit: false, selectedFigureId: null })
    })

    socket.on('room:peers', (data) => {
      setRoomState({ peerCount: data.peerCount })
    })

    setOnSync((event: string, data: unknown) => {
      socket.emit(event, data)
    })

    return () => {
      setOnSync(null)
      socket.disconnect()
    }
  }, [setRoomState, setOnSync])
}
