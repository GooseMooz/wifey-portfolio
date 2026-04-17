import { readdir } from 'fs/promises'
import path from 'path'
import { ensureImageVariant } from '@/lib/imageVariants'
import { cropToObjectPosition, getSitePhotoMeta, mediaKey } from '@/lib/photoMeta'
import { ensurePhotosDir, toMediaUrl } from '@/lib/photoStorage'
import ProjectsClient from './ProjectsClient'

const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i

type ProjectPhoto = {
  src: string
  originalSrc: string
  objectPosition: string
  objectScale: number
}

async function getProjectPhotos(): Promise<ProjectPhoto[]> {
  try {
    const dir = await ensurePhotosDir('projects')
    const [files, siteMeta] = await Promise.all([
      readdir(dir),
      getSitePhotoMeta(),
    ])
    return Promise.all(
      files
        .filter(f => IMAGE_EXT.test(f))
        .sort()
        .map(async (f) => {
          const originalSrc = toMediaUrl(path.posix.join('projects', f))
          return {
            src: await ensureImageVariant(originalSrc, 'project-card'),
            originalSrc,
            objectPosition: cropToObjectPosition(siteMeta.projectCrops?.[mediaKey(originalSrc)]),
            objectScale: siteMeta.projectCrops?.[mediaKey(originalSrc)]?.scale ?? 1,
          }
        })
    )
  } catch {
    return []
  }
}

export default async function Projects() {
  const photos = await getProjectPhotos()

  return (
    <section id="projects" className="projects">
      <div className="projects-header fade-in">
        <h2>My Favorites</h2>
      </div>
      <ProjectsClient initialPhotos={photos} />
    </section>
  )
}
