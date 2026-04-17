'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'

type Props = ImageProps & {
  wrapperClassName?: string
}

export default function LoadableImage({
  wrapperClassName = '',
  className,
  onLoad,
  ...props
}: Props) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div
      className={`image-shell${loaded ? ' is-loaded' : ''}${wrapperClassName ? ` ${wrapperClassName}` : ''}`}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="image-shell-placeholder" aria-hidden="true" />
      <Image
        {...props}
        draggable={false}
        className={`image-shell-img${className ? ` ${className}` : ''}`}
        onLoad={(event) => {
          setLoaded(true)
          onLoad?.(event)
        }}
      />
    </div>
  )
}
