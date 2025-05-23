import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import StoreProvider from "@/store/storeprovider";
import Header from "@/components/header/header";
import { ThemeProvider } from "@/provider/themeprovider";
import { PostHogProvider } from '@/provider/posthog';
import {
  ClerkProvider
} from '@clerk/nextjs';
import { SideBar } from "@/components/header/sidebar/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { EventQueueProvider } from "@/provider/eventsqueue";
import { EventsCounterProvider } from "@/provider/eventcounterprovider";
import { DrawerProvider } from "@/provider/drawerprovider";
import { TutorialProvider } from "@/provider/tutorialprovider";
import { EventFilterProvider } from "@/provider/eventfilterprovider";
import { SettingsProvider } from "@/provider/settingsprovider";
import { MaxDaysOldProvider } from "@/provider/maxDaysOldProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Decko",
  description: "Your daily dose of fast news and events",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://fastnews-client.replit.app"),
  openGraph: {
    type: "website",
    title: "Decko",
    description: "Your daily dose of fast news and events",
    siteName: "Decko",
  },
  twitter: {
    card: "summary_large_image",
    title: "Decko",
    description: "Your daily dose of fast news and events",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_BASE_API_URL || "https://5b64a2fa-58ce-4cdc-b378-5748a0161589-00-6fth0df64qsc.kirk.replit.dev/"} />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
        >
          <StoreProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              disableTransitionOnChange
            >
              <EventFilterProvider>
                <MaxDaysOldProvider>
                  <EventQueueProvider>
                    <EventsCounterProvider>
                      <PostHogProvider>
                        <SettingsProvider>
                          <TutorialProvider>
                            <SidebarProvider>
                              <SideBar collapsible="icon" side="left" />
                              <SidebarInset >
                                <DrawerProvider>
                                  <Header />
                                  {children}
                                </DrawerProvider>
                              </SidebarInset>
                            </SidebarProvider>
                          </TutorialProvider>
                        </SettingsProvider>
                      </PostHogProvider>
                    </EventsCounterProvider>
                  </EventQueueProvider>
                </MaxDaysOldProvider>
              </EventFilterProvider>
            </ThemeProvider>
          </StoreProvider>
        </body>
        <Toaster />
      </html>
    </ClerkProvider>
  );
}