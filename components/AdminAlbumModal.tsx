'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { AlbumData } from '@/lib/albums'
import { cropImageStyle } from '@/lib/cropStyle'
import LoadableImage from './LoadableImage'

type EditablePhoto = {
  src: string
  previewSrc: string
  cellClass: '' | 'bento-portrait' | 'bento-landscape'
  objectPosition: string
  objectScale: number
}

type CropState = {
  x: number
  y: number
  scale: number
}

type SelectedTarget =
  | { kind: 'cover' }
  | { kind: 'photo'; src: string }
  | { kind: 'new-photo' }

interface Props {
  album: AlbumData
  onClose: () => void
  previewMode?: 'album' | 'hero'
  onAlbumChange?: (nextAlbum: AlbumData) => void
}

function parseCrop(photo: { objectPosition: string, objectScale: number }): CropState {
  const [x = '50%', y = '50%'] = photo.objectPosition.split(' ')
  return {
    x: Number.parseFloat(x) || 50,
    y: Number.parseFloat(y) || 50,
    scale: photo.objectScale || 1,
  }
}

function reorderPhotos(items: EditablePhoto[], fromSrc: string, toSrc: string) {
  if (fromSrc === toSrc) return items
  const next = [...items]
  const fromIndex = next.findIndex(photo => photo.src === fromSrc)
  const toIndex = next.findIndex(photo => photo.src === toSrc)
  if (fromIndex === -1 || toIndex === -1) return items
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

export default function AdminAlbumModal({ album, onClose, previewMode = 'album', onAlbumChange }: Props) {
  const [cover, setCover] = useState(album.cover)
  const [coverPreview, setCoverPreview] = useState(album.coverPreview)
  const [coverCrop, setCoverCrop] = useState<CropState>(() => parseCrop({
    objectPosition: album.coverPosition,
    objectScale: album.coverScale,
  }))
  const [photos, setPhotos] = useState<EditablePhoto[]>(() => album.photos.map(photo => ({
    src: photo.src,
    previewSrc: photo.previewSrc,
    cellClass: photo.cellClass,
    objectPosition: photo.objectPosition,
    objectScale: photo.objectScale,
  })))
  const [label, setLabel] = useState(album.label)
  const [sub, setSub] = useState(album.sub)
  const [selected, setSelected] = useState<SelectedTarget>({ kind: 'cover' })
  const [crop, setCrop] = useState<CropState>(() => parseCrop({
    objectPosition: album.coverPosition,
    objectScale: album.coverScale,
  }))
  const [uploading, setUploading] = useState<string | null>(null)
  const [justReplaced, setJustReplaced] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // Drag-to-reorder state
  const [draggingSrc, setDraggingSrc] = useState<string | null>(null)
  const [dragOverSrc, setDragOverSrc] = useState<string | null>(null)
  // Crop drag state
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)
  const cropDragRef = useRef<{
    startX: number; startY: number
    startCropX: number; startCropY: number
    rectW: number; rectH: number
  } | null>(null)
  const cropFrameRef = useRef<HTMLDivElement>(null)

  const [isDirty, setIsDirty] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const pending = useRef<SelectedTarget | null>(null)
  const coverRef = useRef(cover)
  const coverPreviewRef = useRef(coverPreview)
  const coverCropRef = useRef(coverCrop)
  const photosRef = useRef(photos)
  const labelRef = useRef(label)
  const subRef = useRef(sub)

  useEffect(() => { coverRef.current = cover }, [cover])
  useEffect(() => { coverPreviewRef.current = coverPreview }, [coverPreview])
  useEffect(() => { coverCropRef.current = coverCrop }, [coverCrop])
  useEffect(() => { photosRef.current = photos }, [photos])
  useEffect(() => { labelRef.current = label }, [label])
  useEffect(() => { subRef.current = sub }, [sub])

  const selectedPhoto = selected.kind === 'photo'
    ? photos.find(photo => photo.src === selected.src) ?? null
    : null

  useEffect(() => {
    if (selected.kind === 'cover') {
      setCrop(coverCrop)
      return
    }
    if (selected.kind === 'photo' && selectedPhoto) {
      setCrop(parseCrop(selectedPhoto))
      return
    }
    setCrop({ x: 50, y: 50, scale: 1 })
  }, [selected, selectedPhoto, coverCrop])

  // Reset confirm-delete state when selection changes
  useEffect(() => {
    setConfirmDelete(false)
  }, [selected])

  const selectTarget = (target: SelectedTarget) => {
    setSelected(target)
  }

  const emitAlbumChange = (
    nextCover = coverRef.current,
    nextCoverPreview = coverPreviewRef.current,
    nextCoverCrop = coverCropRef.current,
    nextPhotos = photosRef.current,
    nextLabel = labelRef.current,
    nextSub = subRef.current,
  ) => {
    onAlbumChange?.({
      ...album,
      label: nextLabel,
      sub: nextSub,
      cover: nextCover,
      coverPreview: nextCoverPreview,
      coverPosition: `${nextCoverCrop.x}% ${nextCoverCrop.y}%`,
      coverScale: nextCoverCrop.scale,
      previews: nextPhotos.slice(0, 4).map(photo => photo.previewSrc),
      photos: nextPhotos,
    })
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
      setCoverCrop(crop)
      coverCropRef.current = crop
    } else {
      const nextPhotos = photosRef.current.map(photo =>
        photo.src === selected.src
          ? { ...photo, objectPosition: `${crop.x}% ${crop.y}%`, objectScale: crop.scale }
          : photo
      )
      setPhotos(nextPhotos)
      photosRef.current = nextPhotos
    }
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

  const saveLabelMeta = async () => {
    await fetch('/api/admin/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'album-label', slug: album.slug, label: labelRef.current, sub: subRef.current }),
    })
  }

  const handleSaveAll = async () => {
    setSaveState('saving')
    await Promise.all([saveCrop(), saveOrder(photosRef.current), saveLabelMeta()])
    emitAlbumChange()
    setIsDirty(false)
    setSaveState('saved')
  }

  const handleDeletePhoto = async () => {
    if (selected.kind !== 'photo') return
    setDeleting(true)
    try {
      await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'album-photo', slug: album.slug, src: selected.src }),
      })
      const nextPhotos = photosRef.current.filter(p => p.src !== selected.src)
      setPhotos(nextPhotos)
      photosRef.current = nextPhotos
      setSelected({ kind: 'cover' })
      setConfirmDelete(false)
      emitAlbumChange(coverRef.current, coverPreviewRef.current, coverCropRef.current, nextPhotos)
    } finally {
      setDeleting(false)
    }
  }

  // ── Crop drag handlers (delta-based, correct pan direction) ─────────────
  const handleCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (selected.kind === 'new-photo') return
    const rect = cropFrameRef.current?.getBoundingClientRect() ?? e.currentTarget.getBoundingClientRect()
    cropDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startCropX: crop.x,
      startCropY: crop.y,
      rectW: rect.width,
      rectH: rect.height,
    }
    setIsDraggingCrop(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingCrop || !cropDragRef.current) return
    const { startX, startY, startCropX, startCropY, rectW, rectH } = cropDragRef.current
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    const newX = Math.max(0, Math.min(100, startCropX - (dx / rectW) * 100))
    const newY = Math.max(0, Math.min(100, startCropY - (dy / rectH) * 100))
    setCrop(prev => ({ ...prev, x: newX, y: newY }))
    setIsDirty(true)
    setSaveState('idle')
  }

  const handleCropPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingCrop(false)
    cropDragRef.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // ── Thumb drag-to-reorder (pointer events, floating ghost) ─────────────
  const startThumbDrag = (
    photo: EditablePhoto,
    startX: number,
    startY: number,
    _pointerOffsetX: number,
    _pointerOffsetY: number
  ) => {
    const src = photo.src
    setDraggingSrc(src)

    const handleMove = (e: PointerEvent) => {
      const els = document.elementsFromPoint(e.clientX, e.clientY)
      const thumbEl = els.find(el =>
        (el as HTMLElement).dataset?.dragSrc &&
        (el as HTMLElement).dataset?.dragSrc !== src
      ) as HTMLElement | undefined
      const overSrc = thumbEl?.dataset?.dragSrc

      if (overSrc) {
        setDragOverSrc(overSrc)
        setPhotos(prev => {
          const next = reorderPhotos(prev, src, overSrc)
          photosRef.current = next
          return next
        })
        setIsDirty(true)
        setSaveState('idle')
      }
    }

    const handleUp = () => {
      setDraggingSrc(null)
      setDragOverSrc(null)
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const triggerUpload = (target: SelectedTarget) => {
    pending.current = target
    inputRef.current?.click()
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
        coverRef.current = timestampedSrc
        setCoverPreview(timestampedSrc)
        coverPreviewRef.current = timestampedSrc
        setCoverCrop(crop)
        coverCropRef.current = crop
        setJustReplaced('cover')
        setIsDirty(false)
        emitAlbumChange(timestampedSrc, timestampedSrc, crop, photosRef.current)
      } else if (target.kind === 'photo') {
        await fetch('/api/admin/meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'album-photo-crop', slug: album.slug, src: data.newPath, crop }),
        })
        const nextPhotos = photosRef.current.map(photo =>
          photo.src === target.src
            ? { ...photo, src: timestampedSrc, previewSrc: timestampedSrc, objectPosition: `${crop.x}% ${crop.y}%`, objectScale: crop.scale }
            : photo
        )
        setPhotos(nextPhotos)
        photosRef.current = nextPhotos
        setSelected({ kind: 'photo', src: timestampedSrc })
        setJustReplaced(timestampedSrc)
        setIsDirty(false)
        emitAlbumChange(coverRef.current, coverPreviewRef.current, coverCropRef.current, nextPhotos)
      } else {
        await fetch('/api/admin/meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'album-photo-crop', slug: album.slug, src: data.newPath, crop }),
        })
        const nextPhotos: EditablePhoto[] = [
          ...photosRef.current,
          { src: timestampedSrc, previewSrc: timestampedSrc, cellClass: '', objectPosition: `${crop.x}% ${crop.y}%`, objectScale: crop.scale },
        ]
        setPhotos(nextPhotos)
        photosRef.current = nextPhotos
        setSelected({ kind: 'photo', src: timestampedSrc })
        setJustReplaced(timestampedSrc)
        setIsDirty(true)
        emitAlbumChange(coverRef.current, coverPreviewRef.current, coverCropRef.current, nextPhotos)
      }

      setTimeout(() => setJustReplaced(null), 700)
    } finally {
      setUploading(null)
      pending.current = null
    }
  }

  const renderThumb = (photo: EditablePhoto, label?: string) => {
    const key = label === 'cover' ? 'cover' : photo.src
    const isUploading = uploading === key
    const isJustReplaced = justReplaced === key
    const isSelected = selected.kind === 'cover'
      ? label === 'cover'
      : selected.kind === 'photo' && selected.src === photo.src
    const isDragging = draggingSrc === photo.src
    const isDropTarget = dragOverSrc === photo.src && draggingSrc !== photo.src

    return (
      <div
        key={key}
        data-drag-src={!label ? photo.src : undefined}
        className={`admin-photo-item-wrap${isSelected ? ' is-selected' : ''}${isDragging ? ' is-dragging' : ''}${isDropTarget ? ' is-drop-target' : ''}`}
        onPointerDown={!label ? (e) => {
          if (e.button !== 0) return
          const startX = e.clientX
          const startY = e.clientY
          const rect = e.currentTarget.getBoundingClientRect()
          const pointerOffsetX = startX - rect.left
          const pointerOffsetY = startY - rect.top

          const onMoveCheck = (me: PointerEvent) => {
            if (Math.hypot(me.clientX - startX, me.clientY - startY) > 6) {
              window.removeEventListener('pointermove', onMoveCheck)
              window.removeEventListener('pointerup', onUpCancel)
              startThumbDrag(photo, startX, startY, pointerOffsetX, pointerOffsetY)
            }
          }
          const onUpCancel = () => {
            window.removeEventListener('pointermove', onMoveCheck)
            window.removeEventListener('pointerup', onUpCancel)
          }
          window.addEventListener('pointermove', onMoveCheck)
          window.addEventListener('pointerup', onUpCancel)
        } : undefined}
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
            src={photo.previewSrc}
            alt={label ?? ''}
            fill
            sizes="(max-width: 600px) 45vw, 200px"
            style={cropImageStyle(photo.objectPosition, photo.objectScale)}
          />
          <div className="admin-photo-overlay">
            {isUploading ? <div className="admin-spinner" /> : label ? 'edit cover' : 'edit photo'}
          </div>
        </button>
        {label && <span className="admin-photo-label">{label}</span>}
      </div>
    )
  }

  const selectedPhotoIndex = selected.kind === 'photo'
    ? photos.findIndex(photo => photo.src === selected.src)
    : -1

  const previewAspectClass = selected.kind === 'cover'
    ? previewMode === 'hero'
      ? 'is-hero-cover'
      : 'is-cover'
    : selected.kind === 'photo' && selectedPhoto
      ? previewMode === 'hero' && selectedPhotoIndex >= 0 && selectedPhotoIndex < 4
        ? 'is-square'
        : selectedPhoto.cellClass === 'bento-portrait'
          ? 'is-portrait'
          : selectedPhoto.cellClass === 'bento-landscape'
            ? 'is-landscape'
            : 'is-square'
      : 'is-square'

  const imageSrc = selected.kind === 'cover'
    ? coverPreview
    : selected.kind === 'photo' && selectedPhoto
      ? selectedPhoto.previewSrc
      : null

  const saveLabel = saveState === 'saving' ? 'saving…' : saveState === 'saved' && !isDirty ? 'saved ✓' : 'save changes'

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal admin-album-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="admin-label-edit">
            <input
              className="admin-label-input"
              value={label}
              onChange={e => { setLabel(e.target.value); setIsDirty(true); setSaveState('idle') }}
              placeholder="Album name"
              aria-label="Album name"
            />
            <input
              className="admin-sub-input"
              value={sub}
              onChange={e => { setSub(e.target.value); setIsDirty(true); setSaveState('idle') }}
              placeholder="Subtitle"
              aria-label="Album subtitle"
            />
          </div>
          <div className="admin-action-row">
            {selected.kind !== 'new-photo' && (
              <button
                className={`admin-save-btn${isDirty ? ' is-dirty' : ''}`}
                onClick={handleSaveAll}
                type="button"
              >
                {saveLabel}
              </button>
            )}
            <Link className="admin-save-btn" href={`/admin/albums/${album.slug}`}>open album admin</Link>
            <button className="admin-modal-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        <div className="admin-album-layout">
          <div className="admin-photo-grid">
            {renderThumb({ src: cover, previewSrc: coverPreview, cellClass: '', objectPosition: `${coverCrop.x}% ${coverCrop.y}%`, objectScale: coverCrop.scale }, 'cover')}
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
            {/* Crop stage with full-image overlay */}
            <div
              className={`admin-crop-stage${isDraggingCrop ? ' is-dragging-crop' : ''}`}
              onPointerDown={handleCropPointerDown}
              onPointerMove={handleCropPointerMove}
              onPointerUp={handleCropPointerUp}
              onPointerCancel={() => { setIsDraggingCrop(false); cropDragRef.current = null }}
            >
              {imageSrc && (
                <LoadableImage
                  src={imageSrc}
                  alt=""
                  fill
                  sizes="50vw"
                  wrapperClassName="admin-crop-bg-shell"
                  style={cropImageStyle(`${crop.x}% ${crop.y}%`, crop.scale)}
                />
              )}
              <div className="admin-crop-stage-dim" />
              <div ref={cropFrameRef} className={`admin-crop-frame ${previewAspectClass}`}>
                {imageSrc && (
                  <LoadableImage
                    src={imageSrc}
                    alt=""
                    fill
                    sizes="(max-width: 900px) 70vw, 380px"
                    style={cropImageStyle(`${crop.x}% ${crop.y}%`, crop.scale)}
                  />
                )}
                <div className="admin-crop-guides" />
              </div>
              {selected.kind === 'new-photo' && (
                <div className="admin-new-photo-placeholder">new album photo</div>
              )}
            </div>

            <div className="admin-crop-controls">
              <label className="admin-crop-field">
                <span>zoom</span>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.01"
                  value={crop.scale}
                  onChange={e => {
                    setCrop(prev => ({ ...prev, scale: Number(e.target.value) }))
                    setIsDirty(true)
                    setSaveState('idle')
                  }}
                />
              </label>

              <div className="admin-action-row">
                {selected.kind !== 'new-photo' && (
                  <>
                    <button
                      className={`admin-save-btn${isDirty ? ' is-dirty' : ''}`}
                      onClick={handleSaveAll}
                      type="button"
                    >
                      {saveLabel}
                    </button>
                    <button className="admin-save-btn" onClick={() => triggerUpload(selected)} type="button">replace image</button>
                    {selected.kind === 'photo' && !confirmDelete && (
                      <button
                        className="admin-save-btn admin-delete-btn"
                        onClick={() => setConfirmDelete(true)}
                        type="button"
                      >
                        delete photo
                      </button>
                    )}
                    {selected.kind === 'photo' && confirmDelete && (
                      <>
                        <button
                          className="admin-save-btn admin-delete-btn is-dirty"
                          onClick={handleDeletePhoto}
                          disabled={deleting}
                          type="button"
                        >
                          {deleting ? 'deleting…' : 'confirm delete'}
                        </button>
                        <button
                          className="admin-save-btn"
                          onClick={() => setConfirmDelete(false)}
                          type="button"
                        >
                          cancel
                        </button>
                      </>
                    )}
                  </>
                )}
                {selected.kind === 'new-photo' && (
                  <button className="admin-save-btn" onClick={() => triggerUpload(selected)} type="button">upload new photo</button>
                )}
              </div>
              <p className="admin-help-text">Drag the preview to reposition. The bright frame is the final crop. Drag thumbnails to reorder.</p>
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
