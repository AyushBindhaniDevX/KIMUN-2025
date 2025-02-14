import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KIMUN 2025',
  description: 'Created with Love by team KIMUN',
  generator: '',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
