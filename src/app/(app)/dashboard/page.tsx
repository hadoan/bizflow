import Link from "next/link";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { getCurrentUserWithSpace } from "@/lib/auth";
import { getTaxOverview } from "@/modules/finance/services";
import { getOpenInboxItems } from "@/modules/tasks/services";
import { TaxPeriodType } from "@prisma/client";

function formatCurrency(value: number, currency = "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const { user, space } = await getCurrentUserWithSpace();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [monthlyOverview, openInboxItems] = await Promise.all([
    getTaxOverview(space.id, currentYear, TaxPeriodType.MONTH, currentMonth),
    getOpenInboxItems(space.id),
  ]);

  const focusItems = openInboxItems.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {user.name ?? "there"}
          </h1>
          <p className="mt-2 text-gray-600">Your Bizflow Personal overview</p>
        </div>
        <Link
          href="/personal/inbox"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Go to Inbox &rarr;
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Income vs expenses (this month)</h3>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-gray-900">
            {formatCurrency(monthlyOverview.netProfit)}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Income {formatCurrency(monthlyOverview.income)} &middot; Expenses{" "}
            {formatCurrency(monthlyOverview.expenses)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Estimated tax to set aside</h3>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-gray-900">
            {formatCurrency(monthlyOverview.vatDue)}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Based on this month&apos;s VAT difference (collected vs paid)
          </p>
        </div>

        <Link
          href="/personal/inbox"
          className="rounded-lg border border-gray-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Inbox items open</h3>
            <ArrowRight className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-gray-900">
            {openInboxItems.length}
          </p>
          <p className="mt-2 text-sm text-blue-600">Review items in your inbox</p>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Today&apos;s focus</h3>
            <Link
              href="/personal/inbox"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View inbox
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {focusItems.length === 0 ? (
              <p className="text-sm text-gray-500">No open inbox items — you&apos;re all caught up.</p>
            ) : (
              focusItems.map((item) => (
                <Link
                  key={item.id}
                  href="/personal/inbox"
                  className="flex items-start justify-between rounded-lg border border-gray-200 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    {item.description && (
                      <p className="mt-1 text-xs text-gray-600 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick links</h3>
          <div className="space-y-3 text-sm">
            <Link className="text-blue-600 hover:text-blue-700" href="/personal/documents">
              Upload a document
            </Link>
            <Link className="text-blue-600 hover:text-blue-700" href="/personal/clients">
              Add a client
            </Link>
            <Link className="text-blue-600 hover:text-blue-700" href="/personal/tax">
              View tax overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
