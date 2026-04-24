import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { getPhotosRoot, relativeFromUrl } from './photoStorage'

export type CropPosition = {
  x: number
  y: number
  scale: number
}

type SitePhotoMeta = {
  heroCrops?: Record<string, CropPosition>
  projectCrops?: Record<string, CropPosition>
}

type AlbumPhotoMeta = {
  coverCrop?: CropPosition
  photoCrops?: Record<string, CropPosition>
  photoOrder?: string[]
  label?: string
  sub?: string
}

function defaultCrop(): CropPosition {
  return { x: 50, y: 50, scale: 1 }
}

async function metaDir(): Promise<string> {
  const root = await getPhotosRoot()
  const dir = path.join(root, '.meta')
  await mkdir(dir, { recursive: true })
  return dir
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, 'utf8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function writeJsonFile(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(value, null, 2))
}

async function siteMetaPath(): Promise<string> {
  return path.join(await metaDir(), 'site.json')
}

async function albumMetaPath(slug: string): Promise<string> {
  return path.join(await metaDir(), 'albums', `${slug}.json`)
}

export async function getSitePhotoMeta(): Promise<SitePhotoMeta> {
  return readJsonFile(await siteMetaPath(), {})
}

export async function updateSitePhotoMeta(
  updater: (current: SitePhotoMeta) => SitePhotoMeta
): Promise<SitePhotoMeta> {
  const next = updater(await getSitePhotoMeta())
  await writeJsonFile(await siteMetaPath(), next)
  return next
}

export async function getAlbumPhotoMeta(slug: string): Promise<AlbumPhotoMeta> {
  return readJsonFile(await albumMetaPath(slug), {})
}

export async function updateAlbumPhotoMeta(
  slug: string,
  updater: (current: AlbumPhotoMeta) => AlbumPhotoMeta
): Promise<AlbumPhotoMeta> {
  const next = updater(await getAlbumPhotoMeta(slug))
  await writeJsonFile(await albumMetaPath(slug), next)
  return next
}

export function cropToObjectPosition(crop?: CropPosition): string {
  const value = crop ?? defaultCrop()
  return `${value.x}% ${value.y}%`
}

export function cropToScale(crop?: CropPosition): number {
  return crop?.scale ?? 1
}

export function normalizeCrop(input?: Partial<CropPosition> | null): CropPosition {
  const clamp = (value: number | undefined) => Math.max(0, Math.min(100, Number.isFinite(value) ? value! : 50))
  const clampScale = (value: number | undefined) => Math.max(1, Math.min(2.5, Number.isFinite(value) ? value! : 1))
  return {
    x: clamp(input?.x),
    y: clamp(input?.y),
    scale: clampScale(input?.scale),
  }
}

export function mediaKey(src: string): string {
  return relativeFromUrl(src)
}

export function sortByDeclaredOrder(items: string[], order: string[]): string[] {
  const orderIndex = new Map(order.map((item, index) => [item, index]))
  return [...items].sort((a, b) => {
    const ai = orderIndex.get(a)
    const bi = orderIndex.get(b)
    if (ai === undefined && bi === undefined) return a.localeCompare(b)
    if (ai === undefined) return 1
    if (bi === undefined) return -1
    return ai - bi
  })
}
