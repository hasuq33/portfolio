'use client';
import ProfileDropdown from "./ProfileDropdown";
import { useUser } from "@/context/UserContext";
import { ThemeToggler } from "../ThemeToggler";

const StatusBar = () => {
  const {user, loading} = useUser();
  if(loading){
    return <div className="h-12 animate-pulse bg-muted/40 rounded-md"/>
  }

  if(!user) return 

  return (
    <div className="flex items-center flex-row justify-end gap-x-3 px-3 py-3">
        <span className="text-sm">
          Welcome, <span className="text-foreground font-medium">{user?.name || user.login}</span>
        </span>
        <ProfileDropdown user={user}/>
        <ThemeToggler propsClass=""/>
    </div>
  )
}

export default StatusBar