import { database } from '@/lib/firebase'
import { ref, set, get } from 'firebase/database'

interface PeriodStats {
  completedTasks: number
  activeTasks: number
  activeProjects: number
  monthlyRevenue: number
  activeCustomers: number
  timestamp: string
}

class StatsService {
  // 일별 통계 저장
  async saveDailyStats(userId: string, stats: Omit<PeriodStats, 'timestamp'>) {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const statsRef = ref(database, `stats/daily/${userId}/${today}`)
    
    await set(statsRef, {
      ...stats,
      timestamp: new Date().toISOString()
    })
  }

  // 이전 일의 통계 가져오기
  async getPreviousDayStats(userId: string): Promise<PeriodStats | null> {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateKey = yesterday.toISOString().split('T')[0]
    
    const statsRef = ref(database, `stats/daily/${userId}/${dateKey}`)
    const snapshot = await get(statsRef)
    
    if (snapshot.exists()) {
      return snapshot.val()
    }
    
    // 어제 데이터가 없으면 더 이전 데이터 찾기 (최대 7일)
    for (let i = 2; i <= 7; i++) {
      const prevDate = new Date()
      prevDate.setDate(prevDate.getDate() - i)
      const prevDateKey = prevDate.toISOString().split('T')[0]
      
      const prevStatsRef = ref(database, `stats/daily/${userId}/${prevDateKey}`)
      const prevSnapshot = await get(prevStatsRef)
      
      if (prevSnapshot.exists()) {
        return prevSnapshot.val()
      }
    }
    
    return null
  }

  // 주간 통계 저장
  async saveWeeklyStats(userId: string, stats: Omit<PeriodStats, 'timestamp'>) {
    const weekNumber = this.getWeekNumber(new Date())
    const year = new Date().getFullYear()
    const weekKey = `${year}-W${weekNumber}`
    
    const statsRef = ref(database, `stats/weekly/${userId}/${weekKey}`)
    
    await set(statsRef, {
      ...stats,
      timestamp: new Date().toISOString()
    })
  }

  // 이전 주의 통계 가져오기
  async getPreviousWeekStats(userId: string): Promise<PeriodStats | null> {
    const currentWeek = this.getWeekNumber(new Date())
    const year = new Date().getFullYear()
    const prevWeekKey = `${year}-W${currentWeek - 1}`
    
    const statsRef = ref(database, `stats/weekly/${userId}/${prevWeekKey}`)
    const snapshot = await get(statsRef)
    
    return snapshot.exists() ? snapshot.val() : null
  }

  // 월간 통계 저장
  async saveMonthlyStats(userId: string, stats: Omit<PeriodStats, 'timestamp'>) {
    const month = new Date().toISOString().slice(0, 7) // YYYY-MM
    const statsRef = ref(database, `stats/monthly/${userId}/${month}`)
    
    await set(statsRef, {
      ...stats,
      timestamp: new Date().toISOString()
    })
  }

  // 이전 월의 통계 가져오기
  async getPreviousMonthStats(userId: string): Promise<PeriodStats | null> {
    const currentDate = new Date()
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    const monthKey = prevMonth.toISOString().slice(0, 7)
    
    const statsRef = ref(database, `stats/monthly/${userId}/${monthKey}`)
    const snapshot = await get(statsRef)
    
    return snapshot.exists() ? snapshot.val() : null
  }

  // 변화량 계산
  calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  // 주 번호 계산
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }
}

export default new StatsService()