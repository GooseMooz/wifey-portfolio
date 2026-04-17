import type { CSSProperties } from 'react'

function parseAxis(value: string | undefined): number {
  const parsed = Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) ? parsed : 50
}

export function cropImageStyle(objectPosition: string, objectScale: number): CSSProperties {
  const [x = '50%', y = '50%'] = objectPosition.split(' ')
  const tx = (50 - parseAxis(x)) * (objectScale - 1)
  const ty = (50 - parseAxis(y)) * (objectScale - 1)

  return {
    objectFit: 'cover',
    objectPosition,
    transform: `translate(${tx}%, ${ty}%) scale(${objectScale})`,
    transformOrigin: 'center',
  }
}
