import { Poppins, Manrope } from 'next/font/google'
import './globals.css'
import '../styles/animations.css'
import '../styles/reset.css'
import dynamic from 'next/dynamic'

// Import PageTransition component
const PageTransition = dynamic(
  () => import('../components/PageTransition'),
  { ssr: false }
)

// Dynamically import components with no SSR
const AutoAuthFixWrapper = dynamic(
  () => import('../components/AutoAuthFixWrapper'),
  { ssr: false }
)

const NotificationProviderWrapper = dynamic(
  () => import('../components/NotificationProviderWrapper'),
  { ssr: false }
)

const InitialLoadingScreen = dynamic(
  () => import('../components/InitialLoadingScreen'),
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={`${poppins.variable} ${manrope.variable} font-sans antialiased`}>
        {/* InitialLoadingScreen disabled */}
        {/* AutoAuthFixWrapper disabled */}
        <NotificationProviderWrapper>
          {/* PageTransition disabled */}
          <div className="page-transition">
            {children}
          </div>
        </NotificationProviderWrapper>
      </body>
    </html>
  )
}