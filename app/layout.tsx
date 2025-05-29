import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Emojiscribe - AI-Powered Text to Emoji Converter",
  description:
    "Transform your words into the perfect emoji with AI-powered matching. Get instant emoji suggestions with match percentages and detailed analysis for any text input.",
  keywords: [
    "emoji",
    "text to emoji",
    "emoji converter",
    "AI emoji",
    "emoji matcher",
    "emoji generator",
    "text analysis",
    "emoji API",
    "unicode emoji",
    "emoji search",
  ],
  authors: [{ name: "Emojiscribe" }],
  creator: "Emojiscribe",
  publisher: "Emojiscribe",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://emojiscribe.vercel.app",
    title: "Emojiscribe - AI-Powered Text to Emoji Converter",
    description:
      "Transform your words into the perfect emoji with AI-powered matching. Get instant emoji suggestions with match percentages and detailed analysis.",
    siteName: "Emojiscribe",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Emojiscribe - AI-Powered Text to Emoji Converter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Emojiscribe - AI-Powered Text to Emoji Converter",
    description:
      "Transform your words into the perfect emoji with AI-powered matching. Get instant emoji suggestions with match percentages and detailed analysis.",
    images: ["/og-image.png"],
    creator: "@emojiscribe",
  },
  alternates: {
    canonical: "https://emojiscribe.vercel.app",
  },
  category: "technology",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Emojiscribe",
              description: "AI-powered text to emoji converter with match percentages and detailed analysis",
              url: "https://emojiscribe.vercel.app",
              applicationCategory: "UtilityApplication",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              creator: {
                "@type": "Organization",
                name: "Emojiscribe",
              },
              featureList: [
                "AI-powered emoji matching",
                "Match percentage analysis",
                "Keyword extraction",
                "REST API access",
                "Real-time processing",
              ],
            }),
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
