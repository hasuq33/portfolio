import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/theme_provider";
import NextTopLoader from 'nextjs-toploader';

const poppins = Poppins({
  weight: ['400', '700'], 
  subsets: ['latin'], 
  variable: '--font-poppins', 
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Harshiv Joshi",
  description: "Harshiv Joshi. I am a Odoo Developer in Browseinfo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${poppins.variable}`} suppressHydrationWarning={true}>
      <body >
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
          <Header />
          <NextTopLoader />
                <main className="">{children}</main>
          </ThemeProvider>
        <Footer />
      </body>
    </html>
  );
}
