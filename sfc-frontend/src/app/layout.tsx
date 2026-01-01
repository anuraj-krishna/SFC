import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SFC Gym & Fitness Center",
  description: "Transform your body, elevate your mind. Join SFC for personalized fitness programs with expert guidance.",
  keywords: ["gym", "fitness", "workout", "training", "health", "exercise"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans min-h-screen bg-dark-950">
        {children}
      </body>
    </html>
  );
}

