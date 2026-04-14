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
  const [typeError, setTypeError] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'sending') return

    const form = e.target as HTMLFormElement
    const type = (form.elements.namedItem('type') as HTMLSelectElement).value
    if (!type) {
      setTypeError(true)
      return
    }
    setTypeError(false)
    setStatus('sending')

    const { fname, ...rest } = Object.fromEntries(new FormData(form)) as Record<string, string>
    const data = { name: fname, ...rest, submittedAt: new Date().toISOString() }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      setStatus('success')
      setTimeout(() => {
        setStatus('idle')
        form.reset()
      }, 4200)
    } catch (err) {
      console.error('[contact] fetch failed:', err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  return (
    <form
      className={`letter-wrap${status === 'success' ? ' letter-wrap--success' : ''}`}
      onSubmit={handleSubmit}
      noValidate
    >

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
        <div className="letter-re-field">
          <select
            name="type"
            className={`letter-select${typeError ? ' letter-select--error' : ''}`}
            defaultValue=""
            onChange={() => setTypeError(false)}
          >
            <option value="" disabled>What is this about?</option>
            {shootTypes.map(t => <option key={t}>{t}</option>)}
          </select>
          {typeError && <span className="letter-field-error">Please choose a type of inquiry.</span>}
        </div>
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
          className="letter-send"
          disabled={status === 'sending' || status === 'success'}
        >
          {status === 'sending' ? 'Sending…' : 'Send →'}
        </button>
      </div>

      {/* ── Error notice ── */}
      {status === 'error' && (
        <div className="letter-notice letter-notice--error" role="alert">
          Something went wrong — please try again or email directly.
        </div>
      )}

      {/* ── Airmail border strip (bottom) ── */}
      <div className="letter-airmail letter-airmail-btm" aria-hidden="true" />

      {/* ── Success stamp overlay ── */}
      {status === 'success' && (
        <div className="letter-sent-overlay" aria-hidden="true">
          <div className="letter-sent-stamp">
            <span className="sent-stamp-top">MESSAGE</span>
            <span className="sent-stamp-mid">SENT</span>
            <span className="sent-stamp-btm">✦</span>
          </div>
        </div>
      )}

    </form>
  )
}
