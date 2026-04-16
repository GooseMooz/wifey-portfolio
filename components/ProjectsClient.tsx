'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAdmin } from '@/contexts/AdminContext'
import AdminProjectModal from './AdminProjectModal'

const DESCRIPTIONS = ['Personal Shoot', 'Dope Bakehouse', 'IT Girls']

interface Props {
  initialPhotos: string[]
}

export default function ProjectsClient({ initialPhotos }: Props) {
  const { isAdmin } = useAdmin()
  const [photos, setPhotos] = useState(initialPhotos)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)

  return (
    <>
      <div className="projects-grid">
        {photos.map((src, i) => (
          <div
            key={src}
            className={`project-card fade-in${isAdmin ? ' admin-editable' : ''}`}
            role={isAdmin ? 'button' : undefined}
            tabIndex={isAdmin ? 0 : undefined}
            onClick={isAdmin ? () => setEditingIdx(i) : undefined}
            onKeyDown={isAdmin ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditingIdx(i) }
            } : undefined}
          >
            <div className="project-card-img">
              <Image
                src={src}
                alt={DESCRIPTIONS[i] ?? `Favorite photo ${i + 1}`}
                fill
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
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
          src={photos[editingIdx]}
          description={DESCRIPTIONS[editingIdx] ?? `Photo ${editingIdx + 1}`}
          onClose={() => setEditingIdx(null)}
          onReplace={(newSrc) => {
            setPhotos(prev => prev.map((p, j) => j === editingIdx ? newSrc : p))
            setEditingIdx(null)
          }}
        />
      )}
    </>
  )
}
