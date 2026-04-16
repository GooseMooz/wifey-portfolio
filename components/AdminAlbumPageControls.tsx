'use client'

import { useState } from 'react'
import type { AlbumData } from '@/lib/albums'
import { useAdmin } from '@/contexts/AdminContext'
import AdminAlbumModal from './AdminAlbumModal'

export default function AdminAlbumPageControls({ album }: { album: AlbumData }) {
  const { isAdmin } = useAdmin()
  const [open, setOpen] = useState(false)

  if (!isAdmin) return null

  return (
    <>
      <div className="admin-page-actions">
        <button className="admin-save-btn" type="button" onClick={() => setOpen(true)}>
          edit album
        </button>
      </div>
      {open && <AdminAlbumModal album={album} onClose={() => setOpen(false)} />}
    </>
  )
}
