'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface SidebarItem {
  name: string;
  icon: React.ReactNode;
  href?: string;
}

interface SideBarProps {
  menus: SidebarItem[];
}

const SideBar: React.FC<SideBarProps> = ({ menus }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        h-screen bg-gray-900 text-white
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-60'}
        flex flex-col
      `}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-700">
        {!collapsed && <span className="font-semibold">Dashboard</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white"
        >
          ☰
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-2">
        {menus.map((menu, index) => (
          <Link
            key={index}
            href={menu.href || '#'}
            className="
              flex items-center gap-3 px-4 py-2
              text-gray-300 hover:bg-gray-800 hover:text-white
              transition-colors
            "
          >
            <span className="text-lg">{menu.icon}</span>
            {!collapsed && (
              <span className="text-sm whitespace-nowrap">
                {menu.name}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default SideBar;
