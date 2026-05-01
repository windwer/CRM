"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Users, FileText, Settings, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useOutlook } from "@/hooks/useOutlook";

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
  const { status } = useOutlook();

  const isDisconnected = status?.connected && status?.sync_status === "disconnected";

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

      {/* Outlook reconnect badge — only shown when token has expired */}
      {isDisconnected && (
        <div className="border-t border-slate-800 px-2 py-3">
          <Link
            href="/dashboard/settings?tab=integrations"
            title={t("reconnectRequired")}
            className="group flex items-center justify-between rounded-md px-2 py-2 text-sm font-medium text-amber-300 hover:bg-slate-800 hover:text-amber-200"
          >
            <span className="flex items-center">
              <RefreshCw className="mr-3 h-5 w-5 flex-shrink-0 text-amber-400 group-hover:text-amber-300" />
              {t("syncOutlook")}
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-label={t("reconnectRequired")} />
          </Link>
        </div>
      )}
    </div>
  );
}
