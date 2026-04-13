import { readdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

export type AlbumMeta = {
  slug: string
  label: string
  sub: string
  href: string
  rotation: string
  tapeR: string
}

export type CellClass = '' | 'bento-portrait' | 'bento-landscape'

export type PhotoInfo = {
  src: string
  cellClass: CellClass
}

export type AlbumData = AlbumMeta & {
  cover: string
  previews: string[]    // first 4 src strings — used by hero expanded view
  photos: PhotoInfo[]   // all photos with cell class — used by album page
}

const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i

export const ALBUM_META: AlbumMeta[] = [
  { slug: 'commercial',   label: 'Commercial',   sub: 'your brand story', href: '/albums/commercial',   rotation: '-2.5deg', tapeR: '1.5deg'  },
  { slug: 'duo',          label: 'Duo',          sub: 'two as one',       href: '/albums/duo',          rotation: '4deg',    tapeR: '-1.5deg' },
  { slug: 'experimental', label: 'Experimental', sub: 'for the dreamers', href: '/albums/experimental', rotation: '-1.5deg', tapeR: '2deg'    },
  { slug: 'landscapes',   label: 'Landscapes',   sub: 'wide open spaces', href: '/albums/landscapes',   rotation: '3deg',    tapeR: '-0.5deg' },
  { slug: 'personal',     label: 'Personal',     sub: 'everyday moments', href: '/albums/personal',     rotation: '-3.5deg', tapeR: '1deg'    },
]

export function getAlbumMeta(slug: string): AlbumMeta | undefined {
  return ALBUM_META.find(a => a.slug === slug)
}

function cellClass(width: number, height: number): CellClass {
  if (!width || !height) return ''
  const ratio = width / height
  if (ratio < 0.8)  return 'bento-portrait'   // clearly vertical  → 1 col × 2 rows
  if (ratio > 1.25) return 'bento-landscape'  // clearly horizontal → 2 cols × 1 row
  return ''                                    // square / near-square → 1×1
}

async function findCover(slug: string): Promise<string> {
  try {
    const dir = path.join(process.cwd(), 'public/photos/hero')
    const files = await readdir(dir)
    const match = files.find(f => f.toLowerCase().startsWith(slug + '.') && IMAGE_EXT.test(f))
    if (match) return `/photos/hero/${match}`
  } catch {}
  return `/photos/hero/${slug}.jpg`
}

async function readAlbumPhotoInfos(slug: string): Promise<PhotoInfo[]> {
  try {
    const dir = path.join(process.cwd(), `public/photos/albums/${slug}`)
    const files = await readdir(dir)
    const sorted = files.filter(f => IMAGE_EXT.test(f)).sort()

    return Promise.all(sorted.map(async (f) => {
      const src = `/photos/albums/${slug}/${f}`
      try {
        const meta = await sharp(path.join(dir, f)).metadata()
        let w = meta.width  ?? 0
        let h = meta.height ?? 0
        // EXIF orientations 5–8 are 90°/270° rotations — swap to get display dimensions
        if (meta.orientation && meta.orientation >= 5) [w, h] = [h, w]
        return { src, cellClass: cellClass(w, h) }
      } catch {
        return { src, cellClass: '' as CellClass }
      }
    }))
  } catch {
    return []
  }
}

export async function getAlbums(): Promise<AlbumData[]> {
  return Promise.all(
    ALBUM_META.map(async (meta) => {
      const [cover, photos] = await Promise.all([
        findCover(meta.slug),
        readAlbumPhotoInfos(meta.slug),
      ])
      const previews = photos.slice(0, 4).map(p => p.src)
      return { ...meta, cover, previews, photos }
    })
  )
}

export async function getAlbum(slug: string): Promise<AlbumData | undefined> {
  const meta = getAlbumMeta(slug)
  if (!meta) return undefined
  const [cover, photos] = await Promise.all([
    findCover(slug),
    readAlbumPhotoInfos(slug),
  ])
  const previews = photos.slice(0, 4).map(p => p.src)
  return { ...meta, cover, previews, photos }
}
