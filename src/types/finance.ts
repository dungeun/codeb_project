// 재무 관련 타입 정의

export interface Invoice {
  id: string
  projectId: string
  projectName: string
  clientId: string
  clientName: string
  invoiceNumber: string
  issueDate: Date
  dueDate: Date
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  paymentDate: Date
  method: 'bank_transfer' | 'credit_card' | 'cash' | 'check'
  reference?: string
  notes?: string
  createdAt: Date
}

export interface Expense {
  id: string
  projectId?: string
  category: 'salary' | 'office' | 'equipment' | 'software' | 'marketing' | 'other'
  description: string
  amount: number
  date: Date
  vendor?: string
  receipt?: string
  approvedBy?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  updatedAt: Date
}

export interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  pendingInvoices: number
  overdueInvoices: number
  monthlyRevenue: MonthlyData[]
  monthlyExpenses: MonthlyData[]
  revenueByProject: ProjectRevenue[]
  expensesByCategory: CategoryExpense[]
}

export interface MonthlyData {
  month: string
  amount: number
}

export interface ProjectRevenue {
  projectId: string
  projectName: string
  revenue: number
  percentage: number
}

export interface CategoryExpense {
  category: string
  amount: number
  percentage: number
}