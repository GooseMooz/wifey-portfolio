import { readFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { getPhotosRoot } from '@/lib/photoStorage'

function contentTypeFor(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    case '.avif':
      return 'image/avif'
    case '.gif':
      return 'image/gif'
    case '.svg':
      return 'image/svg+xml'
    default:
      return 'application/octet-stream'
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const root = await getPhotosRoot()
  const filePath = path.join(root, ...segments)
  const normalizedRoot = `${root}${path.sep}`
  const normalizedFile = path.normalize(filePath)

  if (!normalizedFile.startsWith(normalizedRoot) && normalizedFile !== root) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const buffer = await readFile(normalizedFile)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentTypeFor(normalizedFile),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
