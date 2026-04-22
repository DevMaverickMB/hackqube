import type { Metadata } from "next";
import { Sora, IBM_Plex_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import { RealtimeProvider } from "@/components/realtime-provider";
import "./globals.css";

const sora = Sora({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HackQube — AI Innovation Sprint",
  description: "16-day gamified AI innovation sprint platform for QubeSense",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <TooltipProvider>
            <RealtimeProvider>
              <Navbar />
              <main className="flex-1 pb-12">{children}</main>
            </RealtimeProvider>
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
