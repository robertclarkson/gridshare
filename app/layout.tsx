import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./header";
import { Providers } from "./provider";
import Footer from "./footer";
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
                            <Footer />
                        </div>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
