import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Modular Credential NFTs Academy',
  description: 'A blockchain-first learning platform issuing course modules as SIP-009 NFTs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  NFT Academy
                </h1>
                <nav className="space-x-8">
                  <a href="/modules" className="text-gray-600 hover:text-gray-900">
                    Modules
                  </a>
                  <a href="/transcript" className="text-gray-600 hover:text-gray-900">
                    Transcript
                  </a>
                  <a href="/degree" className="text-gray-600 hover:text-gray-900">
                    Degree
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
