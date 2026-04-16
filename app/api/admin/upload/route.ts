import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { ensureImageVariant } from '@/lib/imageVariants'
import { ensurePhotosDir, toMediaUrl } from '@/lib/photoStorage'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null
    const slug = formData.get('slug') as string | null
    const oldPath = formData.get('oldPath') as string | null

    if (!file || !type || !oldPath) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let relativeDir: string
    if (type === 'album' && slug) {
      relativeDir = path.posix.join('albums', slug)
    } else if (type === 'project') {
      relativeDir = 'projects'
    } else if (type === 'hero') {
      relativeDir = 'hero'
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const destDir = await ensurePhotosDir(relativeDir)
    const oldFilename = path.basename(oldPath.split('?')[0])
    const oldExt = path.extname(oldFilename)
    const baseName = path.basename(oldFilename, oldExt)
    const newExt = path.extname(file.name) || oldExt
    const newFilename = `${baseName}${newExt}`

    const bytes = await file.arrayBuffer()
    await writeFile(path.join(destDir, newFilename), Buffer.from(bytes))

    if (newFilename !== oldFilename) {
      try {
        await unlink(path.join(destDir, oldFilename))
      } catch {}
    }

    const newSrcPath =
      type === 'album'  ? toMediaUrl(path.posix.join('albums', slug!, newFilename)) :
      type === 'hero'   ? toMediaUrl(path.posix.join('hero', newFilename)) :
                          toMediaUrl(path.posix.join('projects', newFilename))

    if (type === 'album') {
      await ensureImageVariant(newSrcPath, 'album-preview')
    } else if (type === 'hero') {
      await ensureImageVariant(newSrcPath, 'hero-cover')
    } else if (type === 'project') {
      await ensureImageVariant(newSrcPath, 'project-card')
    }

    return NextResponse.json({ success: true, newPath: newSrcPath })
  } catch (err) {
    console.error('[admin/upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
