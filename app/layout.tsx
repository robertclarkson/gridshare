import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./header";
import { Providers } from "./provider";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Gridshare Miner Monitoring",
    description: "Check up on your mining stats",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <Providers>
                    <Header />
                    <div className="h-screen">
                        <div className="px-6 flex-grow">
                            {children}
                            <div>
                                <a href="https://coingecko.com">Data provided by CoinGecko</a>
                            </div>
                        </div>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
