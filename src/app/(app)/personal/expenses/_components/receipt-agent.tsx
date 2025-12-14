"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, CheckCircle2, FileText, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseDraft {
  id: string;
  vendor: string;
  category: string;
  date: string;
  totalGross: number;
  currency: string;
  vatAmount: number | null;
  vatRate: number | null;
  paymentMethod: string | null;
  notes: string | null;
  projectLink: string | null;
  billable: boolean;
  confidence: {
    overall: number;
    vendor: number;
    date: number;
    amount: number;
    vat: number;
  };
  warnings: string[];
}

type AgentStatus = "idle" | "uploading" | "extracting" | "reviewing" | "ready" | "saving" | "error";

export function ReceiptAgent({ onExpenseSaved }: { onExpenseSaved?: () => void }) {
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [draft, setDraft] = useState<ExpenseDraft | null>(null);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state for editing draft
  const [formData, setFormData] = useState({
    vendor: "",
    category: "",
    date: "",
    amount: "",
    taxAmount: "",
    projectLink: "",
    billable: false,
    notes: "",
  });

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
    setStatus("idle");
  }, []);

  const handleUploadAndProcess = async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/expenses/process-receipt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process receipt");
      }

      const result = await response.json();

      setDraft(result.draft);
      setMessage(result.message);
      setStatus(result.status);

      // Populate form with draft data
      if (result.draft) {
        setFormData({
          vendor: result.draft.vendor,
          category: result.draft.category,
          date: result.draft.date,
          amount: result.draft.totalGross.toString(),
          taxAmount: result.draft.vatAmount?.toString() || "",
          projectLink: result.draft.projectLink || "",
          billable: result.draft.billable,
          notes: result.draft.notes || "",
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to process receipt");
      setStatus("error");
    }
  };

  const handleConfirm = async () => {
    if (!draft) return;

    setStatus("saving");
    setError(null);

    try {
      const updates = {
        vendor: formData.vendor,
        category: formData.category,
        amount: parseFloat(formData.amount),
        date: formData.date,
        taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
        projectLink: formData.projectLink || undefined,
        billable: formData.billable,
        notes: formData.notes || undefined,
      };

      const response = await fetch(`/api/expenses/drafts/${draft.id}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save expense");
      }

      // Success!
      setStatus("idle");
      setDraft(null);
      setMessage("");
      setSelectedFile(null);
      onExpenseSaved?.();
    } catch (err) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save expense");
      setStatus("error");
    }
  };

  const handleDiscard = async () => {
    if (!draft) return;

    try {
      await fetch(`/api/expenses/drafts/${draft.id}`, {
        method: "DELETE",
      });

      setStatus("idle");
      setDraft(null);
      setMessage("");
      setSelectedFile(null);
    } catch (err) {
      console.error("Discard error:", err);
    }
  };

  const handleEdit = () => {
    setStatus("reviewing");
  };

  return (
    <Card className="border-2 border-primary-200 bg-primary-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary-900">
          <FileText className="h-5 w-5" />
          Receipt → Expense Agent
        </CardTitle>
        <CardDescription>
          Upload a receipt and I&apos;ll extract the details for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File upload area */}
        {status === "idle" && (
          <div className="space-y-4">
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors",
                selectedFile
                  ? "border-primary-300 bg-primary-50"
                  : "border-slate-300 bg-white hover:border-primary-300 hover:bg-slate-50"
              )}
            >
              {selectedFile ? (
                <>
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary-600" />
                    <div>
                      <p className="font-medium text-ink-900">{selectedFile.name}</p>
                      <p className="text-sm text-slate-600">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="ml-2 rounded-full p-1 hover:bg-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <Button onClick={handleUploadAndProcess} className="mt-2">
                    <Upload className="mr-2 h-4 w-4" />
                    Process Receipt
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-slate-400" />
                  <div className="text-center">
                    <p className="font-medium text-ink-900">Upload a receipt</p>
                    <p className="text-sm text-slate-600">Image or PDF, max 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label htmlFor="receipt-upload">
                    <Button asChild variant="outline">
                      <span>Choose File</span>
                    </Button>
                  </label>
                </>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Processing states */}
        {(status === "uploading" || status === "extracting") && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <p className="text-sm text-slate-600">
              {status === "uploading" ? "Uploading receipt..." : "Reading receipt..."}
            </p>
          </div>
        )}

        {/* Draft review */}
        {draft && (status === "reviewing" || status === "ready" || status === "saving") && (
          <div className="space-y-4">
            {/* Agent message */}
            {message && (
              <div className="flex items-start gap-2 rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm text-primary-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* Warnings */}
            {draft.warnings.length > 0 && (
              <div className="space-y-1">
                {draft.warnings.map((warning, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"
                  >
                    <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Editable draft fields */}
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="draft-vendor">Vendor</Label>
                <Input
                  id="draft-vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData((p) => ({ ...p, vendor: e.target.value }))}
                  className={cn(
                    draft.confidence.vendor < 0.7 && "border-amber-300 bg-amber-50"
                  )}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="draft-category">Category</Label>
                <Input
                  id="draft-category"
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="draft-date">Date</Label>
                  <Input
                    id="draft-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                    className={cn(
                      draft.confidence.date < 0.7 && "border-amber-300 bg-amber-50"
                    )}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="draft-amount">Amount ({draft.currency})</Label>
                  <Input
                    id="draft-amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                    className={cn(
                      draft.confidence.amount < 0.7 && "border-amber-300 bg-amber-50"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="draft-tax">VAT/Tax Amount</Label>
                  <Input
                    id="draft-tax"
                    type="number"
                    step="0.01"
                    value={formData.taxAmount}
                    onChange={(e) => setFormData((p) => ({ ...p, taxAmount: e.target.value }))}
                  />
                  {draft.vatRate && (
                    <p className="text-xs text-slate-600">
                      Rate: {(draft.vatRate * 100).toFixed(0)}%
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="draft-project">Project</Label>
                  <Input
                    id="draft-project"
                    value={formData.projectLink}
                    onChange={(e) => setFormData((p) => ({ ...p, projectLink: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="draft-notes">Notes</Label>
                <Textarea
                  id="draft-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional notes"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="draft-billable"
                  checked={formData.billable}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, billable: checked }))}
                />
                <Label htmlFor="draft-billable">Billable to client</Label>
              </div>
            </div>

            {/* Confidence indicator */}
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span>Confidence</span>
                  <span>{Math.round(draft.confidence.overall * 100)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      draft.confidence.overall > 0.7
                        ? "bg-green-500"
                        : draft.confidence.overall > 0.4
                          ? "bg-amber-500"
                          : "bg-red-500"
                    )}
                    style={{ width: `${draft.confidence.overall * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleConfirm} disabled={status === "saving"} className="flex-1">
                {status === "saving" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Confirm & Save"
                )}
              </Button>
              <Button variant="outline" onClick={handleEdit} disabled={status === "saving"}>
                Edit
              </Button>
              <Button variant="ghost" onClick={handleDiscard} disabled={status === "saving"}>
                Discard
              </Button>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
