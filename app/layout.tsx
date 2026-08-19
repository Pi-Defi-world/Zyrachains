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
import { ToastProvider } from '@/components/context/ToastContext';
import { ToastContainer } from '@/components/ui/toast-container';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import Script from 'next/script';
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
      <Script id="old-browser-polyfills" strategy="beforeInteractive">
        {`
        (function () {
          var g = (typeof globalThis !== 'undefined') ? globalThis : (typeof self !== 'undefined') ? self : (typeof window !== 'undefined') ? window : this;
          if (typeof globalThis === 'undefined') {
            try { Object.defineProperty(g, 'globalThis', { value: g, configurable: true, writable: true }); }
            catch (e) { g['globalThis'] = g; }
          }
          var hasCall = Object.prototype.hasOwnProperty;
          if (!Object['hasOwn']) {
            Object['hasOwn'] = function (obj, key) { return hasCall.call(obj, key); };
          }
          if (!g['queueMicrotask']) {
            g['queueMicrotask'] = (typeof Promise !== 'undefined')
              ? (function (fn) { Promise.resolve().then(fn); })
              : (function (fn) { setTimeout(fn, 0); });
          }
          var AP = Array.prototype;
          if (!AP['at']) {
            AP['at'] = function (n) {
              var len = this.length >>> 0;
              var off = Math.trunc(n);
              var i = off < 0 ? (len + off) : off;
              return (i >= 0 && i < len) ? this[i] : undefined;
            };
          }
          if (!String.prototype['at']) {
            String.prototype['at'] = function (n) { return AP['at'].apply(Object(this), arguments); };
          }
          if (!AP['findLast']) {
            AP['findLast'] = function (fn, thisArg) {
              for (var i = this.length - 1; i >= 0; i--) {
                if (fn.call(thisArg, this[i], i, this)) { return this[i]; }
              }
              return undefined;
            };
          }
          if (!AP['findLastIndex']) {
            AP['findLastIndex'] = function (fn, thisArg) {
              for (var i = this.length - 1; i >= 0; i--) {
                if (fn.call(thisArg, this[i], i, this)) { return i; }
              }
              return -1;
            };
          }
          if (!String.prototype['replaceAll']) {
            String.prototype['replaceAll'] = function (search, replacement) {
              var str = String(this);
              if (search instanceof RegExp) {
                if (!search.global) { throw new TypeError('replaceAll must be called with a global RegExp'); }
                return str.replace(search, replacement);
              }
              var needle = String(search);
              if (needle === '') {
                var parts = [];
                for (var i = 0; i < str.length; i++) { parts.push(String(replacement), str.charAt(i)); }
                return parts.join('');
              }
              return str.split(needle).join(String(replacement));
            };
          }
          if (typeof Promise !== 'undefined') {
            if (Promise['allSettled'] === undefined) {
              Promise['allSettled'] = function (promises) {
                var arr = promises ? Array.prototype.slice.call(promises) : [];
                return Promise.all(arr.map(function (p) {
                  return Promise.resolve(p).then(
                    function (value) { return { status: 'fulfilled', value: value }; },
                    function (reason) { return { status: 'rejected', reason: reason }; }
                  );
                }));
              };
            }
            if (Promise['any'] === undefined) {
              Promise['any'] = function (promises) {
                var arr = promises ? Array.prototype.slice.call(promises) : [];
                return new Promise(function (resolve, reject) {
                  if (!arr.length) {
                    reject(typeof AggregateError !== 'undefined' ? new AggregateError([], 'All promises were rejected') : new Error('All promises were rejected'));
                    return;
                  }
                  var remaining = arr.length, errors = [];
                  arr.forEach(function (p, idx) {
                    Promise.resolve(p).then(resolve, function (reason) {
                      errors[idx] = reason;
                      remaining--;
                      if (remaining === 0) {
                        reject(typeof AggregateError !== 'undefined' ? new AggregateError(errors, 'All promises were rejected') : new Error('All promises were rejected'));
                      }
                    });
                  });
                });
              };
            }
          }
          if (typeof g['structuredClone'] !== 'function') {
            g['structuredClone'] = function (value) {
              if (value === null || typeof value !== 'object') { return value; }
              if (value instanceof Date) { return new Date(value.getTime()); }
              if (value instanceof RegExp) {
                var fl = '';
                if (value.global) { fl += 'g'; }
                if (value.ignoreCase) { fl += 'i'; }
                if (value.multiline) { fl += 'm'; }
                if (value.unicode) { fl += 'u'; }
                if (value.sticky) { fl += 'y'; }
                if (typeof value.dotAll !== 'undefined') { fl += 's'; }
                return new RegExp(value.source, fl);
              }
              if (value instanceof Map) {
                var m = new Map();
                value.forEach(function (v, k) { m.set(k, g['structuredClone'](v)); });
                return m;
              }
              if (value instanceof Set) {
                var s = new Set();
                value.forEach(function (v) { s.add(g['structuredClone'](v)); });
                return s;
              }
              if (value instanceof ArrayBuffer) { return value.slice(0); }
              if (Array.isArray(value)) { return value.map(function (v) { return g['structuredClone'](v); }); }
              var copy = Object.create(Object.getPrototypeOf ? Object.getPrototypeOf(value) : null);
              if (!copy) { try { copy = {}; } catch (e2) {} }
              for (var k in value) {
                if (hasCall.call(value, k)) { copy[k] = g['structuredClone'](value[k]); }
              }
              return copy;
            };
          }
          if (g['crypto'] && !g.crypto['randomUUID']) {
            try {
              Object.defineProperty(g.crypto, 'randomUUID', { value: function () {
                var b = new Uint8Array(16);
                g.crypto.getRandomValues(b);
                b[6] = (b[6] & 0x0f) | 0x40;
                b[8] = (b[8] & 0x3f) | 0x80;
                var h = [];
                for (var i = 0; i < 16; i++) {
                  var v = b[i].toString(16);
                  if (v.length === 1) { v = '0' + v; }
                  h.push(v);
                }
                return h[0] + h[1] + h[2] + h[3] + '-' + h[4] + h[5] + '-' + h[6] + h[7] + '-' + h[8] + h[9] + '-' + h[10] + h[11] + h[12] + h[13] + h[14] + h[15];
              }, configurable: true, writable: true });
            } catch (e) {}
          }
        })();
        `}
      </Script>
        <BackgroundAnimation />
        <ThemeProvider defaultTheme="system">
          <PiNetworkProvider>
            <SocialProvider>
            <AddressProvider>
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
            </AddressProvider>
            </SocialProvider>
          </PiNetworkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
