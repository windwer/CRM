"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Users, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const navItems = [
  { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "offers", href: "/dashboard/offers", icon: Briefcase },
  { labelKey: "candidates", href: "/dashboard/candidates", icon: Users },
  { labelKey: "applications", href: "/dashboard/applications", icon: FileText },
  { labelKey: "settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <div className="hidden border-r bg-slate-900 text-slate-100 md:flex md:w-64 md:flex-col">
      <div className="flex h-14 items-center border-b border-slate-800 px-4 py-4">
        <h2 className="text-lg font-bold tracking-tight">AntiGravity</h2>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.labelKey}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-2 py-2 text-sm font-medium",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-slate-300" : "text-slate-400 group-hover:text-slate-300"
                )}
                aria-hidden="true"
              />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
