import type { Metadata } from 'next'
import { IBM_Plex_Mono, VT323 } from 'next/font/google'
import ClientEffects from '@/components/ClientEffects'
import { AdminProvider } from '@/contexts/AdminContext'
import './globals.css'

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-body',
})

const vt323 = VT323({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-receipt',
})

export const metadata: Metadata = {
  title: 'Cathy Luo — Portfolio',
  description: 'Photography portfolio of Cathy Luo',
  icons: { icon: '/icon.png' },
}

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${ibmPlexMono.variable} ${vt323.variable}`}>
        <ClientEffects />
        <AdminProvider>
          {children}
        </AdminProvider>
      </body>
    </html>
  )
}
