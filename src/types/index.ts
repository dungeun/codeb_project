export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'customer' | 'team_member' | 'external'
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  name: string
  description: string
  clientId: string
  clientGroup?: string // 고객 그룹 ID
  status: 'planning' | 'design' | 'development' | 'testing' | 'completed'
  progress: number
  startDate: Date
  endDate: Date
  team: string[]
  budget: number
  createdAt: Date
  updatedAt: Date
}

// Task 타입은 task.ts에서 import
export type { 
  Task, 
  BaseTask, 
  KanbanTask, 
  GanttTask, 
  TaskStatus, 
  TaskPriority,
  ChecklistItem,
  TaskAttachment,
  TaskComment,
  TaskSummary 
} from './task'

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  attachments?: string[]
  read: boolean
  timestamp: Date
}

export interface File {
  id: string
  name: string
  size: number
  type: string
  url: string
  projectId: string
  uploadedBy: string
  category: 'document' | 'image' | 'video' | 'other'
  createdAt: Date
}

export interface ProjectInvitation {
  id: string
  projectId: string
  invitedBy: string
  inviteCode: string
  email?: string
  expiresAt: Date
  usedAt?: Date
  usedBy?: string
  status: 'active' | 'used' | 'expired' | 'revoked'
  permissions: {
    viewProject: boolean
    viewTasks: boolean
    viewFiles: boolean
    viewChat: boolean
  }
  createdAt: Date
}

export interface ExternalUser {
  id: string
  email: string
  name: string
  invitationId: string
  projectIds: string[]
  lastAccess: Date
  createdAt: Date
}
