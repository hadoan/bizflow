export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="mt-2 text-gray-600">Manage invoices and receipts</p>
        </div>
        <button className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
          Upload Receipt
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button className="border-b-2 border-primary-600 px-4 py-2 text-primary-600">
          Invoices
        </button>
        <button className="px-4 py-2 text-gray-600 hover:text-gray-900">Receipts</button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
        </div>
        <div className="p-6">
          <div className="text-center">
            <p className="text-gray-500">No invoices yet</p>
            <button className="mt-4 text-primary-600 hover:text-primary-700">
              Create your first invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
