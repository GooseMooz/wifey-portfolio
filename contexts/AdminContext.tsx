'use client'

import { createContext, useContext, useState } from 'react'

interface AdminContextValue {
  isAdmin: boolean
  toggle: () => void
}

const AdminContext = createContext<AdminContextValue>({
  isAdmin: false,
  toggle: () => {},
})

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  return (
    <AdminContext.Provider value={{ isAdmin, toggle: () => setIsAdmin(v => !v) }}>
      {isAdmin && (
        <div className="admin-mode-badge" aria-label="Admin mode active">ADMIN</div>
      )}
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  return useContext(AdminContext)
}
