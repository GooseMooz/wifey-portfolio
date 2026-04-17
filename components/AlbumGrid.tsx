'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PhotoInfo } from '@/lib/albums'
import { cropImageStyle } from '@/lib/cropStyle'
import LoadableImage from './LoadableImage'

type Props = {
  photos: PhotoInfo[]
  albumLabel: string
}

export default function AlbumGrid({ photos, albumLabel }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  const close = useCallback(() => setLightbox(null), [])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightbox, close])

  return (
    <>
      <div className="bento-grid">
        {photos.map(({ src, cellClass, objectPosition, objectScale }, i) => (
          <div
            key={src}
            className={`bento-item${cellClass ? ` ${cellClass}` : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`View ${albumLabel} photo ${i + 1}`}
            onClick={() => setLightbox(src)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setLightbox(src) }}
          >
            <LoadableImage
              src={src}
              alt={`${albumLabel} — photo ${i + 1}`}
              fill
              sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
              style={cropImageStyle(objectPosition, objectScale)}
            />
          </div>
        ))}
      </div>

      {lightbox && (
        <div
          className="lightbox-backdrop"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer — click or press Escape to close"
        >
          <button className="lightbox-close" onClick={close} aria-label="Close">✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt={albumLabel}
            className="lightbox-img"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
