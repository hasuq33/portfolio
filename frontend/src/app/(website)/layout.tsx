import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/theme_provider";
import NextTopLoader from 'nextjs-toploader';
import {  } from "next/navigation";

const poppins = Poppins({
  weight: ['400', '700'], 
  subsets: ['latin'], 
  variable: '--font-poppins', 
  display: 'swap',
})

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <NextTopLoader showSpinner={false} />
                <main className="">{children}</main>
          <Footer />
          </ThemeProvider>
      </body>
    </html>
  );
}
