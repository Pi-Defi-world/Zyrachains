import React from "react";
import "./globals.css";
import GlobalFooter from "@/components/GlobalFooter";
import { PageMetadataProvider } from "@/context/pagemetadataContext";
import { LanguageProvider } from '@/context/languagecontext';
import { PiNetworkProvider } from '@/context/PiNetworkContext';
import { SocialProvider } from '@/context/SocialContext';
import GlobalMobileElements from "@/components/GlobalMobileElements";
import { ThemeProvider } from "@/components/theme-provider";
import NavbarWithMobile from '@/components/navbar';
import { AddressProvider } from '@/context/AddressContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { ToastProvider } from '@/components/context/ToastContext';
import { ToastContainer } from '@/components/ui/toast-container';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import Script from 'next/script';
import { BROWSER_POLYFILL } from '@/lib/browser-polyfill';
import type { Metadata, Viewport } from "next";
import MobilePiWelcome from "@/components/MobilePiWelcome";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'localhost:3000'),
  title: {
    default: 'Zyrachain',
    template: '%s | Zyrachain'
  },
  description: 'Zyrachain is a data-driven platform for Pi Network enthusiasts, offering resources, events, and a vibrant ecosystem to connect and grow together.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
      <script id="old-browser-polyfills" dangerouslySetInnerHTML={{ __html: BROWSER_POLYFILL }} />
      <Script id="pi-sdk-loader" strategy="afterInteractive">
        {`
          (function() {
            var s = document.createElement('script');
            s.src = 'https://sdk.minepi.com/pi-sdk.js';
            s.onload = function() {
              window.Pi && window.Pi.init({ version: '2.0' });
            };
            document.head.appendChild(s);
          })();
        `}
      </Script>
        <BackgroundAnimation />
        <ThemeProvider defaultTheme="system">
          <PiNetworkProvider>
            <SocialProvider>
            <AddressProvider>
              <FavoritesProvider>
              <LanguageProvider>
                <PageMetadataProvider>
                  <ToastProvider>
                    <MobilePiWelcome />
                      <NavbarWithMobile />
                      <GlobalMobileElements />
                      <div className="flex min-h-screen">
                        <Sidebar />
                        <div className="flex flex-col flex-1 min-w-0">
                          <main className="flex-1 pb-safe-area-mobile lg:pb-0">
                            {children}
                          </main>
                          <GlobalFooter />
                        </div>
                      </div>
                    <ToastContainer />
                  </ToastProvider>
                </PageMetadataProvider>
              </LanguageProvider>
              </FavoritesProvider>
            </AddressProvider>
            </SocialProvider>
          </PiNetworkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
