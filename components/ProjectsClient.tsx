'use client'

import { useState } from 'react'
import { cropImageStyle } from '@/lib/cropStyle'
import { useAdmin } from '@/contexts/AdminContext'
import AdminProjectModal from './AdminProjectModal'
import LoadableImage from './LoadableImage'

const DESCRIPTIONS = ['Personal Shoot', 'Dope Bakehouse', 'IT Girls']

type ProjectPhoto = {
  src: string
  originalSrc: string
  objectPosition: string
  objectScale: number
}

interface Props {
  initialPhotos: ProjectPhoto[]
}

export default function ProjectsClient({ initialPhotos }: Props) {
  const { isAdmin } = useAdmin()
  const [photos, setPhotos] = useState(initialPhotos)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)

  return (
    <>
      <div className="projects-grid">
        {photos.map((photo, i) => (
          <div
            key={photo.src}
            className={`project-card fade-in${isAdmin ? ' admin-editable' : ''}`}
            role={isAdmin ? 'button' : undefined}
            tabIndex={isAdmin ? 0 : undefined}
            onClick={isAdmin ? () => setEditingIdx(i) : undefined}
            onKeyDown={isAdmin ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditingIdx(i) }
            } : undefined}
          >
            <div className="project-card-img">
              <LoadableImage
                src={photo.src}
                alt={DESCRIPTIONS[i] ?? `Favorite photo ${i + 1}`}
                fill
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                priority
                style={cropImageStyle(photo.objectPosition, photo.objectScale)}
              />
              <div className="project-overlay">
                <span className="project-overlay-name">
                  {isAdmin ? '✎ replace' : (DESCRIPTIONS[i] ?? '')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAdmin && editingIdx !== null && (
        <AdminProjectModal
          photo={photos[editingIdx]}
          description={DESCRIPTIONS[editingIdx] ?? `Photo ${editingIdx + 1}`}
          onClose={() => setEditingIdx(null)}
          onReplace={(nextPhoto) => {
            setPhotos(prev => prev.map((photo, j) => j === editingIdx ? nextPhoto : photo))
          }}
        />
      )}
    </>
  )
}
