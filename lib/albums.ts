import { readdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { ensureImageVariant } from './imageVariants'
import { cropToObjectPosition, cropToScale, getAlbumPhotoMeta, mediaKey, sortByDeclaredOrder } from './photoMeta'
import { ensurePhotosDir, toMediaUrl } from './photoStorage'

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
  objectPosition: string
  objectScale: number
}

export type AlbumData = AlbumMeta & {
  cover: string
  coverPreview: string
  coverPosition: string
  coverScale: number
  previews: string[]
  photos: PhotoInfo[]
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
  if (ratio < 0.8) return 'bento-portrait'
  if (ratio > 1.25) return 'bento-landscape'
  return ''
}

async function findCover(slug: string): Promise<string> {
  try {
    const dir = await ensurePhotosDir('hero')
    const files = await readdir(dir)
    const match = files.find(f => f.toLowerCase().startsWith(slug + '.') && IMAGE_EXT.test(f))
    if (match) return toMediaUrl(path.posix.join('hero', match))
  } catch {}
  return toMediaUrl(path.posix.join('hero', `${slug}.jpg`))
}

async function readAlbumPhotoInfos(slug: string): Promise<PhotoInfo[]> {
  try {
    const relativeDir = path.posix.join('albums', slug)
    const dir = await ensurePhotosDir(relativeDir)
    const [files, meta] = await Promise.all([
      readdir(dir),
      getAlbumPhotoMeta(slug),
    ])
    const sorted = sortByDeclaredOrder(
      files.filter(f => IMAGE_EXT.test(f)),
      (meta.photoOrder ?? []).filter(entry => !entry.includes('/'))
    )

    return Promise.all(sorted.map(async (fileName) => {
      const src = toMediaUrl(path.posix.join(relativeDir, fileName))
      const crop = meta.photoCrops?.[mediaKey(src)]
      try {
        const meta = await sharp(path.join(dir, fileName)).metadata()
        let w = meta.width ?? 0
        let h = meta.height ?? 0
        if (meta.orientation && meta.orientation >= 5) [w, h] = [h, w]
        return { src, cellClass: cellClass(w, h), objectPosition: cropToObjectPosition(crop), objectScale: cropToScale(crop) }
      } catch {
        return { src, cellClass: '' as CellClass, objectPosition: cropToObjectPosition(crop), objectScale: cropToScale(crop) }
      }
    }))
  } catch {
    return []
  }
}

export async function getAlbums(): Promise<AlbumData[]> {
  return Promise.all(
    ALBUM_META.map(async (meta) => {
      const [cover, photos, albumPhotoMeta] = await Promise.all([
        findCover(meta.slug),
        readAlbumPhotoInfos(meta.slug),
        getAlbumPhotoMeta(meta.slug),
      ])
      const [coverPreview, previews] = await Promise.all([
        ensureImageVariant(cover, 'hero-cover'),
        Promise.all(photos.slice(0, 4).map(photo => ensureImageVariant(photo.src, 'album-preview'))),
      ])
      return {
        ...meta,
        cover,
        coverPreview,
        coverPosition: cropToObjectPosition(albumPhotoMeta.coverCrop),
        coverScale: cropToScale(albumPhotoMeta.coverCrop),
        previews,
        photos,
      }
    })
  )
}

export async function getAlbum(slug: string): Promise<AlbumData | undefined> {
  const meta = getAlbumMeta(slug)
  if (!meta) return undefined

  const [cover, photos, albumPhotoMeta] = await Promise.all([
    findCover(slug),
    readAlbumPhotoInfos(slug),
    getAlbumPhotoMeta(slug),
  ])
  const [coverPreview, previews] = await Promise.all([
    ensureImageVariant(cover, 'hero-cover'),
    Promise.all(photos.slice(0, 4).map(photo => ensureImageVariant(photo.src, 'album-preview'))),
  ])

  return {
    ...meta,
    cover,
    coverPreview,
    coverPosition: cropToObjectPosition(albumPhotoMeta.coverCrop),
    coverScale: cropToScale(albumPhotoMeta.coverCrop),
    previews,
    photos,
  }
}
