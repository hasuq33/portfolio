import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeProvider } from "@/components/theme_provider";
import NextTopLoader from "nextjs-toploader";
import "./global.css"
import { UserProvider } from "@/context/UserContext";
import { ViewSearchProvider } from "@/context/ViewSearchContext";

export default async function PortalLayout({children,}: {children: React.ReactNode;}) {
 const cookieStore = await cookies(); 
 const token = cookieStore.get("access_token");

  if (!token) {
    redirect("/web/login");
  }

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body >
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <NextTopLoader showSpinner={false} />
            <UserProvider>
              <ViewSearchProvider>
                <main className="h-screen overflow-hidden bg-gradient-to-br from-background via-muted/40 to-background">
                {children}
                
                </main>
              </ViewSearchProvider>
            </UserProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
