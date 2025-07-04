import type { Metadata } from 'next'
import { Inter, Overpass, DM_Serif_Display, Archivo } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const overpass = Overpass({ subsets: ['latin'] })
const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400'
})
const archivo = Archivo({
  subsets: ['latin'],
  weight: '700'
})

export const metadata: Metadata = {
  title: '[ DA ] LIST .𖥔 ݁ ˖',
  description: 'danel\'s personal café list; loosely ranked based on quality + aesthetic + vibes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={overpass.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}