import { readdir } from 'fs/promises'
import path from 'path'
import Image from 'next/image'

const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i

const DESCRIPTIONS = ['Personal Shoot', 'Dope Bakehouse', 'IT Girls']

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

      <div className="projects-grid">
        {photos.map((src, i) => (
          <a key={src} href="#" className="project-card fade-in">
            <div className="project-card-img">
              <Image
                src={src}
                alt={DESCRIPTIONS[i] ?? `Favorite photo ${i + 1}`}
                fill
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
              />
              <div className="project-overlay">
                <span className="project-overlay-name">{DESCRIPTIONS[i]}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
