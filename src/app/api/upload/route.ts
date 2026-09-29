import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const API_BASE = process.env.API_BASE_URL as string

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const endpoint = formData.get('_endpoint') as string
    if (!endpoint) return NextResponse.json({ success: false, message: 'Missing endpoint' }, { status: 400 })
    formData.delete('_endpoint')

    const token = request.headers.get('authorization') || ''
    const url = `${API_BASE}${endpoint}`

    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = token

    const res = await fetch(url, { method: 'POST', headers, body: formData })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ success: false, message: 'Upload proxy failed' }, { status: 500 })
  }
}
