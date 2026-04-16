import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getAlbum } from '@/lib/albums'
import AlbumGrid from '@/components/AlbumGrid'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const album = await getAlbum(slug)
  return { title: album ? `${album.label} — Cathy Luo` : 'Not Found' }
}

export default async function AlbumPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const album = await getAlbum(slug)
  if (!album) notFound()

  return (
    <>
      <header className="album-nav">
        <Link href="/" className="album-nav-logo">Cathy Luo</Link>
        <Link href="/#projects" className="album-back">← all work</Link>
      </header>

      <main className="album-main">
        <div className="album-hero">
          <p className="section-tag">{album.sub}</p>
          <h1 className="album-title">{album.label}</h1>
          <span className="album-count">{album.photos.length} photographs</span>
        </div>

        <AlbumGrid photos={album.photos} albumLabel={album.label} />
      </main>

      <footer className="footer" style={{ marginTop: 0 }}>
        <span className="footer-name">Cathy Luo</span>
        <span className="footer-handle">liminalfawn</span>
        <span className="footer-copy">made with love · {new Date().getFullYear()}</span>
      </footer>
    </>
  )
}
