import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SGI — Sistema de Gestão de Intertravamentos',
  description: 'Suzano | Gestão digital de intertravamentos de segurança',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
