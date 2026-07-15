'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';
import ProfileDropdown from "./ProfileDropdown";
import { useUser } from "@/context/UserContext";
import { ThemeToggler } from "../ThemeToggler";

interface SidebarItem {
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

          {menus.map((menu, index) => (

            <Link
              key={index}
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
        <ProfileDropdown user={user} Class="block lg:hidden"/>
        <ThemeToggler propsClass={`lg:hidden block`} />
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