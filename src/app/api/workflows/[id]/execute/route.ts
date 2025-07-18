import { NextRequest, NextResponse } from 'next/server'
import workflowEngine from '@/services/workflow-engine'

// POST /api/workflows/[id]/execute - 워크플로우 수동 실행
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const executionId = await workflowEngine.executeWorkflow(params.id)
    return NextResponse.json({ success: true, executionId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}