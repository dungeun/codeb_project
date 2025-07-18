// Firebase Realtime Database를 사용하도록 변경
import realtimeService from './realtime-service'

class SocketService {
  private eventCallbacks: Map<string, (...args: any[]) => void> = new Map()

  async connect(userData: { id: string; name: string; role: string }) {
    // Firebase Realtime Database 연결
    await realtimeService.connect(userData)
    return this
  }

  disconnect() {
    // Firebase Realtime Database 연결 해제
    realtimeService.disconnect()
  }

  joinRoom(roomId: string) {
    // Firebase Realtime Database로 방 참여
    realtimeService.joinRoom(roomId)
  }

  sendMessage(roomId: string, message: { content: string; attachments?: any[] }) {
    // Firebase Realtime Database로 메시지 전송
    realtimeService.sendMessage(roomId, message)
  }

  setTyping(roomId: string, isTyping: boolean) {
    // Firebase Realtime Database로 타이핑 상태 설정
    realtimeService.setTyping(roomId, isTyping)
  }

  markMessagesAsRead(roomId: string, messageIds: string[]) {
    // Firebase Realtime Database로 읽음 표시
    realtimeService.markMessagesAsRead(roomId, messageIds)
  }

  shareFile(roomId: string, file: any) {
    // Firebase Realtime Database로 파일 공유
    realtimeService.shareFile(roomId, file)
  }

  startScreenShare(roomId: string) {
    // 화면 공유는 WebRTC나 다른 방식으로 구현 필요
    console.log('Screen share started for room:', roomId)
    // 이벤트 알림만 Firebase로 전송
    realtimeService.sendMessage(roomId, {
      content: '화면 공유를 시작했습니다.',
      attachments: []
    })
  }

  stopScreenShare(roomId: string) {
    // 화면 공유 중지
    console.log('Screen share stopped for room:', roomId)
    realtimeService.sendMessage(roomId, {
      content: '화면 공유를 종료했습니다.',
      attachments: []
    })
  }

  on(event: string, callback: (...args: any[]) => void) {
    // Firebase Realtime Database 이벤트 리스너 등록
    this.eventCallbacks.set(event, callback)
    realtimeService.on(event, callback)
  }

  off(event: string, callback?: (...args: any[]) => void) {
    // Firebase Realtime Database 이벤트 리스너 해제
    if (callback) {
      this.eventCallbacks.delete(event)
    }
    realtimeService.off(event)
  }

  getSocket() {
    // Socket.IO 호환성을 위한 더미 반환
    return null
  }
}

export default new SocketService()