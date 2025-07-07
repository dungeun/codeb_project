import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  private serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3003'

  connect(userData: { id: string; name: string; role: string }) {
    if (this.socket?.connected) return

    this.socket = io(this.serverUrl, {
      autoConnect: true,
    })

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id)
      this.socket?.emit('authenticate', userData)
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  joinRoom(roomId: string) {
    this.socket?.emit('join-room', roomId)
  }

  sendMessage(roomId: string, message: { content: string; attachments?: any[] }) {
    this.socket?.emit('send-message', { roomId, message })
  }

  setTyping(roomId: string, isTyping: boolean) {
    this.socket?.emit('typing', { roomId, isTyping })
  }

  markMessagesAsRead(roomId: string, messageIds: string[]) {
    this.socket?.emit('mark-read', { roomId, messageIds })
  }

  shareFile(roomId: string, file: any) {
    this.socket?.emit('share-file', { roomId, file })
  }

  startScreenShare(roomId: string) {
    this.socket?.emit('screen-share-start', { roomId })
  }

  stopScreenShare(roomId: string) {
    this.socket?.emit('screen-share-stop', { roomId })
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback)
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback)
  }

  getSocket() {
    return this.socket
  }
}

export default new SocketService()