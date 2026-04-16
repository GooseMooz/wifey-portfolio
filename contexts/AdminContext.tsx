'use client'

import { createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'

interface AdminContextValue {
  isAdmin: boolean
}

const AdminContext = createContext<AdminContextValue>({
  isAdmin: false,
})

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')

  return (
    <AdminContext.Provider value={{ isAdmin }}>
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
