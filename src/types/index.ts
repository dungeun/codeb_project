export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'customer' | 'team_member'
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  name: string
  description: string
  clientId: string
  status: 'planning' | 'design' | 'development' | 'testing' | 'completed'
  progress: number
  startDate: Date
  endDate: Date
  team: string[]
  budget: number
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  assignee: string
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate: Date
  tags: string[]
  attachments: string[]
  createdAt: Date
  updatedAt: Date
}

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
