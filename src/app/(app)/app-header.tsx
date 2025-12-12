"use client";

import { useSession, signOut } from "next-auth/react";

export function AppHeader() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-gray-200 bg-white px-8 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {session?.user?.name ? `Welcome back, ${session.user.name}` : "Welcome back"}
        </h2>
        <div className="flex items-center gap-4">
          {session?.user && (
            <span className="text-sm text-gray-600">{session.user.email}</span>
          )}
          <button className="text-sm text-gray-600 hover:text-gray-900">Settings</button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
