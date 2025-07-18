import { database } from '@/lib/firebase'
import { ref, onValue, off, set, push, onDisconnect, serverTimestamp, get } from 'firebase/database'

interface UserPresence {
  id: string
  name: string
  role: string
  isOnline: boolean
  lastSeen: number
}

class RealtimeService {
  private userId: string | null = null
  private listeners: Map<string, any> = new Map()

  // 사용자 연결 및 presence 설정
  async connect(userData: { id: string; name: string; role: string }) {
    this.userId = userData.id
    
    // 사용자 presence 설정
    const userStatusRef = ref(database, `presence/${userData.id}`)
    const userPresence: UserPresence = {
      ...userData,
      isOnline: true,
      lastSeen: Date.now()
    }
    
    await set(userStatusRef, userPresence)
    
    // 연결이 끊어질 때 offline 상태로 변경
    onDisconnect(userStatusRef).set({
      ...userPresence,
      isOnline: false,
      lastSeen: serverTimestamp()
    })
    
    console.log('Realtime service connected for user:', userData.id)
  }

  // 연결 해제
  disconnect() {
    if (this.userId) {
      const userStatusRef = ref(database, `presence/${this.userId}`)
      set(userStatusRef, {
        isOnline: false,
        lastSeen: serverTimestamp()
      })
    }
    
    // 모든 리스너 해제
    this.listeners.forEach((listener, path) => {
      off(ref(database, path), listener)
    })
    this.listeners.clear()
    
    this.userId = null
  }

  // 채팅방 참여
  joinRoom(roomId: string) {
    if (!this.userId) return
    
    // 채팅방 멤버 추가
    const memberRef = ref(database, `rooms/${roomId}/members/${this.userId}`)
    set(memberRef, {
      joinedAt: serverTimestamp(),
      isActive: true
    })
    
    // 연결 해제 시 비활성화
    onDisconnect(memberRef).update({ isActive: false })
  }

  // 메시지 전송 (Socket.IO 대체)
  async sendMessage(roomId: string, message: { content: string; attachments?: any[] }) {
    if (!this.userId) return
    
    const messagesRef = ref(database, `messages/${roomId}`)
    await push(messagesRef, {
      senderId: this.userId,
      ...message,
      timestamp: serverTimestamp(),
      read: false
    })
  }

  // 타이핑 상태 설정
  setTyping(roomId: string, isTyping: boolean) {
    if (!this.userId) return
    
    const typingRef = ref(database, `rooms/${roomId}/typing/${this.userId}`)
    if (isTyping) {
      set(typingRef, {
        isTyping: true,
        timestamp: serverTimestamp()
      })
      
      // 3초 후 자동으로 타이핑 상태 제거
      setTimeout(() => {
        set(typingRef, null)
      }, 3000)
    } else {
      set(typingRef, null)
    }
  }

  // 메시지 읽음 처리
  async markMessagesAsRead(roomId: string, messageIds: string[]) {
    const updates: any = {}
    messageIds.forEach(id => {
      updates[`messages/${roomId}/${id}/read`] = true
      updates[`messages/${roomId}/${id}/readAt`] = serverTimestamp()
      updates[`messages/${roomId}/${id}/readBy/${this.userId}`] = true
    })
    
    const dbRef = ref(database)
    await set(dbRef, updates)
  }

  // 파일 공유
  async shareFile(roomId: string, file: any) {
    await this.sendMessage(roomId, {
      content: `파일을 공유했습니다: ${file.name}`,
      attachments: [file]
    })
  }

  // 실시간 이벤트 리스너 (Socket.IO의 on 메서드 대체)
  on(event: string, callback: (...args: any[]) => void) {
    switch(event) {
      case 'message':
        // 특정 방의 메시지 구독
        return (roomId: string) => {
          const messagesRef = ref(database, `messages/${roomId}`)
          const listener = onValue(messagesRef, (snapshot) => {
            const messages = snapshot.val() || {}
            callback(Object.entries(messages).map(([id, msg]: [string, any]) => ({
              id,
              ...msg
            })))
          })
          this.listeners.set(`messages/${roomId}`, listener)
        }
        
      case 'presence':
        // 사용자 presence 구독
        const presenceRef = ref(database, 'presence')
        const presenceListener = onValue(presenceRef, (snapshot) => {
          const presence = snapshot.val() || {}
          callback(presence)
        })
        this.listeners.set('presence', presenceListener)
        break
        
      case 'typing':
        // 타이핑 상태 구독
        return (roomId: string) => {
          const typingRef = ref(database, `rooms/${roomId}/typing`)
          const typingListener = onValue(typingRef, (snapshot) => {
            const typing = snapshot.val() || {}
            callback(typing)
          })
          this.listeners.set(`rooms/${roomId}/typing`, typingListener)
        }
    }
  }

  // 리스너 해제 (Socket.IO의 off 메서드 대체)
  off(event: string, path?: string) {
    const listenerKey = path ? `${event}/${path}` : event
    const listener = this.listeners.get(listenerKey)
    if (listener) {
      off(ref(database, listenerKey), listener)
      this.listeners.delete(listenerKey)
    }
  }
}

export default new RealtimeService()