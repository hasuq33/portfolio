import { cookies } from 'next/headers';
import { redirect } from "next/navigation";
import AppsGrid from '@/components/web/AppGrid';
import StatusBar from '@/components/web/StatusBar';

export default async function DashboardPage() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get("access_token");


  if (!token) {
    redirect("/web/login");
  }

  return (
    <div>
        <StatusBar />
        <AppsGrid />
    </div>
  );
}
