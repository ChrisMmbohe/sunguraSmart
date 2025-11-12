// TypeScript
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SunguraSmart[SS]",
  description: "Rabbit Farm Digital Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      {/* suppressHydrationWarning prevents theme class mismatch warnings */}
      <html lang="en" suppressHydrationWarning>
        {/* Only static classes here; avoid any client-derived values on body */}
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {/* ThemeProvider must wrap the whole app and control html.class */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
