import { ErrorProvider } from "@/components/ErrorProvider/ErrorProvider";

export default function RootLayout({children,}: Readonly<{
  children: React.ReactNode;}>) {
  return (<>{children}<ErrorProvider/></>);
}
