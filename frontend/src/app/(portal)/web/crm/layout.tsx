import type { ReactNode } from "react";
import { FiTarget, FiTrendingUp } from "react-icons/fi";
import SideBar from "@/components/web/SideBar";
import { SearchStatusBar } from "@/components/web/SearchStatusBar";
import { CRM_MENU_ITEMS } from "@/config/navigation";

export default function CrmLayout({ children }: { children: ReactNode }) {
  const menus = CRM_MENU_ITEMS.map((menu, index) => ({
    key: "crm",
    sequence: index + 1,
    name: menu.label,
    href: menu.href,
    icon: index ? <FiTrendingUp /> : <FiTarget />,
  }));
  return (
    <div className="flex h-full overflow-hidden">
      <SideBar menus={menus} menuTitle="CRM" />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="z-40 shrink-0">
          <SearchStatusBar />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-1">{children}</div>
      </div>
    </div>
  );
}
