import { NextRequest, NextResponse } from 'next/server'
import workflowEngine from '@/services/workflow-engine'

// GET /api/workflows/[id]/executions - 워크플로우 실행 로그 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const executions = await workflowEngine.getExecutionLogs(params.id)
    return NextResponse.json({ executions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}