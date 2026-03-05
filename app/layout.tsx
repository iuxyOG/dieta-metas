import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      <body className={`${inter.variable} min-h-screen`}>{children}</body>
    </html>
  );
}
