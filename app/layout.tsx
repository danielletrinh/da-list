import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { overpass } from '@/lib/fonts'
import { HoverProvider } from '@/components/CustomCursor'
import CustomCursor from '@/components/CustomCursor'
import './globals.css'

export const metadata: Metadata = {
  title: '「 caféxcursions 」',
  description: 'danel\'s personal café list; loosely evaluated based on quality + aesthetic + vibes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-primary-offBlack">
      <body className={`${overpass.className} bg-primary-offBlack`}>
        <HoverProvider>
          <div className="min-h-screen bg-primary-offBlack">
            {children}
          </div>
          <CustomCursor />
        </HoverProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}