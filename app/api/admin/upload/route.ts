import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'

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

    let destDir: string
    if (type === 'album' && slug) {
      destDir = path.join(process.cwd(), 'public', 'photos', 'albums', slug)
    } else if (type === 'project') {
      destDir = path.join(process.cwd(), 'public', 'photos', 'projects')
    } else if (type === 'hero') {
      destDir = path.join(process.cwd(), 'public', 'photos', 'hero')
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Derive the new filename: keep the old base name, use new file's extension
    const oldFilename = path.basename(oldPath.split('?')[0])
    const oldExt = path.extname(oldFilename)
    const baseName = path.basename(oldFilename, oldExt)
    const newExt = path.extname(file.name) || oldExt
    const newFilename = `${baseName}${newExt}`

    const bytes = await file.arrayBuffer()
    await writeFile(path.join(destDir, newFilename), Buffer.from(bytes))

    // Remove the old file if the extension changed
    if (newFilename !== oldFilename) {
      try {
        await unlink(path.join(destDir, oldFilename))
      } catch {
        // ignore — old file may already be gone
      }
    }

    const newSrcPath =
      type === 'album'  ? `/photos/albums/${slug}/${newFilename}`  :
      type === 'hero'   ? `/photos/hero/${newFilename}`            :
                          `/photos/projects/${newFilename}`

    return NextResponse.json({ success: true, newPath: newSrcPath })
  } catch (err) {
    console.error('[admin/upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
