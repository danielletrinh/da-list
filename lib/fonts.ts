import { Inter, Overpass, Gupter, Work_Sans, DM_Sans, DM_Mono } from 'next/font/google'

export const inter = Inter({ subsets: ['latin'] })
export const overpass = Overpass({ subsets: ['latin'] })
export const gupter = Gupter({
  subsets: ['latin'],
  weight: '500',
})
export const workSans = Work_Sans({
  subsets: ['latin'],
  weight: '400',
})
export const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
})
export const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
})