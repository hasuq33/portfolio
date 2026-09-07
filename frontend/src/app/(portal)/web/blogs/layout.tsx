import type { ReactNode } from "react";
import { FileText, Tags } from "lucide-react";
import SideBar from "@/components/web/SideBar";
import { SearchStatusBar } from "@/components/web/SearchStatusBar";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return <div className="flex h-full overflow-hidden">
    <SideBar menuTitle="Blog" menus={[
      { key: "blogs", sequence: 1, name: "Blogs", href: "/web/blogs", icon: <FileText size={18} /> },
      { key: "blogs", sequence: 2, name: "Categories", href: "/web/blogs/categories", icon: <Tags size={18} /> },
    ]} />
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="z-40 shrink-0"><SearchStatusBar /></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1">{children}</div>
    </div>
  </div>;
}
