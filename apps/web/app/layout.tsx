import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProfileModalProvider } from "@/components/UserProfileModalProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "uDeets — Your Community Hub",
  description: "A mobile-first community hub for local updates, events, and connection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          <UserProfileModalProvider>
            <div className="app-shell flex min-h-screen flex-col">{children}</div>
          </UserProfileModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
