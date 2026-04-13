'use client'

import { useState, FormEvent } from 'react'

const shootTypes = [
  'Portraits',
  'Wedding',
  'Editorial',
  'Film / Analog',
  'Documentary',
  'Other',
]

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')

    const form = e.target as HTMLFormElement
    const data = Object.fromEntries(new FormData(form))

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Server error')
      setStatus('success')
      setTimeout(() => {
        setStatus('idle')
        form.reset()
      }, 3000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  return (
    <form className="letter-wrap fade-in" onSubmit={handleSubmit} noValidate>

      {/* ── Airmail border strips ── */}
      <div className="letter-airmail letter-airmail-top" aria-hidden="true" />

      {/* ── Header: FROM fields + Stamp ── */}
      <div className="letter-header">
        <div className="letter-from">
          <div className="letter-field-row">
            <span className="letter-label">FROM</span>
            <div className="letter-from-fields">
              <input
                name="fname"
                type="text"
                className="letter-input"
                placeholder="Your name"
                required
              />
              <input
                name="email"
                type="email"
                className="letter-input"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
        </div>

        <div className="letter-stamp" aria-hidden="true">
          <div className="stamp-inner">
            <span className="stamp-top">PHOTO</span>
            <div className="stamp-img">✦</div>
            <span className="stamp-btm">PRIORITY</span>
          </div>
        </div>
      </div>

      {/* ── TO ── */}
      <div className="letter-to-row">
        <span className="letter-label">TO</span>
        <div className="letter-to-address">
          <span className="to-name">Cathy Luo</span>
          <span className="to-handle">@liminalfawn · Photography</span>
        </div>
      </div>

      <div className="letter-rule" />

      {/* ── RE / Shoot type ── */}
      <div className="letter-re-row">
        <span className="letter-label">RE</span>
        <select name="type" className="letter-select" defaultValue="">
          <option value="" disabled>What is this about?</option>
          {shootTypes.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="letter-rule" />

      {/* ── Message on lined paper ── */}
      <div className="letter-body">
        <textarea
          name="message"
          className="letter-textarea"
          placeholder="Write your message here — describe the shoot, the mood, the date. Anything helps."
          required
        />
      </div>

      {/* ── Footer: postmark + send ── */}
      <div className="letter-footer">
        <div className="letter-postmark" aria-hidden="true">
          <div className="postmark-ring">
            <span className="postmark-name">CATHY LUO</span>
            <span className="postmark-waves">~~~~~~~</span>
            <span className="postmark-sub">PHOTOGRAPHY</span>
          </div>
        </div>

        <button
          type="submit"
          className={`letter-send${status === 'success' ? ' sent' : ''}`}
          disabled={status === 'sending' || status === 'success'}
        >
          {status === 'sending' ? 'Sending…'
            : status === 'success' ? 'Sent ✓'
            : status === 'error' ? 'Try again →'
            : 'Send →'}
        </button>
      </div>

      {/* ── Airmail border strip (bottom) ── */}
      <div className="letter-airmail letter-airmail-btm" aria-hidden="true" />

    </form>
  )
}
