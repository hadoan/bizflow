export default function TaxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tax Overview</h1>
        <p className="mt-2 text-gray-600">VAT and income tax calculations</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Current Quarter</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">Income</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">€0.00</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Expenses</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">€0.00</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">VAT Collected</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">€0.00</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">VAT Due</p>
            <p className="mt-1 text-2xl font-semibold text-green-600">€0.00</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Tax Periods</h2>
        </div>
        <div className="p-6">
          <p className="text-center text-gray-500">No tax periods configured yet</p>
        </div>
      </div>
    </div>
  );
}
