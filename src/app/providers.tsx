"use client";

import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <SessionProvider>
        {children}
        <Toaster
          position="top-center"
          expand={true}
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "bg-popover border border-border shadow-lg",
              title: "text-popover-foreground font-medium",
              description: "text-muted-foreground",
            },
            style: {
              zIndex: 100,
            },
          }}
          style={{
            zIndex: 100,
          }}
        />
      </SessionProvider>
    </ThemeProvider>
  );
}
