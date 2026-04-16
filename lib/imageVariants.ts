import { mkdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { getPhotoFilePath, isPhotoNewer, toMediaUrl } from './photoStorage'

type VariantName = 'about-main' | 'hero-cover' | 'album-preview' | 'project-card'

type VariantConfig = {
  dir: string
  width: number
  height: number
  quality: number
  version: string
}

const VARIANTS: Record<VariantName, VariantConfig> = {
  'about-main':    { dir: 'about-main',    width: 2200, height: 2200, quality: 90, version: 'v3' },
  'hero-cover':    { dir: 'hero-cover',    width: 1800, height: 1800, quality: 88, version: 'v3' },
  'album-preview': { dir: 'album-preview', width: 1600, height: 1600, quality: 86, version: 'v3' },
  'project-card':  { dir: 'project-card',  width: 1800, height: 1800, quality: 90, version: 'v3' },
}

function cleanSrc(src: string): string {
  return src.split('?')[0]
}

function variantWebPath(src: string, variant: VariantName): string {
  const cleaned = cleanSrc(src).replace(/^\/+/, '').replace(/^media\//, '').replace(/^photos\//, '')
  const parsed = path.parse(cleaned)
  const config = VARIANTS[variant]
  return toMediaUrl(path.posix.join('derived', config.dir, config.version, parsed.dir, `${parsed.name}.webp`))
}

export async function ensureImageVariant(src: string, variant: VariantName): Promise<string> {
  const webPath = variantWebPath(src, variant)
  const [sourceFile, targetFile] = await Promise.all([
    getPhotoFilePath(src),
    getPhotoFilePath(webPath),
  ])

  if (!(await isPhotoNewer(src, webPath))) {
    return webPath
  }

  await mkdir(path.dirname(targetFile), { recursive: true })

  const config = VARIANTS[variant]
  await sharp(sourceFile)
    .rotate()
    .resize({
      width: config.width,
      height: config.height,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: config.quality })
    .toFile(targetFile)

  return webPath
}
