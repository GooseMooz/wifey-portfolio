'use client'

import { useEffect, useRef, useState } from 'react'
import { cropImageStyle } from '@/lib/cropStyle'
import LoadableImage from './LoadableImage'

type ProjectPhoto = {
  src: string
  originalSrc: string
  objectPosition: string
  objectScale: number
}

type CropState = {
  x: number
  y: number
  scale: number
}

interface Props {
  photo: ProjectPhoto
  description: string
  onClose: () => void
  onReplace: (nextPhoto: ProjectPhoto) => void
}

function parseCrop(photo: ProjectPhoto): CropState {
  const [x = '50%', y = '50%'] = photo.objectPosition.split(' ')
  return {
    x: Number.parseFloat(x) || 50,
    y: Number.parseFloat(y) || 50,
    scale: photo.objectScale || 1,
  }
}

export default function AdminProjectModal({ photo, description, onClose, onReplace }: Props) {
  const [uploading, setUploading] = useState(false)
  const [justReplaced, setJustReplaced] = useState(false)
  const [crop, setCrop] = useState<CropState>(() => parseCrop(photo))
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

  useEffect(() => {
    setCrop(parseCrop(photo))
  }, [photo])

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

  const handleSaveAll = async () => {
    setSaveState('saving')
    await saveCrop()
    onReplace({
      ...photo,
      objectPosition: `${crop.x}% ${crop.y}%`,
      objectScale: crop.scale,
    })
    setIsDirty(false)
    setSaveState('saved')
  }

  // Delta-based crop drag — drag right moves image right (natural panning)
  const handleCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
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
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.newPath) {
        const timestampedSrc = `${data.newPath}?v=${Date.now()}`
        await saveCrop(crop, data.newPath)
        onReplace({
          src: timestampedSrc,
          originalSrc: data.newPath,
          objectPosition: `${crop.x}% ${crop.y}%`,
          objectScale: crop.scale,
        })
        setIsDirty(false)
        setSaveState('saved')
        setJustReplaced(true)
        setTimeout(() => setJustReplaced(false), 700)
      }
    } finally {
      setUploading(false)
    }
  }

  const saveLabel = saveState === 'saving' ? 'saving…' : saveState === 'saved' && !isDirty ? 'saved ✓' : 'save changes'

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-single" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <span className="admin-modal-title">{description}</span>
          <div className="admin-action-row">
            <button
              className={`admin-save-btn${isDirty ? ' is-dirty' : ''}`}
              onClick={handleSaveAll}
              disabled={uploading}
              type="button"
            >
              {saveLabel}
            </button>
            <button className="admin-modal-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {/* Crop stage with full-image background overlay */}
        <div
          className={`admin-crop-stage admin-crop-stage-single${isDraggingCrop ? ' is-dragging-crop' : ''}${uploading ? ' is-uploading-stage' : ''}${justReplaced ? ' just-replaced-stage' : ''}`}
          style={{ margin: '20px' }}
          onPointerDown={handleCropPointerDown}
          onPointerMove={handleCropPointerMove}
          onPointerUp={handleCropPointerUp}
          onPointerCancel={() => { setIsDraggingCrop(false); cropDragRef.current = null }}
        >
          <LoadableImage
            src={photo.src}
            alt=""
            fill
            sizes="(max-width: 600px) 90vw, 480px"
            wrapperClassName="admin-crop-bg-shell"
            style={cropImageStyle(`${crop.x}% ${crop.y}%`, crop.scale)}
          />
          <div className="admin-crop-stage-dim" />
          <div ref={cropFrameRef} className="admin-crop-frame is-project">
            <LoadableImage
              src={photo.src}
              alt=""
              fill
              sizes="(max-width: 600px) 90vw, 480px"
              style={cropImageStyle(`${crop.x}% ${crop.y}%`, crop.scale)}
            />
            <div className="admin-crop-guides" />
            <div className="admin-photo-overlay" style={{ opacity: uploading ? 1 : justReplaced ? 1 : 0, background: justReplaced ? 'rgba(80, 160, 120, 0.55)' : undefined }}>
              {uploading ? <div className="admin-spinner" /> : justReplaced ? '✓' : 'drag to reposition'}
            </div>
          </div>
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
            <button
              className={`admin-save-btn${isDirty ? ' is-dirty' : ''}`}
              onClick={handleSaveAll}
              type="button"
            >
              {saveLabel}
            </button>
            <button className="admin-save-btn" onClick={() => inputRef.current?.click()} disabled={uploading} type="button">
              replace image
            </button>
          </div>
          <p className="admin-help-text">Drag the preview to reposition. The bright frame shows the final crop. Use zoom to fit more or less.</p>
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
