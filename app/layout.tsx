import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from "./header";
import { Providers } from "./provider";
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Gridshare Miner Monitoring',
    description: 'Check up on your mining stats',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <Providers>
                <body className={inter.className} style={{ minHeight: '100vh' }}>
                    <Header />
                    {children}
                </body>
            </Providers>
        </html>
    )
}
