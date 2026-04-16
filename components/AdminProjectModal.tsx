'use client'

import { useState, useRef } from 'react'
import LoadableImage from './LoadableImage'

type ProjectPhoto = {
  src: string
  originalSrc: string
  objectPosition: string
}

interface Props {
  photo: ProjectPhoto
  description: string
  onClose: () => void
  onReplace: (nextPhoto: ProjectPhoto) => void
}

function parseObjectPosition(value: string) {
  const [x = '50%', y = '50%'] = value.split(' ')
  return {
    x: Number.parseFloat(x) || 50,
    y: Number.parseFloat(y) || 50,
  }
}

export default function AdminProjectModal({ photo, description, onClose, onReplace }: Props) {
  const [uploading,    setUploading]    = useState(false)
  const [justReplaced, setJustReplaced] = useState(false)
  const [crop, setCrop] = useState(() => parseObjectPosition(photo.objectPosition))
  const inputRef = useRef<HTMLInputElement>(null)

  const saveCrop = async (nextCrop = crop, nextOriginalSrc = photo.originalSrc) => {
    await fetch('/api/admin/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'project-crop',
        src: nextOriginalSrc,
        crop: nextCrop,
      }),
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'project')
    fd.append('oldPath', photo.originalSrc)

    setUploading(true)
    try {
      const res  = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.newPath) {
        const timestampedSrc = `${data.newPath}?v=${Date.now()}`
        await saveCrop(crop, data.newPath)
        onReplace({
          src: timestampedSrc,
          originalSrc: data.newPath,
          objectPosition: `${crop.x}% ${crop.y}%`,
        })
        setUploading(false)
        setJustReplaced(true)
        setTimeout(() => setJustReplaced(false), 700)
      }
    } catch {
      setUploading(false)
    }
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-single" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <span className="admin-modal-title">{description}</span>
          <button className="admin-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <button
          className={[
            'admin-photo-item',
            'admin-photo-preview',
            uploading    ? 'is-uploading'  : '',
            justReplaced ? 'just-replaced' : '',
          ].join(' ')}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Replace photo"
        >
          <LoadableImage
            src={photo.src}
            alt=""
            fill
            sizes="(max-width: 600px) 90vw, 480px"
            style={{ objectFit: 'cover', objectPosition: `${crop.x}% ${crop.y}%` }}
          />
          <div className="admin-photo-overlay">
            {uploading
              ? <div className="admin-spinner" />
              : justReplaced
                ? '✓'
                : 'click to replace'
            }
          </div>
        </button>

        <div className="admin-crop-controls">
          <label className="admin-crop-field">
            <span>horizontal crop</span>
            <input
              type="range"
              min="0"
              max="100"
              value={crop.x}
              onChange={e => setCrop(prev => ({ ...prev, x: Number(e.target.value) }))}
            />
          </label>
          <label className="admin-crop-field">
            <span>vertical crop</span>
            <input
              type="range"
              min="0"
              max="100"
              value={crop.y}
              onChange={e => setCrop(prev => ({ ...prev, y: Number(e.target.value) }))}
            />
          </label>
          <button
            className="admin-save-btn"
            onClick={async () => {
              await saveCrop()
              onReplace({
                ...photo,
                objectPosition: `${crop.x}% ${crop.y}%`,
              })
            }}
            type="button"
          >
            save crop
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
