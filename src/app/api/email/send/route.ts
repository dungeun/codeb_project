import { NextRequest, NextResponse } from 'next/server'
import emailService from '@/services/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await emailService.sendEmail(body)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}