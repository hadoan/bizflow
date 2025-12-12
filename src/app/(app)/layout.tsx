import Link from "next/link";
import { AppHeader } from "./app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 border-r border-gray-200 bg-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Bizflow</h1>
          <p className="text-sm text-gray-500">Personal</p>
        </div>
        <nav className="space-y-1 px-3">
          <Link
            href="/dashboard"
            className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            Dashboard
          </Link>
          <Link
            href="/personal/inbox"
            className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            Inbox
          </Link>
          <Link
            href="/personal/documents"
            className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            Documents
          </Link>
          <Link
            href="/personal/tax"
            className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            Tax
          </Link>
          <Link
            href="/personal/clients"
            className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            Clients
          </Link>
        </nav>
      </aside>
      <main className="flex-1">
        <AppHeader />
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
