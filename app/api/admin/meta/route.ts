import { NextRequest, NextResponse } from 'next/server'
import { mediaKey, normalizeCrop, updateAlbumPhotoMeta, updateSitePhotoMeta } from '@/lib/photoMeta'

type Body =
  | { kind: 'album-cover-crop'; slug: string; crop: { x: number; y: number } }
  | { kind: 'album-photo-crop'; slug: string; src: string; crop: { x: number; y: number } }
  | { kind: 'album-order'; slug: string; orderedSrcs: string[] }
  | { kind: 'album-label'; slug: string; label: string; sub: string }
  | { kind: 'hero-crop'; slug: string; crop: { x: number; y: number } }
  | { kind: 'project-crop'; src: string; crop: { x: number; y: number } }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Body

    if (body.kind === 'album-cover-crop') {
      await updateAlbumPhotoMeta(body.slug, current => ({
        ...current,
        coverCrop: normalizeCrop(body.crop),
      }))
    } else if (body.kind === 'album-photo-crop') {
      await updateAlbumPhotoMeta(body.slug, current => ({
        ...current,
        photoCrops: {
          ...(current.photoCrops ?? {}),
          [mediaKey(body.src)]: normalizeCrop(body.crop),
        },
      }))
    } else if (body.kind === 'album-order') {
      await updateAlbumPhotoMeta(body.slug, current => ({
        ...current,
        photoOrder: body.orderedSrcs.map(src => mediaKey(src).split('/').pop()!).filter(Boolean),
      }))
    } else if (body.kind === 'album-label') {
      await updateAlbumPhotoMeta(body.slug, current => ({
        ...current,
        label: body.label,
        sub: body.sub,
      }))
    } else if (body.kind === 'hero-crop') {
      await updateAlbumPhotoMeta(body.slug, current => ({
        ...current,
        coverCrop: normalizeCrop(body.crop),
      }))
    } else if (body.kind === 'project-crop') {
      await updateSitePhotoMeta(current => ({
        ...current,
        projectCrops: {
          ...(current.projectCrops ?? {}),
          [mediaKey(body.src)]: normalizeCrop(body.crop),
        },
      }))
    } else {
      return NextResponse.json({ error: 'Invalid metadata request' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/meta]', error)
    return NextResponse.json({ error: 'Metadata update failed' }, { status: 500 })
  }
}
