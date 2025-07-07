const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3002",
    methods: ["GET", "POST"]
  }
})

// 채팅방 관리
const chatRooms = new Map()
const users = new Map()

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id)

  // 사용자 인증
  socket.on('authenticate', (userData) => {
    users.set(socket.id, {
      ...userData,
      socketId: socket.id,
      status: 'online'
    })
    
    // 사용자 목록 업데이트 브로드캐스트
    io.emit('users-update', Array.from(users.values()))
  })

  // 채팅방 참여
  socket.on('join-room', (roomId) => {
    socket.join(roomId)
    
    if (!chatRooms.has(roomId)) {
      chatRooms.set(roomId, {
        id: roomId,
        participants: [],
        messages: []
      })
    }
    
    const room = chatRooms.get(roomId)
    const user = users.get(socket.id)
    
    if (user && !room.participants.find(p => p.id === user.id)) {
      room.participants.push(user)
    }
    
    // 기존 메시지 전송
    socket.emit('room-messages', room.messages)
    
    // 참여자 목록 업데이트
    io.to(roomId).emit('room-participants', room.participants)
    
    // 입장 알림
    socket.to(roomId).emit('user-joined', {
      user,
      timestamp: new Date()
    })
  })

  // 메시지 전송
  socket.on('send-message', ({ roomId, message }) => {
    const user = users.get(socket.id)
    if (!user) return
    
    const room = chatRooms.get(roomId)
    if (!room) return
    
    const newMessage = {
      id: Date.now().toString(),
      ...message,
      senderId: user.id,
      senderName: user.name,
      timestamp: new Date(),
      read: false
    }
    
    room.messages.push(newMessage)
    
    // 메시지 브로드캐스트
    io.to(roomId).emit('new-message', newMessage)
  })

  // 타이핑 상태
  socket.on('typing', ({ roomId, isTyping }) => {
    const user = users.get(socket.id)
    if (!user) return
    
    socket.to(roomId).emit('user-typing', {
      userId: user.id,
      userName: user.name,
      isTyping
    })
  })

  // 메시지 읽음 처리
  socket.on('mark-read', ({ roomId, messageIds }) => {
    const room = chatRooms.get(roomId)
    if (!room) return
    
    room.messages.forEach(msg => {
      if (messageIds.includes(msg.id)) {
        msg.read = true
      }
    })
    
    io.to(roomId).emit('messages-read', messageIds)
  })

  // 파일 공유
  socket.on('share-file', ({ roomId, file }) => {
    const user = users.get(socket.id)
    if (!user) return
    
    const fileMessage = {
      id: Date.now().toString(),
      type: 'file',
      file,
      senderId: user.id,
      senderName: user.name,
      timestamp: new Date()
    }
    
    const room = chatRooms.get(roomId)
    if (room) {
      room.messages.push(fileMessage)
    }
    
    io.to(roomId).emit('new-file', fileMessage)
  })

  // 화면 공유 시그널링
  socket.on('screen-share-start', ({ roomId }) => {
    const user = users.get(socket.id)
    socket.to(roomId).emit('screen-share-started', { userId: user.id })
  })

  socket.on('screen-share-stop', ({ roomId }) => {
    const user = users.get(socket.id)
    socket.to(roomId).emit('screen-share-stopped', { userId: user.id })
  })

  // 연결 해제
  socket.on('disconnect', () => {
    const user = users.get(socket.id)
    
    if (user) {
      // 모든 채팅방에서 사용자 제거
      chatRooms.forEach((room, roomId) => {
        room.participants = room.participants.filter(p => p.id !== user.id)
        io.to(roomId).emit('user-left', {
          user,
          timestamp: new Date()
        })
        io.to(roomId).emit('room-participants', room.participants)
      })
      
      users.delete(socket.id)
      io.emit('users-update', Array.from(users.values()))
    }
    
    console.log('Client disconnected:', socket.id)
  })
})

// REST API 엔드포인트
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(chatRooms.values()).map(room => ({
    id: room.id,
    participantCount: room.participants.length,
    lastMessage: room.messages[room.messages.length - 1]
  }))
  res.json(roomList)
})

app.get('/api/rooms/:roomId/messages', (req, res) => {
  const room = chatRooms.get(req.params.roomId)
  if (!room) {
    return res.status(404).json({ error: 'Room not found' })
  }
  res.json(room.messages)
})

const PORT = process.env.PORT || 3003
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`)
})