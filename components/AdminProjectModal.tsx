'use client'

import { useState, useRef } from 'react'
import LoadableImage from './LoadableImage'

interface Props {
  src: string
  description: string
  onClose: () => void
  onReplace: (newSrc: string) => void
}

export default function AdminProjectModal({ src, description, onClose, onReplace }: Props) {
  const [uploading,    setUploading]    = useState(false)
  const [justReplaced, setJustReplaced] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'project')
    fd.append('oldPath', src)

    setUploading(true)
    try {
      const res  = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.newPath) {
        const newSrc = `${data.newPath}?v=${Date.now()}`
        onReplace(newSrc)
        // Brief success flash before the modal unmounts
        setUploading(false)
        setJustReplaced(true)
        setTimeout(onClose, 550)
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
            src={src}
            alt=""
            fill
            sizes="(max-width: 600px) 90vw, 480px"
            style={{ objectFit: 'cover' }}
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
