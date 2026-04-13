function IgIcon() {
  return (
    <svg
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

export default function Footer() {
  return (
    <footer className="footer">
      <span className="footer-name">Cathy Luo</span>
      <a
        href="https://instagram.com/liminalfawn"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-handle"
        aria-label="Instagram @liminalfawn"
      >
        <IgIcon />
        @liminalfawn
      </a>
      <span className="footer-copy">made with love · {new Date().getFullYear()}</span>
      <span className="footer-copy">all rights reserved</span>
    </footer>
  )
}
