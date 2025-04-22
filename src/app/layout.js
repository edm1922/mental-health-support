import { Poppins, Manrope } from 'next/font/google'
import './globals.css'
import '../styles/animations.css'
import dynamic from 'next/dynamic'

// Dynamically import the AutoAuthFixWrapper with no SSR
const AutoAuthFixWrapper = dynamic(
  () => import('../components/AutoAuthFixWrapper'),
  { ssr: false }
)

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
})

export const metadata = {
  title: 'Mental Health Support',
  description: 'Your journey to better mental health starts here',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${poppins.variable} ${manrope.variable} font-sans antialiased`}>
        <AutoAuthFixWrapper />
        <div className="page-transition">
          {children}
        </div>
      </body>
    </html>
  )
}