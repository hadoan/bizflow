"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { InboxItem, InboxItemType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ArrowRight, FileText, Inbox, Loader2, Receipt, Tags } from "lucide-react";

type AISuggestion = {
  category?: string;
  vatRate?: number;
  explanation?: string;
};

type InboxMetadata = {
  aiSuggestion?: AISuggestion;
} | null;

type InboxItemWithMeta = Omit<InboxItem, "metadata"> & { metadata?: InboxMetadata };

type ReceiptDetail = {
  id: string;
  vendorName: string;
  grossAmount: number;
  netAmount: number;
  vatAmount: number;
  currency: string;
  documentDate: string;
  category?: string | null;
  vatRate?: number | null;
};

type InvoiceDetail = {
  id: string;
  number: string;
  clientId: string;
  issueDate: string;
  netAmount: number;
  vatAmount: number;
  currency: string;
  status: string;
};

export default function InboxPage() {
  const [items, setItems] = useState<InboxItemWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<InboxItemWithMeta | null>(null);
  const [receiptDetail, setReceiptDetail] = useState<ReceiptDetail | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/inbox");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to load inbox");
        }
        const data = (await res.json()) as InboxItemWithMeta[];
        setItems(data);
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Could not load inbox items";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    return items.reduce<Record<string, InboxItemWithMeta[]>>((acc, item) => {
      const key = item.type;
      acc[key] = acc[key] ? [...acc[key], item] : [item];
      return acc;
    }, {});
  }, [items]);

  const openItem = async (item: InboxItemWithMeta) => {
    setSelected(item);
    setReceiptDetail(null);
    setInvoiceDetail(null);
    setDetailLoading(true);
    setOpen(true);

    try {
      if (item.relatedEntityType === "Receipt" && item.relatedEntityId) {
        const res = await fetch(`/api/receipts/${item.relatedEntityId}`);
        if (res.ok) {
          const receipt = (await res.json()) as ReceiptDetail;
          setReceiptDetail(receipt);
        }
      } else if (item.relatedEntityType === "Invoice" && item.relatedEntityId) {
        const res = await fetch(`/api/invoices/${item.relatedEntityId}`);
        if (res.ok) {
          const invoice = (await res.json()) as InvoiceDetail;
          setInvoiceDetail(invoice);
        }
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const aiSuggestion = selected?.metadata?.aiSuggestion ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
        <p className="mt-2 text-gray-600">Review and process items that need your attention</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Open Items</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
              {loading ? "…" : `${items.length} items`}
            </span>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading inbox…
            </div>
          ) : error ? (
            <p className="text-center text-sm text-red-600">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-500">Your inbox is empty</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([type, groupItems]) => (
                <div key={type} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{type.replaceAll("_", " ")}</Badge>
                    <span className="text-sm text-gray-500">{groupItems.length} items</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {groupItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => openItem(item)}
                        className="flex flex-col items-start rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow"
                      >
                        <div className="flex w-full items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-blue-50 p-2 text-blue-600">
                              {item.type === InboxItemType.RECEIPT_REVIEW ? (
                                <Receipt className="h-4 w-4" />
                              ) : (
                                <Inbox className="h-4 w-4" />
                              )}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                              {item.description && (
                                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          {item.relatedEntityType && (
                            <>
                              <span>&middot;</span>
                              <span>{item.relatedEntityType}</span>
                            </>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selected?.title ?? "Inbox item"}</SheetTitle>
            <SheetDescription>
              {selected?.description ?? "Review the details for this inbox item."}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {detailLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading details…
              </div>
            ) : (
              <>
                {receiptDetail && (
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Receipt className="h-4 w-4" />
                      Receipt
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                      <div className="flex items-center justify-between">
                        <span>Vendor</span>
                        <span className="font-medium">{receiptDetail.vendorName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Date</span>
                        <span className="font-medium">
                          {new Date(receiptDetail.documentDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Amount</span>
                        <span className="font-medium">
                          {receiptDetail.currency} {Number(receiptDetail.grossAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-md bg-gray-50 p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Tags className="h-4 w-4" />
                        AI suggestion
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-700">
                        <p>
                          Category:{" "}
                          <span className="font-medium">
                            {aiSuggestion?.category ?? "General expense"}
                          </span>
                        </p>
                        <p>
                          VAT:{" "}
                          <span className="font-medium">
                            {aiSuggestion?.vatRate
                              ? `${(aiSuggestion.vatRate * 100).toFixed(0)}%`
                              : "Standard (19%)"}
                          </span>
                        </p>
                        {aiSuggestion?.explanation && (
                          <p className="text-xs text-gray-500">{aiSuggestion.explanation}</p>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" disabled>
                          Apply suggestion
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/personal/inbox">Open inbox</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {invoiceDetail && (
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <FileText className="h-4 w-4" />
                      Invoice
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                      <div className="flex items-center justify-between">
                        <span>Number</span>
                        <span className="font-medium">{invoiceDetail.number}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Date</span>
                        <span className="font-medium">
                          {new Date(invoiceDetail.issueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Amount</span>
                        <span className="font-medium">
                          {invoiceDetail.currency}{" "}
                          {Number(invoiceDetail.netAmount + invoiceDetail.vatAmount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Status</span>
                        <span className="font-medium">{invoiceDetail.status}</span>
                      </div>
                    </div>
                  </div>
                )}

                {!detailLoading && !receiptDetail && !invoiceDetail && (
                  <p className="text-sm text-gray-500">
                    No linked document details available for this item.
                  </p>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
