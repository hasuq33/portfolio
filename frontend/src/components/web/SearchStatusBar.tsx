'use client';
import ProfileDropdown from "./ProfileDropdown";
import { useUser } from "@/context/UserContext";
import { ThemeToggler } from "../ThemeToggler";
import { ViewSearchInputBox } from "../SearchBox/SearchBox";


export const SearchStatusBar = () => {
  const {user, loading} = useUser();
  if(loading){
    return <div className="h-12 animate-pulse bg-muted/40 rounded-md"/>
  }

  if(!user) return 

  return (
    <div className="flex lg:flex-row flex-col justify-between items-center gap-4 px-4 py-3  bg-background">
      <div className="flex-1 hidden lg:block"></div>
      <div className="flex justify-center flex-1">
        <ViewSearchInputBox />
      </div>
      {/* This should be stay left  */}
      <div className="flex flex-1 items-center flex-row justify-end gap-x-3 px-3 py-3">
          <span className="text-sm hidden lg:block">
            Welcome, <span className="text-foreground font-medium">{user?.name || user.login}</span>
          </span>
          <ProfileDropdown user={user} Class="hidden"/>
          <ThemeToggler propsClass="lg:block hidden"/>
      </div>
    </div>
  )
}