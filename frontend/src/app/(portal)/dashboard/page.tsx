import { cookies } from 'next/headers';
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get("access_token");


  if (!token) {
    redirect("/web/login");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to your portal</p>
    </div>
  );
}
