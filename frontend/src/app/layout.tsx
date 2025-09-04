import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AppProvider } from '@/contexts/AppContext'
import './globals.scss'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Face Similarity Search',
    description: 'Find celebrity look-alikes using face similarity matching',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AppProvider>
                    {children}
                </AppProvider>
                <Toaster />
            </body>
        </html>
    )
}
