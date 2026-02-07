"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import {
  LayoutGrid,
  ShoppingCart,
  FolderKanban,
  Users,
  FileText,
  Settings,
} from "lucide-react";
import { FaHandshakeSimple } from "react-icons/fa6";

const apps = [
  { name: "Dashboard", icon: LayoutGrid, href: "/dashboard/home", accent: "from-blue-500 to-indigo-500" },
  {name:"CRM",icon: FaHandshakeSimple,href:"/dashboard/crm", accent: "from-teal-500 to-cyan-500" },
  { name: "Sales", icon: ShoppingCart, href: "/dashboard/sales", accent: "from-emerald-500 to-green-500" },
  { name: "Projects", icon: FolderKanban, href: "/dashboard/projects", accent: "from-purple-500 to-fuchsia-500" },
  { name: "HR", icon: Users, href: "/dashboard/hr", accent: "from-pink-500 to-rose-500" },
  { name: "Blog", icon: FileText, href: "/dashboard/blog", accent: "from-orange-500 to-amber-500" },
  { name: "Settings", icon: Settings, href: "/web/settings", accent: "from-zinc-500 to-zinc-700" },
];

export default function AppsGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  /* ENTRY ANIMATION */
  useEffect(() => {
    if (!gridRef.current) return;

    gsap.fromTo(
      gridRef.current.children,
      { opacity: 0, y: 30, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.08,
      }
    );
  }, []);

  /* CURSOR GLASS REFLECTION */
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  /* CLICK ZOOM TRANSITION */
  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    const card = e.currentTarget;

    gsap.to(card, {
      scale: 1.15,
      opacity: 0,
      duration: 0.35,
      ease: "power3.inOut",
      onComplete: () => router.push(href),
    });
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div
        ref={gridRef}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8"
      >
        {apps.map((app) => (
          <Link
            key={app.name}
            href={app.href}
            onMouseMove={handleMouseMove}
            onClick={(e) => handleClick(e, app.href)}
            className="
              group relative rounded-2xl p-6
              flex flex-col items-center gap-4

              backdrop-blur-lg
              bg-white/10 dark:bg-white/10

              shadow-md hover:shadow-2xl
              transition-all duration-300

              ring-1 ring-white/20 dark:ring-white/10
            "
          >
            {/* Cursor Reflection */}
            <div
              className="
                pointer-events-none absolute inset-0 rounded-2xl
                opacity-0 group-hover:opacity-100
                transition duration-300
              "
              style={{
                background:
                  "radial-gradient(180px circle at var(--x) var(--y), rgba(255,255,255,0.25), transparent 60%)",
              }}
            />

            {/* Pulse Glow */}
            <div className="
              pointer-events-none absolute inset-0 rounded-2xl
              opacity-0 group-hover:opacity-100
              animate-pulse
              bg-gradient-to-br from-primary/10 to-transparent
            " />

            {/* Icon */}
            <div
              className={`
                relative z-10 h-16 w-16 rounded-2xl
                bg-gradient-to-br ${app.accent}
                flex items-center justify-center
                text-white shadow-lg
                group-hover:-translate-y-1
                group-hover:scale-110
                transition-transform duration-300
              `}
            >
              <app.icon size={28} />
            </div>

            {/* Label */}
            <span className="
              relative z-10
              text-sm font-medium
              text-muted-foreground
              group-hover:text-foreground
              transition
            ">
              {app.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
