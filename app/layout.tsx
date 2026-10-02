import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Dopasuj CV do oferty pracy",
    description: "SEO todo",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html
            lang="pl"
            className={`${geistSans.variable} h-full antialiased`}
        >
            <body className="min-h-full">{children}</body>
        </html>
    );
}
