'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';
import ProfileDropdown from "./ProfileDropdown";
import { useUser } from "@/context/UserContext";
import { ThemeToggler } from "../ThemeToggler";

interface SidebarItem {
  key: string;
  sequence: number;
  name: string;
  icon: React.ReactNode;
  href?: string;
}

interface SideBarProps {
  menus: SidebarItem[];
  menuTitle: string;
}

const SideBar: React.FC<SideBarProps> = ({
  menus,
  menuTitle = '',
}) => {
  const [collapsed, setCollapsed] = useState(false);
  
  const pathName = usePathname();

  // Dynamic title
  useEffect(() => {

    const currentMenu = menus.find(
      (item) => item.href === pathName
    );

    document.title =
      currentMenu?.name || menuTitle;

  }, [pathName, menus, menuTitle]);

  const {user, loading} = useUser();
  if(loading){
    return <div className="h-12 animate-pulse bg-muted/40 rounded-md"/>
  }

  if(!user) return

  const visibleMenus = menus.filter((menu) =>
    user.access.menuItemIds.includes(menu.key),
  );

  return (
    <aside
      className={`
        dark:bg-gray-900 dark:text-white
        transition-all duration-300 ease-in-out
        h-full
        ${collapsed ? 'w-16' : 'w-60'}
        border-r border-gray-300 dark:border-gray-700
        rounded-xl
        flex flex-col
      `}
    >

      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b dark:border-gray-700">

        {!collapsed && (
          <span className="font-semibold">
            {menuTitle}
          </span>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="dark:text-gray-400 dark:hover:text-white cursor-pointer"
        >
          ☰
        </button>

      </div>

      {/* Menus */}
      <nav className="flex flex-col justify-between flex-1 py-2 h-full">

        <div className="flex flex-col gap-y-2">

          {visibleMenus.map((menu) => (

            <Link
              key={menu.href ?? menu.key}
              href={menu.href || '#'}
              className={`
                flex items-center gap-3
                px-4 py-2
                hover:bg-gray-100
                dark:text-gray-300
                dark:hover:bg-gray-500
                dark:hover:text-white
                transition-colors

                ${menu.href === pathName
                  ? 'bg-gray-200 dark:bg-gray-800'
                  : ''
                }
              `}
            >

              <span className="text-lg">
                {menu.icon}
              </span>

              {!collapsed && (
                <span className="text-sm whitespace-nowrap">
                  {menu.name}
                </span>
              )}

            </Link>

          ))}

        </div>
        <div className='text-center'>
        <ProfileDropdown user={user} Class="flex items-center gap-3 mx-3 mb-3  px-4  hover:bg-gray-100   dark:text-gray-300   dark:hover:bg-gray-500   dark:hover:text-white   transition-colors  lg:hidden"/>
        <ThemeToggler propsClass={`lg:hidden  flex items-center gap-3   px-4  hover:bg-gray-100   dark:text-gray-300   dark:hover:bg-gray-500   dark:hover:text-white   transition-colors   `} />
        {/* Footer */}
        <Link
          href="/web"
          className="
            flex items-center gap-3
            px-4 py-2 mb-10
            hover:bg-gray-100
            dark:text-gray-300
            dark:hover:bg-gray-500
            dark:hover:text-white
            transition-colors
          "
        >

          <span className="text-lg">
            <FiLogOut />
          </span>

          {!collapsed && (
            <span className="text-sm whitespace-nowrap">
              Go to Dashboard
            </span>
          )}

        </Link>
        </div>

      </nav>

    </aside>
  );
};

export default SideBar;
