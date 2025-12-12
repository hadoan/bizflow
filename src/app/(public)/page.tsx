import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-900">Bizflow</h1>
        <p className="mb-8 text-2xl text-gray-600">AI-native business OS</p>
        <p className="mb-12 text-lg text-gray-500">
          The intelligent back office for freelancers and solo founders in Germany
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-primary-600 px-8 py-3 text-white hover:bg-primary-700 transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-gray-300 px-8 py-3 text-gray-700 hover:bg-gray-50 transition"
          >
            Get Started
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-2 text-xl font-semibold">Finance & Tax</h3>
            <p className="text-gray-600">
              Invoices, receipts, and automated tax calculations for German regulations
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-2 text-xl font-semibold">AI-Powered</h3>
            <p className="text-gray-600">
              Intelligent categorisation, insights, and automated workflows
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-2 text-xl font-semibold">All-in-One</h3>
            <p className="text-gray-600">CRM, tasks, documents, and inbox in one place</p>
          </div>
        </div>
      </div>
    </div>
  );
}
