import { readdir } from 'fs/promises'
import path from 'path'
import { ensureImageVariant } from '@/lib/imageVariants'
import { ensurePhotosDir, toMediaUrl } from '@/lib/photoStorage'
import ProjectsClient from './ProjectsClient'

const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i

async function getProjectPhotos(): Promise<string[]> {
  try {
    const dir = await ensurePhotosDir('projects')
    const files = await readdir(dir)
    return Promise.all(
      files
        .filter(f => IMAGE_EXT.test(f))
        .sort()
        .map(f => ensureImageVariant(toMediaUrl(path.posix.join('projects', f)), 'project-card'))
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
