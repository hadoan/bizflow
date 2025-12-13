import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Calculator, Boxes } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary-50 to-white p-4">
      <div className="max-w-4xl text-center">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo/bizflow-mark.svg"
            alt="Bizflow"
            width={80}
            height={80}
          />
        </div>
        <h1 className="heading-1 mb-4 text-6xl text-ink-900">Bizflow</h1>
        <p className="mb-4 text-2xl font-medium text-primary-600">Run your business. In flow.</p>
        <p className="mb-12 text-lg text-slate-600">
          The intelligent back office for freelancers and solo founders in Germany
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="px-8 py-3">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="px-8 py-3">
              Get Started
            </Button>
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-3 flex justify-center">
                <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-ink-900">Finance & Tax</h3>
              <p className="text-slate-600">
                Invoices, receipts, and automated tax calculations for German regulations
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="mb-3 flex justify-center">
                <div className="h-12 w-12 rounded-xl bg-success-100 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-success-600" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-ink-900">AI-Powered</h3>
              <p className="text-slate-600">
                Intelligent categorisation, insights, and automated workflows
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="mb-3 flex justify-center">
                <div className="h-12 w-12 rounded-xl bg-warning-100 flex items-center justify-center">
                  <Boxes className="h-6 w-6 text-warning-700" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-ink-900">All-in-One</h3>
              <p className="text-slate-600">CRM, tasks, documents, and inbox in one place</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
