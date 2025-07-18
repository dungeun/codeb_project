// Type overrides for KanbanBoardPro to handle type mismatches during build
declare module '@/components/kanban/KanbanBoardPro' {
  interface KanbanColumn {
    id: string
    title: string
    color: string
    limit?: number
    tasks: any[] // Allow any task type for flexibility
  }
  
  interface KanbanBoardProProps {
    columns: KanbanColumn[]
    onColumnsChange?: (columns: KanbanColumn[]) => void
    onTaskAdd?: (columnId: string) => void
    onTaskEdit?: (task: any) => void
    onTaskDelete?: (taskId: string, columnId?: string) => void | Promise<void>
  }
}