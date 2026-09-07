

import SideBar from "@/components/web/SideBar";
import { ReactNode } from "react";
import { FiBriefcase, FiSettings, FiUser, FiUsers } from "react-icons/fi";
import { SearchStatusBar } from "@/components/web/SearchStatusBar";
import { SETTINGS_MENU_ITEMS } from "@/config/navigation";

interface SettingLayoutProps {
    children: ReactNode
}

export default function SettingLayout({children}:SettingLayoutProps){

    const icons = {
        settings: <FiSettings />,
        users: <FiUser />,
        companies: <FiBriefcase />,
        groups: <FiUsers />,
    };
    const menus = SETTINGS_MENU_ITEMS.map((menu, index) => ({
        key: menu.key,
        sequence: index + 1,
        name: menu.label,
        href: menu.href,
        icon: icons[menu.key as keyof typeof icons],
    }));


    return (
        <div className="flex h-full overflow-hidden ">
            <SideBar menus={menus} menuTitle="Settings"/>

            <div className="main-layout relative flex min-w-0 flex-1 flex-col overflow-hidden" >
                <div className="ht-searchbar-status z-40 shrink-0">
                    <SearchStatusBar />
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-1">
                    {children}
                </div>
            </div>
        </div>
    )
}
