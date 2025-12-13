import Link from "next/link";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { getCurrentUserWithSpace } from "@/lib/auth";
import { getTaxOverview } from "@/modules/finance/services";
import { getOpenInboxItems } from "@/modules/tasks/services";
import { TaxPeriodType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
          <h1 className="heading-1 text-ink-900">
            {getGreeting()}, {user.name ?? "there"}
          </h1>
          <p className="mt-2 text-slate-600">Your Bizflow Personal overview</p>
        </div>
        <Link
          href="/personal/inbox"
          className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Go to Inbox <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary-600" />
                </div>
                <h3 className="text-sm font-medium text-slate-600">Income vs expenses</h3>
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold font-numeric text-ink-900">
              {formatCurrency(monthlyOverview.netProfit)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Income {formatCurrency(monthlyOverview.income)} · Expenses{" "}
              {formatCurrency(monthlyOverview.expenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-warning-100 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-warning-700" />
                </div>
                <h3 className="text-sm font-medium text-slate-600">Tax to set aside</h3>
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold font-numeric text-ink-900">
              {formatCurrency(monthlyOverview.vatDue)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Based on this month&apos;s VAT difference
            </p>
          </CardContent>
        </Card>

        <Link href="/personal/inbox">
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-success-100 flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-success-600" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-600">Inbox items</h3>
                </div>
              </div>
              <p className="mt-4 text-3xl font-semibold font-numeric text-ink-900">
                {openInboxItems.length}
              </p>
              <p className="mt-2 text-sm text-primary-600 font-medium">Review your inbox →</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-ink-900">Today&apos;s focus</CardTitle>
              <Link
                href="/personal/inbox"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View inbox
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {focusItems.length === 0 ? (
              <p className="text-sm text-slate-500">No open inbox items — you&apos;re all caught up.</p>
            ) : (
              focusItems.map((item) => (
                <Link
                  key={item.id}
                  href="/personal/inbox"
                  className="flex items-start justify-between rounded-xl border border-slate-200 px-4 py-3 transition-all hover:border-primary-200 hover:bg-primary-50 hover:shadow-sm"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                    {item.description && (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary-600 shrink-0 ml-2" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-ink-900">Quick links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              className="block text-sm text-primary-600 hover:text-primary-700 font-medium"
              href="/personal/documents"
            >
              Upload a document →
            </Link>
            <Link
              className="block text-sm text-primary-600 hover:text-primary-700 font-medium"
              href="/personal/clients"
            >
              Add a client →
            </Link>
            <Link
              className="block text-sm text-primary-600 hover:text-primary-700 font-medium"
              href="/personal/tax"
            >
              View tax overview →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
