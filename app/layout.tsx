import type { Metadata } from "next";
import { Toaster } from "sonner";
import { site } from "@/lib/constants/site";
import { getBaseUrl } from "@/lib/utils/url";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: site.metaTitle,
    template: "%s | Yakout",
  },
  description: site.metaDescription,
  robots: { index: true, follow: true },
  openGraph: {
    title: site.metaTitle,
    description: site.metaDescription,
    type: "website",
    locale: "fr_MA",
    siteName: site.companyName,
    images: [{ url: site.logo, width: 1530, height: 468 }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.metaTitle,
    description: site.metaDescription,
    images: [site.logo],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="dark">
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
