"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Calculator, FileText, Home, Inbox, Settings, Users } from "lucide-react";
import { AppHeader } from "./app-header";

type NavItem = {
  name: string;
  href: Route;
  icon: typeof Home;
};

const navigation: NavItem[] = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Inbox", href: "/personal/inbox", icon: Inbox },
  { name: "Documents", href: "/personal/documents", icon: FileText },
  { name: "Clients", href: "/personal/clients", icon: Users },
  { name: "Tax & Reports", href: "/personal/tax", icon: Calculator },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({
  session,
  children,
}: {
  session: Session;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-cloud-100">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
          <Image
            src="/logo/bizflow-mark.svg"
            alt="Bizflow"
            width={32}
            height={32}
            className="shrink-0"
          />
          <div>
            <h1 className="heading-2 text-base text-ink-900">Bizflow</h1>
            <p className="text-xs text-slate-600">Personal</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary-700 shadow-sm"
                    : "text-slate-700 hover:bg-cloud-100 hover:text-ink-900"
                )}
              >
                <item.icon className="h-4 w-4" strokeWidth={2} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <AppHeader session={session} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>

      {/* Right Sidebar Placeholder for Copilot */}
      <aside className="w-80 border-l border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-center border-b border-slate-200">
          <h3 className="text-sm font-medium text-ink-900">Copilot Panel</h3>
        </div>
        <div className="flex h-full items-center justify-center p-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-cloud-100 flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">Copilot panel coming soon</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
