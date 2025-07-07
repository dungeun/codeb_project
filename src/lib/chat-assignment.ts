import { ref, set, get, push, onValue, off } from 'firebase/database'
import { database } from './firebase'

export interface ChatAssignment {
  id: string
  customerId: string
  customerName: string
  operatorId: string
  operatorName: string
  status: 'pending' | 'active' | 'completed'
  createdAt: string
  acceptedAt?: string
  completedAt?: string
  lastMessageAt?: string
}

export interface OperatorStatus {
  id: string
  name: string
  isOnline: boolean
  isAvailable: boolean
  activeChats: number
  maxChats: number
  lastSeen?: string
}

export interface ChatRequest {
  id: string
  customerId: string
  customerName: string
  message: string
  status: 'waiting' | 'assigned' | 'rejected'
  createdAt: string
  assignedOperatorId?: string
  assignedAt?: string
}

export class ChatAssignmentService {
  private static instance: ChatAssignmentService

  static getInstance(): ChatAssignmentService {
    if (!ChatAssignmentService.instance) {
      ChatAssignmentService.instance = new ChatAssignmentService()
    }
    return ChatAssignmentService.instance
  }

  // 사용 가능한 운영자 찾기
  async findAvailableOperator(): Promise<string | null> {
    try {
      const operatorsRef = ref(database, 'operators')
      const snapshot = await get(operatorsRef)
      
      if (!snapshot.exists()) {
        console.log('No operators found in database')
        return null
      }
      
      const operators = snapshot.val()
      console.log('All operators:', operators)
      let bestOperator: { id: string; activeChats: number } | null = null
      
      // 온라인이고 여유가 있는 운영자 중 가장 여유가 많은 운영자 선택
      Object.entries(operators).forEach(([operatorId, operator]: [string, any]) => {
        console.log(`Operator ${operatorId}:`, {
          isOnline: operator.isOnline,
          isAvailable: operator.isAvailable,
          activeChats: operator.activeChats,
          maxChats: operator.maxChats
        })
        if (operator.isOnline && operator.isAvailable && 
            operator.activeChats < operator.maxChats) {
          if (!bestOperator || operator.activeChats < bestOperator.activeChats) {
            bestOperator = { id: operatorId, activeChats: operator.activeChats }
          }
        }
      })
      
      console.log('Best operator found:', bestOperator)
      return bestOperator ? bestOperator.id : null
    } catch (error) {
      console.error('Error finding available operator:', error)
      return null
    }
  }

  // 고객에게 운영자 할당
  async assignOperatorToCustomer(
    customerId: string, 
    customerName: string,
    operatorId?: string
  ): Promise<ChatAssignment | null> {
    try {
      // 이미 할당된 운영자가 있는지 확인
      const existingAssignment = await this.getAssignmentForCustomer(customerId)
      if (existingAssignment && existingAssignment.status === 'active') {
        return existingAssignment
      }

      // 운영자가 지정되지 않았으면 자동으로 찾기
      const targetOperatorId = operatorId || await this.findAvailableOperator()
      if (!targetOperatorId) {
        console.log('No available operator found')
        return null
      }

      // 운영자 정보 가져오기
      const operatorRef = ref(database, `operators/${targetOperatorId}`)
      const operatorSnapshot = await get(operatorRef)
      
      if (!operatorSnapshot.exists()) {
        console.error('Operator not found')
        return null
      }

      const operatorData = operatorSnapshot.val()

      // 새 할당 생성
      const assignmentRef = push(ref(database, 'chatAssignments'))
      const assignment: ChatAssignment = {
        id: assignmentRef.key!,
        customerId,
        customerName,
        operatorId: targetOperatorId,
        operatorName: operatorData.name,
        status: 'active',
        createdAt: new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
      }

      await set(assignmentRef, assignment)
      
      // customerAssignments에도 저장 (호환성을 위해)
      await set(ref(database, `customerAssignments/${customerId}`), {
        customerId,
        customerName,
        operatorId: targetOperatorId,
        operatorName: operatorData.name,
        status: 'active',
        createdAt: new Date().toISOString()
      })

      // 운영자의 활성 채팅 수 증가
      await this.updateOperatorActiveChats(targetOperatorId, 1)

      return assignment
    } catch (error) {
      console.error('Error assigning operator:', error)
      return null
    }
  }

  // 고객의 현재 할당 정보 가져오기
  async getAssignmentForCustomer(customerId: string): Promise<ChatAssignment | null> {
    try {
      const assignmentsRef = ref(database, 'chatAssignments')
      const snapshot = await get(assignmentsRef)
      
      if (!snapshot.exists()) return null
      
      const assignments = snapshot.val()
      let activeAssignment: ChatAssignment | null = null
      
      Object.entries(assignments).forEach(([id, assignment]: [string, any]) => {
        if (assignment.customerId === customerId && 
            (assignment.status === 'active' || assignment.status === 'pending')) {
          activeAssignment = { ...assignment, id }
        }
      })
      
      return activeAssignment
    } catch (error) {
      console.error('Error getting assignment:', error)
      return null
    }
  }

  // 운영자에게 할당된 모든 고객 가져오기
  async getCustomersForOperator(operatorId: string): Promise<ChatAssignment[]> {
    try {
      const assignmentsRef = ref(database, 'chatAssignments')
      const snapshot = await get(assignmentsRef)
      
      if (!snapshot.exists()) return []
      
      const assignments = snapshot.val()
      const operatorAssignments: ChatAssignment[] = []
      
      Object.entries(assignments).forEach(([id, assignment]: [string, any]) => {
        if (assignment.operatorId === operatorId && assignment.status === 'active') {
          operatorAssignments.push({ ...assignment, id })
        }
      })
      
      // 최근 메시지 시간 기준으로 정렬
      return operatorAssignments.sort((a, b) => {
        const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
        const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
        return timeB - timeA
      })
    } catch (error) {
      console.error('Error getting operator assignments:', error)
      return []
    }
  }

  // 운영자 상태 업데이트
  async updateOperatorStatus(
    operatorId: string, 
    status: Partial<OperatorStatus>
  ): Promise<void> {
    try {
      const operatorRef = ref(database, `operators/${operatorId}`)
      await set(operatorRef, {
        ...status,
        lastSeen: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating operator status:', error)
    }
  }

  // 고객에게 할당된 운영자 가져오기
  async getAssignedOperator(customerId: string): Promise<any | null> {
    try {
      const assignmentRef = ref(database, `customerAssignments/${customerId}`)
      const snapshot = await get(assignmentRef)
      
      if (!snapshot.exists()) return null
      
      const assignment = snapshot.val()
      if (assignment.status !== 'active' || !assignment.operatorId) return null
      
      // 운영자 정보 가져오기
      const operatorRef = ref(database, `operators/${assignment.operatorId}`)
      const operatorSnapshot = await get(operatorRef)
      
      if (!operatorSnapshot.exists()) return null
      
      return {
        uid: assignment.operatorId,
        ...operatorSnapshot.val()
      }
    } catch (error) {
      console.error('Error getting assigned operator:', error)
      return null
    }
  }

  // 자동으로 운영자 찾아서 고객 할당
  async autoAssignOperatorToCustomer(customerId: string): Promise<boolean> {
    try {
      const availableOperatorId = await this.findAvailableOperator()
      if (!availableOperatorId) {
        console.log('No available operators')
        return false
      }

      // 고객 정보 가져오기
      const userRef = ref(database, `users/${customerId}`)
      const userSnapshot = await get(userRef)
      
      if (!userSnapshot.exists()) return false
      
      const userData = userSnapshot.val()
      const customerName = userData.displayName || userData.email
      
      // assignOperatorToCustomer 메서드 호출
      const assignment = await this.assignOperatorToCustomer(customerId, customerName, availableOperatorId)
      
      return assignment !== null
    } catch (error) {
      console.error('Error in auto assignment:', error)
      return false
    }
  }

  // 채팅 종료 (고객측에서 호출)
  async endChat(customerId: string, operatorId: string): Promise<void> {
    try {
      // 현재 활성 할당 찾기
      const assignmentsRef = ref(database, 'chatAssignments')
      const snapshot = await get(assignmentsRef)
      
      if (snapshot.exists()) {
        const assignments = snapshot.val()
        
        // 해당 고객의 활성 할당 찾기
        for (const [id, assignment] of Object.entries(assignments)) {
          if (assignment.customerId === customerId && 
              assignment.operatorId === operatorId && 
              assignment.status === 'active') {
            // completeChat 호출하여 양방향 종료
            await this.completeChat(id)
            return
          }
        }
      }
      
      // 할당을 찾지 못한 경우 기존 방식대로 처리
      await set(ref(database, `customerAssignments/${customerId}`), null)
      await this.updateOperatorActiveChats(operatorId, -1)
    } catch (error) {
      console.error('Error ending chat:', error)
    }
  }

  // 운영자 가용성 확인
  async checkOperatorAvailability(operatorId: string): Promise<boolean> {
    try {
      const operatorRef = ref(database, `operators/${operatorId}`)
      const snapshot = await get(operatorRef)
      
      if (!snapshot.exists()) return false
      
      const operator = snapshot.val()
      return operator.isOnline && operator.isAvailable && 
             operator.activeChats < operator.maxChats
    } catch (error) {
      console.error('Error checking operator availability:', error)
      return false
    }
  }

  // 채팅 요청 생성
  async createChatRequest(
    customerId: string, 
    customerName: string, 
    message: string
  ): Promise<ChatRequest> {
    try {
      const requestRef = push(ref(database, 'chatRequests'))
      const request: ChatRequest = {
        id: requestRef.key!,
        customerId,
        customerName,
        message,
        status: 'waiting',
        createdAt: new Date().toISOString()
      }

      await set(requestRef, request)
      return request
    } catch (error) {
      console.error('Error creating chat request:', error)
      throw error
    }
  }

  // 채팅 요청 수락
  async acceptChatRequest(requestId: string, operatorId: string): Promise<ChatAssignment | null> {
    try {
      const requestRef = ref(database, `chatRequests/${requestId}`)
      const snapshot = await get(requestRef)
      
      if (!snapshot.exists()) {
        console.error('Chat request not found')
        return null
      }

      const request = snapshot.val()
      
      // 이미 할당되었는지 확인
      if (request.status === 'assigned') {
        console.log('Request already assigned')
        return null
      }

      // 요청 상태 업데이트
      await set(requestRef, {
        ...request,
        status: 'assigned',
        assignedOperatorId: operatorId,
        assignedAt: new Date().toISOString()
      })

      // 운영자에게 할당
      const assignment = await this.assignOperatorToCustomer(
        request.customerId,
        request.customerName,
        operatorId
      )

      return assignment
    } catch (error) {
      console.error('Error accepting chat request:', error)
      return null
    }
  }

  // 채팅 종료 (양방향)
  async completeChat(assignmentId: string): Promise<void> {
    try {
      const assignmentRef = ref(database, `chatAssignments/${assignmentId}`)
      const snapshot = await get(assignmentRef)
      
      if (!snapshot.exists()) return
      
      const assignment = snapshot.val()
      
      // chatAssignments 상태 업데이트
      await set(assignmentRef, {
        ...assignment,
        status: 'completed',
        completedAt: new Date().toISOString()
      })
      
      // customerAssignments도 업데이트 (양방향 종료를 위해)
      if (assignment.customerId) {
        await set(ref(database, `customerAssignments/${assignment.customerId}`), {
          ...assignment,
          status: 'completed',
          completedAt: new Date().toISOString()
        })
      }

      // 운영자의 활성 채팅 수 감소
      await this.updateOperatorActiveChats(assignment.operatorId, -1)
    } catch (error) {
      console.error('Error completing chat:', error)
    }
  }

  // 운영자에게 할당된 고객 목록 가져오기
  async getCustomersForOperator(operatorId: string): Promise<ChatAssignment[]> {
    try {
      const assignmentsRef = ref(database, 'customerAssignments')
      const snapshot = await get(assignmentsRef)
      
      const assignments: ChatAssignment[] = []
      
      if (snapshot.exists()) {
        Object.entries(snapshot.val()).forEach(([customerId, assignment]: [string, any]) => {
          if (assignment.operatorId === operatorId && assignment.status === 'active') {
            assignments.push({
              id: customerId,
              customerId,
              customerName: assignment.customerName,
              operatorId: assignment.operatorId,
              operatorName: '', // Will be filled later if needed
              status: assignment.status,
              createdAt: assignment.createdAt,
              acceptedAt: assignment.acceptedAt,
              lastMessageAt: assignment.lastMessageAt
            })
          }
        })
      }
      
      return assignments
    } catch (error) {
      console.error('Error getting customers for operator:', error)
      return []
    }
  }

  // 운영자의 활성 채팅 수 업데이트
  private async updateOperatorActiveChats(operatorId: string, delta: number): Promise<void> {
    try {
      const operatorRef = ref(database, `operators/${operatorId}`)
      const snapshot = await get(operatorRef)
      
      if (snapshot.exists()) {
        const operator = snapshot.val()
        const newActiveChats = Math.max(0, (operator.activeChats || 0) + delta)
        
        await set(ref(database, `operators/${operatorId}/activeChats`), newActiveChats)
      }
    } catch (error) {
      console.error('Error updating active chats:', error)
    }
  }

  // 대기 중인 채팅 요청 구독
  subscribeToPendingRequests(callback: (requests: ChatRequest[]) => void): () => void {
    const requestsRef = ref(database, 'chatRequests')
    
    const listener = onValue(requestsRef, (snapshot) => {
      const requests: ChatRequest[] = []
      
      if (snapshot.exists()) {
        Object.entries(snapshot.val()).forEach(([id, request]: [string, any]) => {
          if (request.status === 'waiting') {
            requests.push({ ...request, id })
          }
        })
      }
      
      // 최신 요청이 먼저 오도록 정렬
      requests.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      callback(requests)
    })

    return () => off(requestsRef, 'value', listener)
  }

  // 운영자 목록 구독
  subscribeToOperators(callback: (operators: OperatorStatus[]) => void): () => void {
    const operatorsRef = ref(database, 'operators')
    
    const listener = onValue(operatorsRef, (snapshot) => {
      const operators: OperatorStatus[] = []
      
      if (snapshot.exists()) {
        Object.entries(snapshot.val()).forEach(([id, operator]: [string, any]) => {
          operators.push({ ...operator, id })
        })
      }
      
      callback(operators)
    })

    return () => off(operatorsRef, 'value', listener)
  }

  // 고객의 채팅 요청 상태 구독
  subscribeToCustomerRequest(
    customerId: string, 
    callback: (request: ChatRequest | null) => void
  ): () => void {
    const requestsRef = ref(database, 'chatRequests')
    
    const listener = onValue(requestsRef, (snapshot) => {
      let customerRequest: ChatRequest | null = null
      
      if (snapshot.exists()) {
        Object.entries(snapshot.val()).forEach(([id, request]: [string, any]) => {
          if (request.customerId === customerId && request.status === 'waiting') {
            customerRequest = { ...request, id }
          }
        })
      }
      
      callback(customerRequest)
    })

    return () => off(requestsRef, 'value', listener)
  }
}

export default ChatAssignmentService.getInstance()