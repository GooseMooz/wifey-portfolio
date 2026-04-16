'use client'

import { useMemo, useRef, useState } from 'react'
import type { AlbumData } from '@/lib/albums'
import LoadableImage from './LoadableImage'

type EditablePhoto = {
  src: string
  objectPosition: string
}

type SelectedTarget =
  | { kind: 'cover' }
  | { kind: 'photo'; src: string }
  | { kind: 'new-photo' }

interface Props {
  album: AlbumData
  onClose: () => void
}

function parseObjectPosition(value: string) {
  const [x = '50%', y = '50%'] = value.split(' ')
  return {
    x: Number.parseFloat(x) || 50,
    y: Number.parseFloat(y) || 50,
  }
}

export default function AdminAlbumModal({ album, onClose }: Props) {
  const [cover, setCover] = useState(album.cover)
  const [coverPosition, setCoverPosition] = useState(() => parseObjectPosition(album.coverPosition))
  const [photos, setPhotos] = useState<EditablePhoto[]>(() => album.photos.map(photo => ({
    src: photo.src,
    objectPosition: photo.objectPosition,
  })))
  const [selected, setSelected] = useState<SelectedTarget>({ kind: 'cover' })
  const [uploading, setUploading] = useState<string | null>(null)
  const [justReplaced, setJustReplaced] = useState<string | null>(null)
  const [draggingSrc, setDraggingSrc] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const pending = useRef<SelectedTarget | null>(null)

  const selectedPhoto = selected.kind === 'photo'
    ? photos.find(photo => photo.src === selected.src) ?? null
    : null

  const selectedCrop = useMemo(() => {
    if (selected.kind === 'cover') return coverPosition
    if (selected.kind === 'photo' && selectedPhoto) return parseObjectPosition(selectedPhoto.objectPosition)
    return { x: 50, y: 50 }
  }, [coverPosition, selected, selectedPhoto])

  const [crop, setCrop] = useState(selectedCrop)

  const syncCropFromSelection = (target: SelectedTarget) => {
    if (target.kind === 'cover') {
      setCrop(coverPosition)
      return
    }
    if (target.kind === 'photo') {
      const photo = photos.find(item => item.src === target.src)
      setCrop(parseObjectPosition(photo?.objectPosition ?? '50% 50%'))
      return
    }
    setCrop({ x: 50, y: 50 })
  }

  const selectTarget = (target: SelectedTarget) => {
    setSelected(target)
    syncCropFromSelection(target)
  }

  const saveCrop = async () => {
    if (selected.kind === 'new-photo') return

    const body = selected.kind === 'cover'
      ? { kind: 'hero-crop', slug: album.slug, crop }
      : { kind: 'album-photo-crop', slug: album.slug, src: selected.src, crop }

    await fetch('/api/admin/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (selected.kind === 'cover') {
      setCoverPosition(crop)
    } else {
      setPhotos(current => current.map(photo =>
        photo.src === selected.src
          ? { ...photo, objectPosition: `${crop.x}% ${crop.y}%` }
          : photo
      ))
    }
  }

  const triggerUpload = (target: SelectedTarget) => {
    pending.current = target
    inputRef.current?.click()
  }

  const saveOrder = async (nextPhotos: EditablePhoto[]) => {
    await fetch('/api/admin/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'album-order',
        slug: album.slug,
        orderedSrcs: nextPhotos.map(photo => photo.src),
      }),
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const target = pending.current
    if (!file || !target) return
    e.target.value = ''

    const fd = new FormData()
    fd.append('file', file)

    let uploadingKey = 'new-photo'
    if (target.kind === 'cover') {
      fd.append('type', 'hero')
      fd.append('oldPath', cover)
      uploadingKey = 'cover'
    } else {
      fd.append('type', 'album')
      fd.append('slug', album.slug)
      if (target.kind === 'photo') {
        fd.append('oldPath', target.src)
        uploadingKey = target.src
      }
    }

    setUploading(uploadingKey)

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.newPath) return

      const timestampedSrc = `${data.newPath}?v=${Date.now()}`

      if (target.kind === 'cover') {
        await fetch('/api/admin/meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'hero-crop', slug: album.slug, crop }),
        })
        setCover(timestampedSrc)
        setJustReplaced('cover')
      } else if (target.kind === 'photo') {
        await fetch('/api/admin/meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'album-photo-crop', slug: album.slug, src: data.newPath, crop }),
        })
        setPhotos(current => current.map(photo =>
          photo.src === target.src
            ? { src: timestampedSrc, objectPosition: `${crop.x}% ${crop.y}%` }
            : photo
        ))
        setSelected({ kind: 'photo', src: timestampedSrc })
        setJustReplaced(timestampedSrc)
      } else {
        await fetch('/api/admin/meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'album-photo-crop', slug: album.slug, src: data.newPath, crop }),
        })
        const nextPhotos = [...photos, { src: timestampedSrc, objectPosition: `${crop.x}% ${crop.y}%` }]
        setPhotos(nextPhotos)
        setSelected({ kind: 'photo', src: timestampedSrc })
        setJustReplaced(timestampedSrc)
      }

      setTimeout(() => setJustReplaced(null), 700)
    } finally {
      setUploading(null)
      pending.current = null
    }
  }

  const movePhoto = async (fromSrc: string, toSrc: string) => {
    if (fromSrc === toSrc) return
    const nextPhotos = [...photos]
    const fromIndex = nextPhotos.findIndex(photo => photo.src === fromSrc)
    const toIndex = nextPhotos.findIndex(photo => photo.src === toSrc)
    if (fromIndex === -1 || toIndex === -1) return
    const [moved] = nextPhotos.splice(fromIndex, 1)
    nextPhotos.splice(toIndex, 0, moved)
    setPhotos(nextPhotos)
    await saveOrder(nextPhotos)
  }

  const renderThumb = (photo: EditablePhoto, label?: string) => {
    const key = label === 'cover' ? 'cover' : photo.src
    const isUploading = uploading === key
    const isJustReplaced = justReplaced === key
    const isSelected = selected.kind === 'cover'
      ? label === 'cover'
      : selected.kind === 'photo' && selected.src === photo.src

    return (
      <div
        key={key}
        className={`admin-photo-item-wrap${isSelected ? ' is-selected' : ''}`}
        draggable={!label}
        onDragStart={!label ? () => setDraggingSrc(photo.src) : undefined}
        onDragOver={!label ? (e => e.preventDefault()) : undefined}
        onDrop={!label ? async (e) => {
          e.preventDefault()
          if (draggingSrc) await movePhoto(draggingSrc, photo.src)
          setDraggingSrc(null)
        } : undefined}
        onDragEnd={!label ? () => setDraggingSrc(null) : undefined}
      >
        <button
          className={[
            'admin-photo-item',
            isUploading ? 'is-uploading' : '',
            isJustReplaced ? 'just-replaced' : '',
          ].join(' ')}
          onClick={() => selectTarget(label ? { kind: 'cover' } : { kind: 'photo', src: photo.src })}
          disabled={uploading !== null}
          aria-label={label ? `Edit ${label}` : 'Edit photo'}
          type="button"
        >
          <LoadableImage
            src={photo.src}
            alt={label ?? ''}
            fill
            sizes="(max-width: 600px) 45vw, 200px"
            style={{ objectFit: 'cover', objectPosition: photo.objectPosition }}
          />
          <div className="admin-photo-overlay">
            {isUploading ? <div className="admin-spinner" /> : label ? 'edit cover' : 'edit photo'}
          </div>
        </button>
        {label && <span className="admin-photo-label">{label}</span>}
      </div>
    )
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal admin-album-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <span className="admin-modal-title">{album.label} — {album.sub}</span>
          <button className="admin-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="admin-album-layout">
          <div className="admin-photo-grid">
            {renderThumb({ src: cover, objectPosition: `${coverPosition.x}% ${coverPosition.y}%` }, 'cover')}
            {photos.map(photo => renderThumb(photo))}

            <div className="admin-photo-item-wrap">
              <button
                className="admin-photo-item admin-add-photo"
                onClick={() => selectTarget({ kind: 'new-photo' })}
                type="button"
              >
                <span className="admin-add-photo-plus">+</span>
              </button>
            </div>
          </div>

          <div className="admin-editor-panel">
            <div className="admin-editor-preview">
              {selected.kind === 'cover' && (
                <LoadableImage
                  src={cover}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 90vw, 440px"
                  style={{ objectFit: 'cover', objectPosition: `${crop.x}% ${crop.y}%` }}
                />
              )}
              {selected.kind === 'photo' && selectedPhoto && (
                <LoadableImage
                  src={selectedPhoto.src}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 90vw, 440px"
                  style={{ objectFit: 'cover', objectPosition: `${crop.x}% ${crop.y}%` }}
                />
              )}
              {selected.kind === 'new-photo' && (
                <div className="admin-new-photo-placeholder">new album photo</div>
              )}
            </div>

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

              <div className="admin-action-row">
                {selected.kind !== 'new-photo' && (
                  <>
                    <button className="admin-save-btn" onClick={saveCrop} type="button">save crop</button>
                    <button className="admin-save-btn" onClick={() => triggerUpload(selected)} type="button">replace image</button>
                  </>
                )}
                {selected.kind === 'new-photo' && (
                  <button className="admin-save-btn" onClick={() => triggerUpload(selected)} type="button">upload new photo</button>
                )}
              </div>
              <p className="admin-help-text">Drag the album thumbnails to reorder them.</p>
            </div>
          </div>
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
