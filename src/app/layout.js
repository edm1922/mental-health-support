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
  title: 'Healmate',
  description: 'Your journey to better mental health starts here',
  icons: [
    { rel: 'icon', url: '/favicon.ico', sizes: 'any' },
    { rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' },
    { rel: 'icon', url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    { rel: 'icon', url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    { rel: 'apple-touch-icon', url: '/favicon.png' }
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className={`${poppins.variable} ${manrope.variable} font-sans antialiased`}>
        <InitialLoadingScreen />
        <NotificationProviderWrapper>
          <div className="page-transition">
            {children}
          </div>
        </NotificationProviderWrapper>
      </body>
    </html>
  )
}