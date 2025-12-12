import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "./app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return <AppShell session={session}>{children}</AppShell>;
}
