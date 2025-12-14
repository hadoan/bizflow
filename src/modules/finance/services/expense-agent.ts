// Receipt → Expense Agent
// Implements the full workflow: extract → categorize → draft → confirm → save

import { db } from "@/lib/db";
import { callLLM } from "@/lib/ai";
import {
  extractReceiptData,
  validateReceipt,
  type ExtractedReceiptData,
  type ReceiptValidationResult,
} from "./receipt-extraction";
import { suggestReceiptCategorisation } from "@/modules/kernel/ai/receiptCategorisation";
import { Decimal } from "@prisma/client/runtime/library";

export interface ExpenseDraft {
  id: string;
  vendor: string;
  category: string;
  date: string; // ISO date string
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
  extractedData: ExtractedReceiptData;
  validationResult: ReceiptValidationResult;
}

export interface AgentQuestion {
  field: string;
  question: string;
  options?: Array<{ value: string; label: string }>;
  currentValue: string | null;
}

export interface AgentResponse {
  draft: ExpenseDraft | null;
  questions: AgentQuestion[];
  message: string;
  status: "extracting" | "reviewing" | "ready" | "error";
}

export interface DuplicateExpense {
  id: string;
  vendor: string;
  amount: number;
  date: Date;
  category: string;
  similarity: number;
}

/**
 * Main agent workflow: Process a receipt and create an expense draft
 */
export async function processReceipt(
  spaceId: string,
  fileId: string,
  imageData: string,
  mimeType: string
): Promise<AgentResponse> {
  try {
    // Step 1: Extract data from receipt (SAFELY - treat as untrusted)
    const extracted = await extractReceiptData(imageData, mimeType);

    // Step 2: Validate arithmetic and detect issues
    const validation = validateReceipt(extracted);

    // Step 3: Categorize using AI
    let category = "Other";
    let vatRate = extracted.vatRate ?? 0.19;

    if (extracted.vendor && extracted.totalGross) {
      try {
        const categorization = await suggestReceiptCategorisation({
          text: `Receipt from ${extracted.vendor}`,
          amount: extracted.totalGross,
          vendor: extracted.vendor,
        });
        category = categorization.category;
        if (extracted.vatRate === null) {
          vatRate = categorization.vatRate;
        }
      } catch (error) {
        console.error("Categorization failed:", error);
      }
    }

    // Step 4: Check for duplicates
    const duplicates = await detectDuplicates(spaceId, {
      vendor: extracted.vendor,
      amount: extracted.totalGross || 0,
      date: extracted.date || new Date().toISOString().split("T")[0],
    });

    if (duplicates.length > 0) {
      validation.warnings.push(
        `Possible duplicate: Similar expense found for ${duplicates[0].vendor} on ${duplicates[0].date.toLocaleDateString()}`
      );
    }

    // Step 5: Create draft in database
    const draft = await createExpenseDraft(spaceId, {
      vendor: extracted.vendor,
      category,
      amount: extracted.totalGross || 0,
      currency: extracted.currency,
      date: extracted.date
        ? new Date(extracted.date)
        : new Date(),
      taxAmount: extracted.vatAmount,
      notes: extracted.notes,
      fileId,
      agentMetadata: {
        extracted,
        validation,
        vatRate,
      },
    });

    // Step 6: Determine what questions to ask (minimal set)
    const questions = determineQuestions(extracted, validation);

    // Step 7: Build response message
    const message = buildAgentMessage(extracted, validation, questions);

    return {
      draft: {
        id: draft.id,
        vendor: draft.vendor,
        category: draft.category,
        date: draft.date.toISOString().split("T")[0],
        totalGross: (draft.amount as Decimal).toNumber(),
        currency: draft.currency,
        vatAmount: draft.taxAmount ? (draft.taxAmount as Decimal).toNumber() : null,
        vatRate,
        paymentMethod: extracted.paymentMethod,
        notes: draft.notes,
        projectLink: draft.projectLink,
        billable: draft.billable,
        confidence: extracted.confidence,
        warnings: validation.warnings,
        extractedData: extracted,
        validationResult: validation,
      },
      questions,
      message,
      status: questions.length > 0 ? "reviewing" : "ready",
    };
  } catch (error) {
    console.error("Receipt processing error:", error);

    return {
      draft: null,
      questions: [],
      message:
        "I couldn't extract data from this receipt. Please check the image quality (ensure all corners are visible and text is readable) or enter the expense manually.",
      status: "error",
    };
  }
}

/**
 * Create a draft expense (not yet finalized)
 */
async function createExpenseDraft(
  spaceId: string,
  input: {
    vendor: string;
    category: string;
    amount: number;
    currency: string;
    date: Date;
    taxAmount?: number | null;
    notes?: string | null;
    fileId?: string;
    agentMetadata?: any;
  }
) {
  const space = await db.space.findUnique({
    where: { id: spaceId },
    select: { currency: true },
  });

  if (!space) {
    throw new Error("Space not found");
  }

  const baseCurrency = space.currency;
  const amount = input.amount;
  const currency = input.currency;
  const fxRate = currency === baseCurrency ? 1 : null;
  const baseAmount = amount;

  return db.expense.create({
    data: {
      spaceId,
      vendor: input.vendor,
      category: input.category,
      amount,
      currency,
      baseAmount,
      baseCurrency,
      fxRate,
      date: input.date,
      taxAmount: input.taxAmount || null,
      projectLink: null,
      billable: false,
      notes: input.notes,
      status: "DRAFT",
      fileId: input.fileId,
      agentMetadata: input.agentMetadata,
    },
  });
}

/**
 * Finalize a draft expense (user confirmed)
 */
export async function commitExpenseDraft(
  spaceId: string,
  draftId: string,
  updates?: {
    vendor?: string;
    category?: string;
    amount?: number;
    date?: string;
    taxAmount?: number;
    projectLink?: string;
    billable?: boolean;
    notes?: string;
  }
): Promise<any> {
  const draft = await db.expense.findFirst({
    where: { id: draftId, spaceId, status: "DRAFT" },
  });

  if (!draft) {
    throw new Error("Draft not found");
  }

  // Apply updates if provided
  const updateData: any = {
    status: "FINAL",
  };

  if (updates?.vendor) updateData.vendor = updates.vendor;
  if (updates?.category) updateData.category = updates.category;
  if (updates?.amount) {
    updateData.amount = updates.amount;
    updateData.baseAmount = updates.amount;
  }
  if (updates?.date) updateData.date = new Date(updates.date);
  if (updates?.taxAmount !== undefined) updateData.taxAmount = updates.taxAmount;
  if (updates?.projectLink !== undefined) updateData.projectLink = updates.projectLink;
  if (updates?.billable !== undefined) updateData.billable = updates.billable;
  if (updates?.notes !== undefined) updateData.notes = updates.notes;

  return db.expense.update({
    where: { id: draftId },
    data: updateData,
  });
}

/**
 * Update a draft expense with user corrections
 */
export async function updateExpenseDraft(
  spaceId: string,
  draftId: string,
  updates: {
    vendor?: string;
    category?: string;
    amount?: number;
    date?: string;
    taxAmount?: number;
    projectLink?: string;
    billable?: boolean;
    notes?: string;
  }
): Promise<any> {
  const draft = await db.expense.findFirst({
    where: { id: draftId, spaceId, status: "DRAFT" },
  });

  if (!draft) {
    throw new Error("Draft not found");
  }

  const updateData: any = {};

  if (updates.vendor) updateData.vendor = updates.vendor;
  if (updates.category) updateData.category = updates.category;
  if (updates.amount !== undefined) {
    updateData.amount = updates.amount;
    updateData.baseAmount = updates.amount;
  }
  if (updates.date) updateData.date = new Date(updates.date);
  if (updates.taxAmount !== undefined) updateData.taxAmount = updates.taxAmount;
  if (updates.projectLink !== undefined) updateData.projectLink = updates.projectLink;
  if (updates.billable !== undefined) updateData.billable = updates.billable;
  if (updates.notes !== undefined) updateData.notes = updates.notes;

  return db.expense.update({
    where: { id: draftId },
    data: updateData,
  });
}

/**
 * Discard a draft expense
 */
export async function discardExpenseDraft(
  spaceId: string,
  draftId: string
): Promise<void> {
  await db.expense.deleteMany({
    where: { id: draftId, spaceId, status: "DRAFT" },
  });
}

/**
 * Detect possible duplicate expenses
 */
async function detectDuplicates(
  spaceId: string,
  params: {
    vendor: string;
    amount: number;
    date: string;
  }
): Promise<DuplicateExpense[]> {
  // Look for expenses within ±3 days and similar vendor/amount
  const searchDate = new Date(params.date);
  const startDate = new Date(searchDate);
  startDate.setDate(startDate.getDate() - 3);
  const endDate = new Date(searchDate);
  endDate.setDate(endDate.getDate() + 3);

  const candidates = await db.expense.findMany({
    where: {
      spaceId,
      status: "FINAL",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      vendor: true,
      amount: true,
      date: true,
      category: true,
    },
  });

  // Calculate similarity
  const results: DuplicateExpense[] = [];

  for (const candidate of candidates) {
    const vendorSimilarity = calculateStringSimilarity(
      params.vendor.toLowerCase(),
      candidate.vendor.toLowerCase()
    );

    const amount = (candidate.amount as Decimal).toNumber();
    const amountDiff = Math.abs(amount - params.amount);
    const amountSimilarity = amountDiff < 0.01 ? 1 : 1 / (1 + amountDiff);

    const overallSimilarity = vendorSimilarity * 0.6 + amountSimilarity * 0.4;

    if (overallSimilarity > 0.7) {
      results.push({
        id: candidate.id,
        vendor: candidate.vendor,
        amount,
        date: candidate.date,
        category: candidate.category,
        similarity: overallSimilarity,
      });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
}

/**
 * Simple string similarity (Dice coefficient)
 */
function calculateStringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const aBigrams = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) {
    aBigrams.add(a.substring(i, i + 2));
  }

  let matches = 0;
  for (let i = 0; i < b.length - 1; i++) {
    if (aBigrams.has(b.substring(i, i + 2))) {
      matches++;
    }
  }

  return (2 * matches) / (a.length + b.length - 2);
}

/**
 * Determine what questions to ask the user (minimal set)
 */
function determineQuestions(
  extracted: ExtractedReceiptData,
  validation: ReceiptValidationResult
): AgentQuestion[] {
  const questions: AgentQuestion[] = [];

  // Only ask about CRITICAL missing/uncertain fields
  if (!extracted.date || extracted.confidence.date < 0.5) {
    questions.push({
      field: "date",
      question: "What is the receipt date?",
      currentValue: extracted.date,
    });
  }

  if (!extracted.totalGross || extracted.confidence.amount < 0.6) {
    questions.push({
      field: "amount",
      question: "What is the total amount?",
      currentValue: extracted.totalGross?.toString() || null,
    });
  }

  if (extracted.confidence.overall < 0.4) {
    questions.push({
      field: "vendor",
      question: "Who is the vendor?",
      currentValue: extracted.vendor,
    });
  }

  // Don't ask about VAT if confidence is reasonable
  // Users can always edit it later

  return questions;
}

/**
 * Build a user-friendly message about the extraction
 */
function buildAgentMessage(
  extracted: ExtractedReceiptData,
  validation: ReceiptValidationResult,
  questions: AgentQuestion[]
): string {
  if (questions.length > 0) {
    return `I've read the receipt, but I need clarification on ${questions.length} field${questions.length > 1 ? "s" : ""}. Please review the draft below.`;
  }

  if (validation.warnings.length > 0) {
    return `Receipt processed successfully. Please review the details below - I noticed ${validation.warnings.length} warning${validation.warnings.length > 1 ? "s" : ""}.`;
  }

  return `Receipt processed successfully! Please review and confirm the details below.`;
}

/**
 * Suggest an auto-categorization rule based on the expense
 */
export async function suggestCategoryRule(
  spaceId: string,
  vendor: string,
  category: string
): Promise<{ vendor: string; category: string; confidence: number }> {
  // Check if there are other expenses from this vendor
  const existingExpenses = await db.expense.findMany({
    where: {
      spaceId,
      vendor: {
        contains: vendor,
        mode: "insensitive",
      },
      status: "FINAL",
    },
    select: {
      category: true,
    },
    take: 10,
  });

  if (existingExpenses.length >= 3) {
    const categoryCount = existingExpenses.filter((e) => e.category === category).length;
    const confidence = categoryCount / existingExpenses.length;

    if (confidence > 0.7) {
      return { vendor, category, confidence };
    }
  }

  return { vendor, category, confidence: 0 };
}
