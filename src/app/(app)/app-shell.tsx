"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { personalSpaceConfig } from "@/spaces";
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
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bizflow</h1>
            <p className="text-xs text-gray-500">Personal</p>
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="h-4 w-4" />
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
      <aside className="w-80 border-l border-gray-200 bg-white">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Copilot Panel</h3>
        </div>
        <div className="flex h-full items-center justify-center p-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">Copilot panel coming soon</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
