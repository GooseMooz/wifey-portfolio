import { readdir } from 'fs/promises'
import path from 'path'
import ProjectsClient from './ProjectsClient'

const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i

async function getProjectPhotos(): Promise<string[]> {
  try {
    const dir = path.join(process.cwd(), 'public/photos/projects')
    const files = await readdir(dir)
    return files
      .filter(f => IMAGE_EXT.test(f))
      .sort()
      .map(f => `/photos/projects/${f}`)
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
