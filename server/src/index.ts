import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { RoomManager } from './roomManager.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(cors())

const clientDist = path.resolve(__dirname, '../../client/dist')
app.use(express.static(clientDist))

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

const rooms = new RoomManager()

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  socket.on('room:join', (roomId: string) => {
    socket.join(roomId)
    rooms.ensureRoom(roomId)
    const state = rooms.getState(roomId)
    const peerCount = io.sockets.adapter.rooms.get(roomId)?.size ?? 0

    socket.emit('board:state', state)
    io.to(roomId).emit('room:peers', { peerCount })
    socket.data.roomId = roomId
    console.log(`${socket.id} joined room ${roomId} (${peerCount} peers)`)
  })

  socket.on('figure:add', (data) => {
    const roomId = socket.data.roomId
    if (!roomId) return
    rooms.addFigure(roomId, data)
    socket.to(roomId).emit('figure:add', data)
  })

  socket.on('figure:move', (data) => {
    const roomId = socket.data.roomId
    if (!roomId) return
    rooms.moveFigure(roomId, data.id, data.position, data.boardHalf)
    socket.to(roomId).emit('figure:move', data)
  })

  socket.on('figure:remove', (data) => {
    const roomId = socket.data.roomId
    if (!roomId) return
    rooms.removeFigure(roomId, data.id)
    socket.to(roomId).emit('figure:remove', data)
  })

  socket.on('figure:rotate', (data) => {
    const roomId = socket.data.roomId
    if (!roomId) return
    rooms.rotateFigure(roomId, data.id, data.rotation)
    socket.to(roomId).emit('figure:rotate', data)
  })

  socket.on('figure:color', (data) => {
    const roomId = socket.data.roomId
    if (!roomId) return
    rooms.colorFigure(roomId, data.id, data.color)
    socket.to(roomId).emit('figure:color', data)
  })

  socket.on('board:split', (data) => {
    const roomId = socket.data.roomId
    if (!roomId) return
    rooms.setSplit(roomId, data.isSplit)
    socket.to(roomId).emit('board:split', data)
  })

  socket.on('board:reset', () => {
    const roomId = socket.data.roomId
    if (!roomId) return
    rooms.reset(roomId)
    socket.to(roomId).emit('board:reset', {})
  })

  socket.on('board:load', (data) => {
    const roomId = socket.data.roomId
    if (!roomId) return
    rooms.loadState(roomId, data)
    socket.to(roomId).emit('board:state', data)
  })

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId
    if (roomId) {
      const peerCount = (io.sockets.adapter.rooms.get(roomId)?.size ?? 1) - 1
      io.to(roomId).emit('room:peers', { peerCount })
      if (peerCount <= 0) {
        rooms.cleanupRoom(roomId)
      }
    }
    console.log(`Client disconnected: ${socket.id}`)
  })
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
