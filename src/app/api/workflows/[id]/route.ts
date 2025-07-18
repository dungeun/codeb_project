import { NextRequest, NextResponse } from 'next/server'
import workflowEngine from '@/services/workflow-engine'

// GET /api/workflows/[id] - 특정 워크플로우 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflow = await workflowEngine.getWorkflow(params.id)
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }
    return NextResponse.json({ workflow })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/workflows/[id] - 워크플로우 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const workflow = await workflowEngine.updateWorkflow(params.id, body)
    return NextResponse.json({ success: true, workflow })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/workflows/[id] - 워크플로우 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await workflowEngine.deleteWorkflow(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}