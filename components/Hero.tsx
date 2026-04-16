'use client'

import { useState, useRef, useCallback, useLayoutEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'
import type { AlbumData } from '@/lib/albums'
import { useAdmin } from '@/contexts/AdminContext'
import AdminAlbumModal from './AdminAlbumModal'

// Fixed grid placement for each of the 5 album slots.
// Slot 0 = large left tile (col 1, rows 1–2), slots 1–4 fill the right 2×2 grid.
const SLOT_GRID: CSSProperties[] = [
  { gridColumn: '1', gridRow: '1 / span 2' },
  { gridColumn: '2', gridRow: '1' },
  { gridColumn: '2', gridRow: '2' },
  { gridColumn: '3', gridRow: '1' },
  { gridColumn: '3', gridRow: '2' },
]

const PREVIEW_TAPE = ['1deg', '-1.5deg', '2deg', '-0.5deg']

// Page-load assembly: tiles enter from these off-screen positions
const LOAD_SLIDE: CSSProperties[] = [
  { '--slide-x': '-700px', '--slide-y': '-100px' } as CSSProperties,
  { '--slide-x': '600px',  '--slide-y': '-400px' } as CSSProperties,
  { '--slide-x': '700px',  '--slide-y': '-200px' } as CSSProperties,
  { '--slide-x': '600px',  '--slide-y': '350px'  } as CSSProperties,
  { '--slide-x': '350px',  '--slide-y': '500px'  } as CSSProperties,
]

type Phase = 'idle' | 'open' | 'closing'

type Props = {
  albums: AlbumData[]
}

export default function Hero({ albums }: Props) {
  const router = useRouter()
  const { isAdmin } = useAdmin()
  const heroRef     = useRef<HTMLElement>(null)
  const albumRefs   = useRef<(HTMLDivElement | null)[]>([])
  const previewRefs = useRef<(HTMLDivElement | null)[]>([])

  const fromOffsets  = useRef<{ x: number; y: number }[]>([])
  const slideTransform = useRef<string>('translateX(120vw)')

  const [phase,         setPhase]         = useState<Phase>('idle')
  const [anchorIdx,     setAnchorIdx]     = useState<number | null>(null)
  const [slotOrder,     setSlotOrder]     = useState<number[]>([])
  const [pageLoaded,    setPageLoaded]    = useState(false)
  const [adminEditIdx,  setAdminEditIdx]  = useState<number | null>(null)

  const shouldDirectOpenAlbum = useCallback(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 768px), (hover: none), (pointer: coarse)').matches
  }, [])

  const open = useCallback((idx: number) => {
    if (phase !== 'idle') return

    const hero = heroRef.current
    if (!hero) return

    const heroRect = hero.getBoundingClientRect()
    const rects = albumRefs.current.map(el => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        left: r.left - heroRect.left,
        top:  r.top  - heroRect.top,
        cx:   r.left + r.width  / 2 - heroRect.left,
        cy:   r.top  + r.height / 2 - heroRect.top,
      }
    })

    const anchor = rects[idx]
    if (!anchor) return

    const W = heroRect.width, H = heroRect.height
    const DIRS: Record<number, string> = {
      0: `translateX(${W + 120}px)`,
      1: `translateY(${H + 120}px)`,
      2: `translateY(-${H + 120}px)`,
      3: `translateX(-${W + 120}px)`,
      4: `translateX(-${W + 120}px)`,
    }
    slideTransform.current = DIRS[idx] ?? `translateX(${W + 120}px)`

    const nonIdxs = albums.map((_, i) => i).filter(i => i !== idx)

    fromOffsets.current = nonIdxs.map(slotIdx => {
      const slot = rects[slotIdx]
      if (!slot) return { x: 0, y: 0 }
      return { x: anchor.cx - slot.cx, y: anchor.cy - slot.cy }
    })

    setPageLoaded(true)
    setAnchorIdx(idx)
    setSlotOrder(nonIdxs)
    setPhase('open')
  }, [phase, albums])

  const activateAlbum = useCallback((idx: number) => {
    const album = albums[idx]
    if (!album) return

    if (shouldDirectOpenAlbum()) {
      router.push(album.href)
      return
    }

    open(idx)
  }, [albums, open, router, shouldDirectOpenAlbum])

  useLayoutEffect(() => {
    if (phase !== 'open') return
    previewRefs.current.forEach((el, k) => {
      if (!el) return
      const off = fromOffsets.current[k]
      if (!off) return
      el.style.setProperty('--from-x', `${off.x}px`)
      el.style.setProperty('--from-y', `${off.y}px`)
    })
  }, [phase, slotOrder])

  const close = useCallback(() => {
    if (phase !== 'open') return
    setPhase('closing')
    setTimeout(() => {
      setPhase('idle')
      setAnchorIdx(null)
      setSlotOrder([])
    }, 520)
  }, [phase])

  const isExpanded = phase === 'open' || phase === 'closing'
  const isClosing  = phase === 'closing'

  return (
    <section id="home" className="hero" ref={heroRef} aria-label="Portfolio categories">

      {/* ═══ Album tiles ═══ */}
      {albums.map((album, idx) => {
        const isAnchor = idx === anchorIdx
        const isOther  = isExpanded && !isAnchor

        let transformStyle = ''
        let transitionStyle = ''
        if (isOther) {
          transformStyle  = isClosing ? 'none' : slideTransform.current
          transitionStyle = isClosing
            ? `transform 0.52s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 28}ms`
            : `transform 0.38s cubic-bezier(0.55, 0, 0.7, 0.8) ${idx * 20}ms`
        }

        const clickHandler = isAdmin
          ? () => setAdminEditIdx(idx)
          : (!isExpanded ? () => activateAlbum(idx) : isAnchor ? close : undefined)
        const isInteractive = isAdmin || !isExpanded || isAnchor

        return (
          <div
            key={album.slug}
            ref={el => { albumRefs.current[idx] = el }}
            className={`tile-stack${!pageLoaded ? ' is-entering' : ''}${isAdmin ? ' admin-editable' : ''}`}
            style={{
              '--r':      album.rotation,
              '--tape-r': album.tapeR,
              ...SLOT_GRID[idx],
              ...(!pageLoaded ? LOAD_SLIDE[idx] : {}),
              ...(!pageLoaded ? { animationDelay: `${idx * 75}ms` } : {}),
              ...(transformStyle  ? { transform:  transformStyle  } : {}),
              ...(transitionStyle ? { transition: transitionStyle } : {}),
              ...(isOther         ? { pointerEvents: 'none' }      : {}),
              ...(isAnchor && isExpanded ? { zIndex: 10 } : {}),
            } as CSSProperties}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            aria-label={
              !isExpanded ? `View ${album.label} album`
              : isAnchor  ? `Fold ${album.label} album back`
              : undefined
            }
            onClick={clickHandler}
            onKeyDown={isInteractive ? (e => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clickHandler?.() }
            }) : undefined}
          >
            <div className="stack-back stack-back-2" />
            <div className="stack-back stack-back-1" />
            <div className="stack-front">
              <div className="tile-img-wrap">
                <Image
                  src={album.cover}
                  alt={album.label}
                  fill
                  sizes="(max-width: 768px) 50vw, 32vw"
                  priority={idx === 0}
                  style={{ objectFit: 'cover', borderRadius: '2px' }}
                />
                <div className="tile-hover-label">
                  <span className="tile-label-name">{isAdmin ? '✎ edit album' : album.label}</span>
                  <span className="tile-label-sub">{isAdmin ? '' : album.sub}</span>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* ═══ Preview tiles — first 4 photos from the album folder ═══ */}
      {isExpanded && anchorIdx !== null && slotOrder.map((slotIdx, k) => {
        if (k >= 4) return null
        const expanded = albums[anchorIdx]
        const previewSrc = expanded.previews[k]
        if (!previewSrc) return null

        return (
          <div
            key={`${expanded.slug}-preview-${k}`}
            ref={el => { previewRefs.current[k] = el }}
            className={`preview-tile ${isClosing ? 'preview-collapsing' : 'preview-entering'}`}
            style={{
              ...SLOT_GRID[slotIdx],
              '--tape-r':       PREVIEW_TAPE[k],
              'animationDelay': isClosing ? `${k * 28}ms` : `${360 + k * 90}ms`,
            } as CSSProperties}
            role="button"
            tabIndex={0}
            aria-label="Click to fold album back"
            onClick={close}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') close() }}
          >
            <div className="tile-img-wrap">
              <Image
                src={previewSrc}
                alt={`${expanded.label} — photo ${k + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 32vw"
                style={{ objectFit: 'cover' }}
              />
              <div className="tile-hover-label">
                <span className="tile-label-name">{expanded.label}</span>
                <span className="tile-label-sub">{expanded.sub}</span>
              </div>
            </div>
          </div>
        )
      })}

      {/* ═══ Sticky note ═══ */}
      {isExpanded && anchorIdx !== null && (
        <Link
          href={albums[anchorIdx].href}
          className={`sticky-note ${isClosing ? 'sticky-collapsing' : 'sticky-entering'}`}
          style={{ animationDelay: isClosing ? '28ms' : '340ms' } as CSSProperties}
          aria-label={`See full ${albums[anchorIdx].label} album`}
        >
          <div className="sticky-note-inner">
            <span className="sticky-note-text">see more<br />of that</span>
            <span className="sticky-note-arrow">→</span>
          </div>
        </Link>
      )}

      {/* ═══ Admin album editor modal ═══ */}
      {isAdmin && adminEditIdx !== null && (
        <AdminAlbumModal
          album={albums[adminEditIdx]}
          onClose={() => setAdminEditIdx(null)}
        />
      )}

      {/* ═══ Off-screen preload: eagerly fetch all album preview images ═══
           position:fixed + top:-120vh keeps them off-screen while the
           realistic container dimensions let Next.js pick the right srcset size.
           priority={true} injects <link rel="preload"> into <head> immediately. */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-120vh',
          left: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        {albums.flatMap(a => a.previews).map(src => (
          <div key={src} style={{ position: 'relative', width: '50%', height: '25%' }}>
            <Image
              src={src}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 32vw"
              priority
              style={{ objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
