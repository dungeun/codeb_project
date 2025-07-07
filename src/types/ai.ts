// AI 관련 타입 정의

export interface AIAssistantMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    model?: string
    tokens?: number
    processingTime?: number
  }
}

export interface AIContext {
  projectId?: string
  userId: string
  conversationId: string
  history: AIAssistantMessage[]
}

export interface AIAnalysis {
  id: string
  type: 'project' | 'code' | 'design' | 'business'
  title: string
  summary: string
  insights: AIInsight[]
  recommendations: AIRecommendation[]
  confidence: number
  createdAt: Date
}

export interface AIInsight {
  id: string
  category: string
  description: string
  impact: 'low' | 'medium' | 'high'
  data?: any
}

export interface AIRecommendation {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedImpact: string
  actionItems: string[]
}

export interface WorkflowAutomation {
  id: string
  name: string
  description: string
  trigger: WorkflowTrigger
  actions: WorkflowAction[]
  conditions?: WorkflowCondition[]
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface WorkflowTrigger {
  type: 'schedule' | 'event' | 'webhook' | 'manual'
  config: {
    schedule?: string // cron expression
    event?: string
    webhook?: string
  }
}

export interface WorkflowAction {
  id: string
  type: 'notification' | 'task_creation' | 'status_update' | 'email' | 'api_call'
  config: Record<string, any>
  order: number
}

export interface WorkflowCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

export interface PredictiveAnalytics {
  projectCompletionPrediction: {
    estimatedDate: Date
    confidence: number
    factors: string[]
    risks: RiskFactor[]
  }
  budgetPrediction: {
    estimatedTotal: number
    currentBurnRate: number
    projectedOverrun: number
    confidence: number
  }
  resourcePrediction: {
    peakDemandPeriods: Period[]
    bottlenecks: ResourceBottleneck[]
    recommendations: string[]
  }
}

export interface RiskFactor {
  id: string
  description: string
  probability: number
  impact: 'low' | 'medium' | 'high' | 'critical'
  mitigation: string
}

export interface Period {
  start: Date
  end: Date
  intensity: number
}

export interface ResourceBottleneck {
  resource: string
  period: Period
  severity: 'low' | 'medium' | 'high'
  suggestion: string
}