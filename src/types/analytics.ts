export interface PredictionData {
  id: string
  type: 'project_completion' | 'budget_forecast' | 'resource_utilization' | 'risk_assessment'
  confidence: number
  timestamp: Date
  data: any
}

export interface ProjectPrediction {
  projectId: string
  completionDate: Date
  confidence: number
  currentProgress: number
  predictedProgress: number[]
  risks: RiskFactor[]
  recommendations: string[]
}

export interface BudgetPrediction {
  projectId: string
  currentBudget: number
  predictedTotal: number
  burnRate: number
  estimatedCompletion: number
  monthlyForecast: MonthlyBudget[]
  overrunRisk: number
}

export interface ResourcePrediction {
  totalCapacity: number
  currentUtilization: number
  predictedUtilization: number[]
  bottlenecks: ResourceBottleneck[]
  optimizationSuggestions: string[]
}

export interface RiskFactor {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  probability: number
  impact: string
  mitigation: string
}

export interface MonthlyBudget {
  month: string
  predicted: number
  actual?: number
  variance?: number
}

export interface ResourceBottleneck {
  resourceId: string
  resourceName: string
  period: string
  utilization: number
  impact: string
}

export interface TrendData {
  label: string
  value: number
  predicted?: boolean
}

export interface AnalyticsMetric {
  id: string
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  prediction: number
  confidence: number
}