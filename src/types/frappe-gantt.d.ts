declare module 'frappe-gantt' {
  interface Task {
    id: string
    name: string
    start: string
    end: string
    progress: number
    custom_class?: string
    dependencies?: string
  }

  interface GanttOptions {
    header_height?: number
    column_width?: number
    step?: number
    view_modes?: string[]
    bar_height?: number
    bar_corner_radius?: number
    arrow_curve?: number
    padding?: number
    view_mode?: string
    date_format?: string
    custom_popup_html?: (task: Task) => string
    on_click?: (task: Task) => void
    on_date_change?: (task: Task, start: Date, end: Date) => void
    on_progress_change?: (task: Task, progress: number) => void
    on_view_change?: (mode: string) => void
  }

  class Gantt {
    constructor(element: HTMLElement, tasks: Task[], options?: GanttOptions)
    refresh(tasks: Task[]): void
    change_view_mode(mode: string): void
    destructor(): void
  }

  export default Gantt
}
