'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const links = [
  { label: 'About',    href: '#about'    },
  { label: 'Projects', href: '#projects' },
  { label: 'Rates',    href: '#rates'    },
  { label: 'Contact',  href: '#contact'  },
]

function IgIcon() {
  return (
    <svg
      className="nav-ig-icon"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

export default function Nav() {
  const [active, setActive] = useState('')

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('section[id]')
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
      { threshold: 0.4 }
    )
    sections.forEach(s => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <nav className="nav">
      <div className="nav-brand">
        <Link href="#home" className="nav-logo">Cathy Luo</Link>
        <a
          href="https://instagram.com/liminalfawn"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-handle"
          aria-label="Instagram @liminalfawn"
        >
          <IgIcon />
          @liminalfawn
        </a>
      </div>
      <ul className="nav-links">
        {links.map(({ label, href }) => (
          <li key={href}>
            <a href={href} className={active === href.slice(1) ? 'active' : ''}>
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
