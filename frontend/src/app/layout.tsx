import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { AetherHeader } from "@/components/layout/aether-header";
import { ThemeProvider } from "@/contexts/theme-context";

export const metadata: Metadata = {
  title: "Aether - Media Knowledge Graph",
  description: "Knowledge graph-powered movie analytics, recommendations, and exploration.",
  keywords: ["movies", "knowledge graph", "analytics", "recommendations", "Neo4j"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex bg-background text-foreground antialiased transition-colors duration-300 font-sans tracking-tight">
        <ThemeProvider>
          {/* Left Sidebar */}
          <LeftSidebar />

          {/* Main Content Area */}
          <div className="flex flex-col flex-1 min-w-0 ml-72">
            {/* Aether Header - Consistent across all pages */}
            <AetherHeader />
            
            {/* Page Content */}
            <main className="flex-1 px-8 pb-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
