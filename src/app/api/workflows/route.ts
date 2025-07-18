import { NextRequest, NextResponse } from 'next/server'
import workflowEngine from '@/services/workflow-engine'

// GET /api/workflows - 워크플로우 목록 조회
export async function GET() {
  try {
    const workflows = await workflowEngine.getWorkflows()
    return NextResponse.json({ workflows })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/workflows - 워크플로우 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const workflow = await workflowEngine.saveWorkflow(body)
    return NextResponse.json({ success: true, workflow })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}