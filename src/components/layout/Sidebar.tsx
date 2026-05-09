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
    <div className="hidden border-r border-primary-700 bg-primary text-white md:flex md:w-64 md:flex-col">
      <div className="flex h-14 items-center border-b border-white/10 px-4 py-4">
        <h2 className="text-lg font-bold tracking-tight text-white">SmartCRM</h2>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.labelKey}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md border-l-4 px-2 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-accent bg-white/10 text-white"
                  : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-white" : "text-white/60 group-hover:text-white/80"
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
        <div className="border-t border-white/10 px-2 py-3">
          <Link
            href="/dashboard/settings?tab=integrations"
            title={t("reconnectRequired")}
            className="group flex items-center justify-between rounded-md border border-white/30 px-2 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            <span className="flex items-center">
              <RefreshCw className="mr-3 h-5 w-5 flex-shrink-0 text-accent" />
              {t("syncOutlook")}
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-label={t("reconnectRequired")} />
          </Link>
        </div>
      )}
    </div>
  );
}
