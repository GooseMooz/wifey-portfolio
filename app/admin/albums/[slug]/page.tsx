import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getAlbum } from '@/lib/albums'
import AlbumGrid from '@/components/AlbumGrid'
import AdminAlbumPageControls from '@/components/AdminAlbumPageControls'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const album = await getAlbum(slug)
  return { title: album ? `${album.label} — Admin — Cathy Luo` : 'Not Found' }
}

export default async function AdminAlbumPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const album = await getAlbum(slug)
  if (!album) notFound()

  return (
    <>
      <header className="album-nav">
        <Link href="/admin" className="album-nav-logo">Cathy Luo</Link>
        <Link href="/admin#projects" className="album-back">← admin home</Link>
      </header>

      <main className="album-main">
        <div className="album-hero">
          <p className="section-tag">{album.sub}</p>
          <h1 className="album-title">{album.label}</h1>
          <span className="album-count">{album.photos.length} photographs</span>
        </div>

        <AdminAlbumPageControls album={album} />
        <AlbumGrid photos={album.photos} albumLabel={album.label} />
      </main>
    </>
  )
}
