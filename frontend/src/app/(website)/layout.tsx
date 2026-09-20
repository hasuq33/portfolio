import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/theme_provider";
import NextTopLoader from 'nextjs-toploader';
import { cookies } from "next/headers";

const poppins = Poppins({
  weight: ['400', '700'], 
  subsets: ['latin'], 
  variable: '--font-poppins', 
  display: 'swap',
})

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const cookieStore = await cookies();

  const hasSession = Boolean(
    cookieStore.get("access_token")?.value ||
    cookieStore.get("refresh_token")?.value
  );

  return (
    <html lang="en" className={`dark ${poppins.variable}`} suppressHydrationWarning={true}>
        <body >
          <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
            <Header hasSession={hasSession}/>
            <NextTopLoader showSpinner={false} />
                  <main className="">{children}</main>
            <Footer />
            </ThemeProvider>
        </body>
    </html>
  );
}
