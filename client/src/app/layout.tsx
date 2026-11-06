import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Providers } from "@/components/providers";
import { SITE } from "@/lib/constants/site";
import { JsonLd, siteGraph } from "@/lib/seo/json-ld";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.legalName, url: SITE.url }],
  creator: SITE.legalName,
  publisher: SITE.legalName,
  category: "business",
  keywords: [
    "business email",
    "business email Nigeria",
    "professional email",
    "custom domain email",
    "email hosting Nigeria",
    ".ng domain email",
  ],
  formatDetection: { telephone: false, address: false, email: false },
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: SITE.name,
    url: "/",
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-NG"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-ink" suppressHydrationWarning>
        <JsonLd data={siteGraph} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
