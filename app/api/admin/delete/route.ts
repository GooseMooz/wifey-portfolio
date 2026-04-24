import { unlink } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { getPhotoFilePath } from '@/lib/photoStorage'
import { mediaKey, updateAlbumPhotoMeta } from '@/lib/photoMeta'

function albumPreviewSrc(src: string): string {
  const clean = src.split('?')[0].replace(/^\/+/, '').replace(/^media\//, '')
  const withoutExt = clean.replace(/\.[^/.]+$/, '')
  return `/media/derived/album-preview/v3/${withoutExt}.webp`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { type: string; slug: string; src: string }

    if (body.type !== 'album-photo' || !body.slug || !body.src) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { slug, src } = body

    await Promise.allSettled([
      getPhotoFilePath(src).then(p => unlink(p)),
      getPhotoFilePath(albumPreviewSrc(src)).then(p => unlink(p)),
    ])

    const filename = path.basename(src.split('?')[0])
    const key = mediaKey(src)
    await updateAlbumPhotoMeta(slug, current => {
      const photoOrder = (current.photoOrder ?? []).filter(f => f !== filename)
      const photoCrops = { ...(current.photoCrops ?? {}) }
      delete photoCrops[key]
      return { ...current, photoOrder, photoCrops }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/delete]', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
