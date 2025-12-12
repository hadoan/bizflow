import Link from "next/link";

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
        <header className="border-b border-gray-200 bg-white px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
            <div className="flex items-center gap-4">
              <button className="text-sm text-gray-600 hover:text-gray-900">Settings</button>
              <button className="text-sm text-gray-600 hover:text-gray-900">Logout</button>
            </div>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
