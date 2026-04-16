'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import type { AlbumData } from '@/lib/albums'

interface Props {
  album: AlbumData
  onClose: () => void
}

type UploadTarget =
  | { kind: 'cover' }
  | { kind: 'photo'; src: string }

export default function AdminAlbumModal({ album, onClose }: Props) {
  const [cover,        setCover]        = useState(album.cover)
  const [photos,       setPhotos]       = useState(() => album.photos.map(p => p.src))
  // key of the slot currently showing the spinner
  const [uploading,    setUploading]    = useState<string | null>(null)
  // key of the slot showing the success-flash animation
  const [justReplaced, setJustReplaced] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const pending  = useRef<UploadTarget | null>(null)

  const triggerUpload = (target: UploadTarget) => {
    pending.current = target
    inputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file   = e.target.files?.[0]
    const target = pending.current
    if (!file || !target) return
    e.target.value = ''

    const fd = new FormData()
    fd.append('file', file)

    let uploadingKey: string
    if (target.kind === 'cover') {
      fd.append('type', 'hero')
      fd.append('oldPath', cover)
      uploadingKey = 'cover'
    } else {
      fd.append('type', 'album')
      fd.append('slug', album.slug)
      fd.append('oldPath', target.src)
      uploadingKey = target.src
    }

    setUploading(uploadingKey)

    try {
      const res  = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()

      if (data.newPath) {
        const newSrc = `${data.newPath}?v=${Date.now()}`

        if (target.kind === 'cover') {
          setCover(newSrc)
          // spinner stays on 'cover' key — keep it visible briefly while new image loads
          setTimeout(() => {
            setUploading(null)
            setJustReplaced('cover')
            setTimeout(() => setJustReplaced(null), 750)
          }, 380)
        } else {
          // Update src in array, then move spinner from old key → new key
          setPhotos(prev => prev.map(p => p === target.src ? newSrc : p))
          setUploading(newSrc)
          setTimeout(() => {
            setUploading(null)
            setJustReplaced(newSrc)
            setTimeout(() => setJustReplaced(null), 750)
          }, 380)
        }
      }
    } catch {
      setUploading(null)
    } finally {
      pending.current = null
    }
  }

  const photoButton = (
    key: string,
    src: string,
    label: string | undefined,
    onClick: () => void,
  ) => {
    const isUploading    = uploading    === key
    const isJustReplaced = justReplaced === key
    return (
      <div key={key} className="admin-photo-item-wrap">
        <button
          className={[
            'admin-photo-item',
            isUploading    ? 'is-uploading'   : '',
            isJustReplaced ? 'just-replaced'  : '',
          ].join(' ')}
          onClick={onClick}
          disabled={uploading !== null}
          aria-label={label ? `Replace ${label}` : 'Replace photo'}
        >
          <Image
            src={src}
            alt={label ?? ''}
            fill
            sizes="(max-width: 600px) 45vw, 200px"
            style={{ objectFit: 'cover' }}
          />
          <div className="admin-photo-overlay">
            {isUploading ? <div className="admin-spinner" /> : 'replace'}
          </div>
        </button>
        {label && <span className="admin-photo-label">{label}</span>}
      </div>
    )
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <span className="admin-modal-title">{album.label} — {album.sub}</span>
          <button className="admin-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="admin-photo-grid">
          {photoButton('cover', cover, 'cover', () => triggerUpload({ kind: 'cover' }))}

          {photos.map(src =>
            photoButton(src, src, undefined, () => triggerUpload({ kind: 'photo', src }))
          )}

          {photos.length === 0 && (
            <p className="admin-empty" style={{ gridColumn: '1 / -1' }}>
              No album photos yet.
            </p>
          )}
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
