'use client'

import { useEffect, useRef } from 'react'

const INPUT_SELECTORS = 'input, textarea, select, [contenteditable]'
const INTERACTIVE_SELECTORS = 'a, button, [role="button"], [tabindex="0"], label[for]'

const IDLE_MS = 4000

export default function ClientEffects() {
  const blobRef = useRef<HTMLDivElement>(null)

  // Velocity-squish cursor + hover grow + idle fade
  useEffect(() => {
    const blob = blobRef.current
    if (!blob) return

    let curX = -200, curY = -200
    let prevX = -200, prevY = -200
    let raf: number
    let idleTimer: ReturnType<typeof setTimeout> | null = null

    /* ── position + squish ── */
    const tick = () => {
      const dx = curX - prevX
      const dy = curY - prevY
      const speed = Math.sqrt(dx * dx + dy * dy)

      const angle   = Math.atan2(dy, dx) * (180 / Math.PI)
      const stretch = Math.min(1 + speed * 0.05, 1.65)
      const squish  = 1 / Math.sqrt(stretch)

      blob.style.left      = `${curX}px`
      blob.style.top       = `${curY}px`
      blob.style.transform = speed > 0.5
        ? `translate(-50%, -50%) rotate(${angle}deg) scaleX(${stretch}) scaleY(${squish})`
        : `translate(-50%, -50%)`

      prevX += (curX - prevX) * 0.35
      prevY += (curY - prevY) * 0.35

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    /* ── show / hide helpers ── */
    const hide = () => blob.classList.add('cursor-hidden')
    const show = () => blob.classList.remove('cursor-hidden')

    /* ── idle helpers ── */
    const goIdle  = () => blob.classList.add('cursor-idle')
    const wakeUp  = () => {
      blob.classList.remove('cursor-idle')
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(goIdle, IDLE_MS)
    }

    /* ── cursor leaves / enters the browser window ── */
    document.addEventListener('mouseleave', hide)
    document.addEventListener('mouseenter', show)

    /* ── main move handler ── */
    const onMove = (e: MouseEvent) => {
      curX = e.clientX
      curY = e.clientY

      // Wake up from idle
      wakeUp()

      const target = e.target as Element | null

      // Hide over text inputs
      if (target?.closest(INPUT_SELECTORS)) {
        hide()
      } else {
        show()
      }

      // Grow over interactive elements
      if (target?.closest(INTERACTIVE_SELECTORS)) {
        blob.classList.add('cursor-hovered')
      } else {
        blob.classList.remove('cursor-hovered')
      }
    }

    document.addEventListener('mousemove', onMove)

    /* ── re-evaluate hover state while scrolling ──
       During scroll the cursor doesn't move, but elements shift under it.
       Re-check what's at the last known cursor position on every scroll tick. */
    const onScroll = () => {
      const target = document.elementFromPoint(curX, curY)
      if (target?.closest(INTERACTIVE_SELECTORS)) {
        blob.classList.add('cursor-hovered')
      } else {
        blob.classList.remove('cursor-hovered')
      }
    }
    // capture: true catches scroll events from any scrollable container
    document.addEventListener('scroll', onScroll, { passive: true, capture: true })

    // Start idle countdown immediately
    idleTimer = setTimeout(goIdle, IDLE_MS)

    return () => {
      cancelAnimationFrame(raf)
      if (idleTimer) clearTimeout(idleTimer)
      document.removeEventListener('mouseleave', hide)
      document.removeEventListener('mouseenter', show)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions)
    }
  }, [])

  // Scroll fade-in — uses MutationObserver so elements that stream in
  // after initial mount (async server components) are still caught.
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          io.unobserve(e.target)
        }
      }),
      { threshold: 0.1 }
    )

    const enqueue = (el: Element) => {
      if (el.classList.contains('fade-in') && !el.classList.contains('visible')) {
        io.observe(el)
      }
    }

    // Observe elements already in the DOM
    document.querySelectorAll('.fade-in').forEach(enqueue)

    // Pick up elements added by streaming server components
    const mo = new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue
          const el = node as Element
          enqueue(el)
          el.querySelectorAll('.fade-in').forEach(enqueue)
        }
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return <div ref={blobRef} className="cursor-blob cursor-hidden" aria-hidden="true" />
}
