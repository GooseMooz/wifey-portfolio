import { access, mkdir, readdir, stat } from 'fs/promises'
import path from 'path'

const FALLBACK_PUBLIC_ROOT = path.join(process.cwd(), 'public', 'photos')
const CONFIGURED_ROOT = process.env.PHOTO_STORAGE_DIR
  ? path.resolve(process.env.PHOTO_STORAGE_DIR)
  : path.join(process.cwd(), 'data', 'photos')

const MEDIA_PREFIX = '/media/'

function stripQuery(src: string): string {
  return src.split('?')[0]
}

function relativeFromUrl(src: string): string {
  const clean = stripQuery(src)
  if (clean.startsWith(MEDIA_PREFIX)) return clean.slice(MEDIA_PREFIX.length)
  if (clean.startsWith('/photos/')) return clean.slice('/photos/'.length)
  throw new Error(`Unsupported media path: ${src}`)
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export async function getPhotosRoot(): Promise<string> {
  if (await pathExists(CONFIGURED_ROOT)) return CONFIGURED_ROOT
  if (await pathExists(FALLBACK_PUBLIC_ROOT)) return FALLBACK_PUBLIC_ROOT
  await mkdir(CONFIGURED_ROOT, { recursive: true })
  return CONFIGURED_ROOT
}

export async function ensurePhotosDir(relativeDir = ''): Promise<string> {
  const root = await getPhotosRoot()
  const target = path.join(root, relativeDir)
  await mkdir(target, { recursive: true })
  return target
}

export async function getPhotoFilePath(src: string): Promise<string> {
  const root = await getPhotosRoot()
  return path.join(root, relativeFromUrl(src))
}

export function toMediaUrl(relativePath: string): string {
  return `${MEDIA_PREFIX}${relativePath.replace(/^\/+/, '')}`
}

export async function readPhotoDir(relativeDir: string): Promise<string[]> {
  const dir = await ensurePhotosDir(relativeDir)
  return readdir(dir)
}

export async function isPhotoNewer(sourceSrc: string, targetSrc: string): Promise<boolean> {
  try {
    const [sourceStat, targetStat] = await Promise.all([
      stat(await getPhotoFilePath(sourceSrc)),
      stat(await getPhotoFilePath(targetSrc)),
    ])
    return sourceStat.mtimeMs > targetStat.mtimeMs
  } catch {
    return true
  }
}
