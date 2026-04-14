import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const res = await fetch('http://localhost:3011/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Backend error' }, { status: res.status })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact] proxy failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
