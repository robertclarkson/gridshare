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
                            <div className="m-auto mv-5 text-center">
                                <p>
                                    <a href="https://onesandzeros.nz">Built by Ones and Zeros</a>
                                    <br />
                                    <small>
                                        <a href="https://coingecko.com">Price Data provided by CoinGecko</a>
                                    </small>
                                </p>
                            </div>
                        </div>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
