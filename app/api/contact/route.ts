import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data/submissions.json')

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { fname, email, type, message } = body
    if (!fname || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await mkdir(path.dirname(DATA_FILE), { recursive: true })

    let submissions: unknown[] = []
    try {
      const raw = await readFile(DATA_FILE, 'utf-8')
      submissions = JSON.parse(raw)
    } catch {
      // file doesn't exist yet — start fresh
    }

    submissions.push({
      name: fname,
      email,
      type: type || 'Not specified',
      message,
      submittedAt: new Date().toISOString(),
    })

    await writeFile(DATA_FILE, JSON.stringify(submissions, null, 2), 'utf-8')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact] Failed to save submission:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
