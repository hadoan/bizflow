export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="mt-2 text-gray-600">Manage your client relationships</p>
        </div>
        <button className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
          Add Client
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Clients</h2>
            <input
              type="search"
              placeholder="Search clients..."
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            />
          </div>
        </div>
        <div className="p-6">
          <div className="text-center">
            <p className="text-gray-500">No clients yet</p>
            <button className="mt-4 text-primary-600 hover:text-primary-700">
              Add your first client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
