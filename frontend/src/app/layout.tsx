import type { Metadata } from "next";
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
export const metadata: Metadata = {
  title: "Harshiv Joshi | Odoo Developer, MERN & Next.js Expert",
  description:
    "Harshiv Joshi is a Full Stack Developer specializing in Odoo ERP, OWL framework, and modern web technologies like React and Next.js. Currently working at BrowseInfo, building scalable ERP and web solutions. Passionate about AI, open-source, and creating impactful software.",
  keywords: [
    "Harshiv Joshi",
    "Odoo Developer",
    "Odoo Expert",
    "OWL JS",
    "OWL Framework Expert",
    "React Developer",
    "Next.js Developer",
    "Full Stack Developer",
    "MERN Stack",
    "PostgreSQL",
    "ERP Developer",
    "Odoo ORM",
    "Odoo Custom Module",
    "Web Developer",
    "Frontend Developer",
    "Backend Developer",
    "Odoo Website Developer",
    "AI Enthusiast",
    "Open Source Contributor",
    "Software Engineer",
    "Odoo 17",
    "Odoo ERP Specialist"
  ],
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const noLayoutPath = ['/projects'];
  // const route = useRouter();
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
