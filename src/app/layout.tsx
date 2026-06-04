import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit}from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@/services/clerk/components/ClerkProvider";
import {ThemeProvider} from "next-themes";

const outfitSans = Outfit({
  variable: "--font-outfit-sans",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: {
    default: "Preper - AI-Powered Job & Interview Preparation",
    template: "%s | Preper",
  },
  description: "Accelerate your job search and ace technical and behavioral interviews. Get AI-powered resume analysis, realistic mock interviews, and tailored practice questions.",
  keywords: [
    "AI Interview Prep",
    "Mock Interview Simulator",
    "Resume Feedback ATS",
    "Technical Interview Practice",
    "Clerk Auth Nextjs",
    "Drizzle ORM Interview App",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://preper.io"),
  openGraph: {
    title: "Preper - AI-Powered Job & Interview Preparation",
    description: "Accelerate your job search and ace technical and behavioral interviews with real-time AI feedback.",
    url: "https://preper.io",
    siteName: "Preper",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Preper - AI-Powered Job & Interview Preparation",
    description: "Accelerate your job search and ace technical and behavioral interviews with real-time AI feedback.",
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
        <body
          className={`${outfitSans.variable} antialiased font-sans`}
        >
          <ThemeProvider 
            attribute="class" 
            defaultTheme="system" 
            enableColorScheme
            disableTransitionOnChange
            >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
