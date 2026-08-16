"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LifeBuoy, LogOut } from "lucide-react";
import { apiFetch } from "@/lib/orm_service";
import { getUserAvatarColor, getUserAvatarUrl, getUserInitial } from "@/lib/user-avatar";
import type { CurrentUser } from "@/context/UserContext";

type ProfileDropdownProps = {
  user?: CurrentUser;
  Class?:string
};

const ProfileDropdown = ({ user , Class }: ProfileDropdownProps) => {
  const initial = getUserInitial(user?.name, user?.login);
  const fallbackColor = getUserAvatarColor(user?.name, user?.login);
  const avatarVersion = user?.updatedAt ? new Date(user.updatedAt).getTime() : undefined;
  const avatarSrc = user?._id && user.hasAvatar
    ? getUserAvatarUrl(user._id, avatarVersion)
    : undefined;

  const clickLogout = async () => {
    await apiFetch({
      url: "/auth/logout",
      method: "POST",
    });

    // Full reload to clear auth + middleware state
    window.location.href = "/web/login";
  };

  return (
    <DropdownMenu >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost"className={`
            h-9 w-9 rounded-full p-0
            hover:bg-muted cursor-pointer
            focus-visible:ring-0 ${Class}`}>
          <Avatar className="h-9 w-9">
            {avatarSrc && (
              <AvatarImage
                src={avatarSrc}
                alt={`${user?.name?.trim() || user?.login || "User"} profile`}
                className="object-cover"
              />
            )}
            <AvatarFallback
              className={`${fallbackColor} text-xs font-medium`}>
              {initial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="
          w-64 rounded-xl shadow-xl

          /* LIGHT MODE */
          border border-gray-200
          backdrop-blur-sm

          /* DARK MODE */
          // dark:bg-background/80
          dark:border-white/10
          dark:backdrop-blur-xl 
        "
      >

        <DropdownMenuSeparator />

        {/* MAIN ACTIONS */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="
              gap-2 cursor-pointer
              hover:bg-muted/50
              dark:hover:bg-muted/40
            "
          >
            <User className="text-black dark:text-white" size={16} />
            Profile
          </DropdownMenuItem>

          <DropdownMenuItem
            className="
              gap-2 cursor-pointer
              hover:bg-muted/50
              dark:hover:bg-muted/40
            "
          >
            <Settings className="text-black dark:text-white" size={16} />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="
            gap-2 cursor-pointer
            hover:bg-muted/50
            dark:hover:bg-muted/40
          "
        >
          <LifeBuoy className="text-black dark:text-white" size={16} />
          Support
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* LOGOUT */}
        <DropdownMenuItem
          onClick={clickLogout}
          className="
            gap-2 cursor-pointer
            text-destructive
            hover:bg-destructive/10
            focus:text-destructive
          "
        >
          <LogOut  className="text-black dark:text-white" size={16} />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
