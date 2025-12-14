"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Calculator, FileText, Home, Inbox, Settings, Users, Bot } from "lucide-react";
import { AppHeader } from "./app-header";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";

type NavItem = {
  name: string;
  href: Route;
  icon: typeof Home;
};

const navigation: NavItem[] = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Inbox", href: "/personal/inbox", icon: Inbox },
  { name: "Expense Assistant", href: "/personal/expenses/copilot", icon: Bot },
  { name: "Expenses", href: "/personal/expenses", icon: FileText },
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
  const [spaces, setSpaces] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [activeSpace, setActiveSpace] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const res = await fetch("/api/workspaces");
        if (!res.ok) return;
        const data = await res.json();
        setSpaces(data.workspaces ?? []);
        const active = data.defaultSpaceId || data.workspaces?.[0]?.id || null;
        setActiveSpace(active);
      } catch (err) {
        console.error("Failed to load spaces", err);
      }
    };
    fetchSpaces();
  }, []);

  const handleSelectSpace = async (spaceId: string) => {
    setSelecting(true);
    try {
      const res = await fetch("/api/workspaces/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId }),
      });
      if (res.ok) {
        setActiveSpace(spaceId);
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to switch space", err);
    } finally {
      setSelecting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-cloud-100">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col">
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
        <div className="mt-auto border-t border-slate-200 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between rounded-xl border-slate-300"
                disabled={spaces.length === 0}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {(spaces.find((s) => s.id === activeSpace)?.name || "WS")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-ink-900">
                      {spaces.find((s) => s.id === activeSpace)?.name || "Select workspace"}
                    </span>
                    <span className="text-xs text-slate-600">{session.user?.email}</span>
                  </div>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-64">
              <DropdownMenuLabel className="text-xs text-slate-500">Business</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/settings">Business details</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-slate-500">Your spaces</DropdownMenuLabel>
              {spaces.map((space) => (
                <DropdownMenuItem
                  key={space.id}
                  onClick={() => handleSelectSpace(space.id)}
                  className={cn("flex items-center gap-2", {
                    "bg-primary-50 text-primary-700": space.id === activeSpace,
                  })}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{space.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{space.name}</span>
                  {selecting && space.id === activeSpace && (
                    <span className="ml-auto text-xs text-slate-500">Switching...</span>
                  )}
                </DropdownMenuItem>
              ))}
              {spaces.length === 0 && (
                <DropdownMenuItem disabled className="text-xs text-slate-500">
                  No workspaces yet
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/api/auth/signout">Sign out</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
    </div>
  );
}
