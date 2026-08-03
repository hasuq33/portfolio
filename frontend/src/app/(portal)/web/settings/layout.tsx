

import SideBar from "@/components/web/SideBar";
import { ReactNode } from "react";
import { FiSettings, FiUser } from "react-icons/fi";
import { SearchStatusBar } from "@/components/web/SearchStatusBar";

interface SettingLayoutProps {
    children: ReactNode
}

export default function SettingLayout({children}:SettingLayoutProps){

    const menus = [
        {
            sequence: 1,
            name: "Settings",
            href: "/web/settings",
            icon: <FiSettings />
        },
        {
            sequence: 2,
            name: "Users",
            href: "/web/settings/users",
            icon: <FiUser />
        }
    ];


    return (
        <div className="flex h-full overflow-hidden ">
            <SideBar menus={menus} menuTitle="Settings"/>

            <div className="main-layout flex-1 flex flex-col relative overflow-y-scroll" >
                <div className="ht-searchbar-status sticky top-0 z-40">
                    <SearchStatusBar />
                </div>

                <div className="p-1">
                    {children}
                </div>
            </div>
        </div>
    )
}
