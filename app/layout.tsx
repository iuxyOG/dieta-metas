import type { Metadata } from "next";
import localFont from "next/font/local";

import { AppBottomNav } from "@/components/AppBottomNav";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dietas Da Jhullya",
  description: "Painel de dieta da Jullya",
  icons: {
    icon: "/heart.svg",
    shortcut: "/heart.svg",
    apple: "/heart.svg",
  },
};

const themeInitializer = `
(() => {
  try {
    const theme = localStorage.getItem("calorias.theme.v1");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen`}>
        {children}
        <AppBottomNav />
      </body>
    </html>
  );
}
