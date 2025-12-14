// Tool definitions for the Expense Agent (AI SDK format)

import { tool } from 'ai';
import { z } from 'zod';
import {
  extractReceiptData,
  validateReceipt,
} from '../services/receipt-extraction';
import {
  updateExpenseDraft,
  commitExpenseDraft,
  discardExpenseDraft,
} from '../services/expense-agent';
import { suggestReceiptCategorisation } from '@/modules/kernel/ai/receiptCategorisation';

/**
 * Tool: Extract receipt data from image
 * READ operation - extracts structured data safely
 */
export const extractReceiptTool = tool({
  description: 'Extract structured data from a receipt image (vendor, date, amounts, VAT, etc.). Use this when user uploads a receipt. Pass the data URL from the attachment as imageData.',
  parameters: z.object({
    imageData: z.string().describe('Data URL or base64 encoded image data (e.g., data:image/jpeg;base64,...)'),
    mimeType: z.string().describe('MIME type of the image (e.g., image/jpeg, application/pdf)'),
  }),
  execute: async ({ imageData, mimeType }) => {
    // Handle data URLs by extracting the base64 part
    let processedImageData = imageData;
    if (imageData.startsWith('data:')) {
      const commaIndex = imageData.indexOf(',');
      if (commaIndex !== -1) {
        processedImageData = imageData.substring(commaIndex + 1);
      }
    }

    const extracted = await extractReceiptData(processedImageData, mimeType);
    return {
      vendor: extracted.vendor,
      date: extracted.date,
      totalGross: extracted.totalGross,
      currency: extracted.currency,
      vatAmount: extracted.vatAmount,
      vatRate: extracted.vatRate,
      netAmount: extracted.netAmount,
      paymentMethod: extracted.paymentMethod,
      lineItems: extracted.lineItems,
      country: extracted.country,
      notes: extracted.notes,
      confidence: extracted.confidence,
    };
  },
});

/**
 * Tool: Validate receipt arithmetic
 * READ operation - checks if net + VAT = gross
 */
export const validateReceiptTool = tool({
  description: 'Validate receipt arithmetic (net + VAT = gross) and detect anomalies. Use after extracting receipt data.',
  parameters: z.object({
    vendor: z.string(),
    date: z.string().nullable(),
    totalGross: z.number().nullable(),
    currency: z.string(),
    vatAmount: z.number().nullable(),
    vatRate: z.number().nullable(),
    netAmount: z.number().nullable(),
    paymentMethod: z.string().nullable(),
    lineItems: z.array(z.object({
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      total: z.number(),
    })),
    country: z.string().nullable(),
    notes: z.string().nullable(),
    confidence: z.object({
      overall: z.number(),
      vendor: z.number(),
      date: z.number(),
      amount: z.number(),
      vat: z.number(),
    }),
  }),
  execute: async (data) => {
    const validation = validateReceipt(data);
    return {
      isValid: validation.isValid,
      warnings: validation.warnings,
      errors: validation.errors,
    };
  },
});

/**
 * Tool: Categorize expense
 * READ operation - suggests category based on vendor and description
 */
export const categorizeExpenseTool = tool({
  description: 'Suggest an expense category based on vendor name and description. Use to categorize extracted receipts.',
  parameters: z.object({
    vendor: z.string().describe('Vendor/merchant name'),
    description: z.string().describe('Description or text from receipt'),
    amount: z.number().describe('Total amount'),
  }),
  execute: async ({ vendor, description, amount }) => {
    const suggestion = await suggestReceiptCategorisation({
      text: description,
      amount,
      vendor,
    });
    return {
      category: suggestion.category,
      vatRate: suggestion.vatRate,
      explanation: suggestion.explanation,
    };
  },
});

/**
 * Tool: Create expense draft
 * WRITE operation - requires confirmation from user
 */
export const createExpenseDraftTool = tool({
  description: 'Create a draft expense (not yet saved). Use this after extracting and validating receipt data. IMPORTANT: This is a WRITE operation - only call after presenting a draft to the user.',
  parameters: z.object({
    spaceId: z.string().describe('Space ID (from context)'),
    fileId: z.string().describe('File ID of uploaded receipt'),
    vendor: z.string().describe('Vendor/merchant name'),
    category: z.string().describe('Expense category'),
    amount: z.number().describe('Total gross amount'),
    currency: z.string().describe('Currency code (e.g., EUR)'),
    date: z.string().describe('Receipt date (ISO format)'),
    taxAmount: z.number().optional().describe('VAT/tax amount'),
    notes: z.string().optional().describe('Additional notes'),
    agentMetadata: z.any().optional().describe('Internal metadata'),
  }),
  execute: async (params) => {
    // This creates a DRAFT expense - not yet visible to user
    const { createExpense } = await import('../services/expenses');
    const draft = await createExpense(params.spaceId, {
      vendor: params.vendor,
      category: params.category,
      amount: params.amount,
      currency: params.currency,
      date: new Date(params.date),
      taxAmount: params.taxAmount,
      notes: params.notes,
    });

    return {
      draftId: draft.id,
      vendor: draft.vendor,
      category: draft.category,
      amount: draft.amount,
      currency: draft.currency,
      date: draft.date.toISOString(),
    };
  },
});

/**
 * Tool: Update expense draft
 * WRITE operation - updates fields in draft
 */
export const updateExpenseDraftTool = tool({
  description: 'Update a draft expense with corrections. Use when user requests edits to the draft.',
  parameters: z.object({
    spaceId: z.string().describe('Space ID (from context)'),
    draftId: z.string().describe('Draft expense ID'),
    vendor: z.string().optional(),
    category: z.string().optional(),
    amount: z.number().optional(),
    date: z.string().optional(),
    taxAmount: z.number().optional(),
    projectLink: z.string().optional(),
    billable: z.boolean().optional(),
    notes: z.string().optional(),
  }),
  execute: async ({ spaceId, draftId, ...updates }) => {
    const updated = await updateExpenseDraft(spaceId, draftId, updates);
    return {
      success: true,
      draftId: updated.id,
    };
  },
});

/**
 * Tool: Commit expense draft
 * WRITE operation - REQUIRES EXPLICIT USER CONFIRMATION
 */
export const commitExpenseDraftTool = tool({
  description: 'Finalize and save a draft expense. CRITICAL: Only call this after user explicitly confirms (says "confirm", "save", "yes", etc.). This makes the expense permanent.',
  parameters: z.object({
    spaceId: z.string().describe('Space ID (from context)'),
    draftId: z.string().describe('Draft expense ID to commit'),
    updates: z.object({
      vendor: z.string().optional(),
      category: z.string().optional(),
      amount: z.number().optional(),
      date: z.string().optional(),
      taxAmount: z.number().optional(),
      projectLink: z.string().optional(),
      billable: z.boolean().optional(),
      notes: z.string().optional(),
    }).optional(),
  }),
  execute: async ({ spaceId, draftId, updates }) => {
    const expense = await commitExpenseDraft(spaceId, draftId, updates);
    return {
      success: true,
      expenseId: expense.id,
      vendor: expense.vendor,
      amount: expense.amount,
      category: expense.category,
      date: expense.date.toISOString(),
    };
  },
});

/**
 * Tool: Discard expense draft
 * WRITE operation - deletes draft
 */
export const discardExpenseDraftTool = tool({
  description: 'Delete a draft expense. Use when user says "discard", "cancel", or "delete".',
  parameters: z.object({
    spaceId: z.string().describe('Space ID (from context)'),
    draftId: z.string().describe('Draft expense ID to discard'),
  }),
  execute: async ({ spaceId, draftId }) => {
    await discardExpenseDraft(spaceId, draftId);
    return {
      success: true,
      message: 'Draft discarded',
    };
  },
});

/**
 * All tools for the expense agent
 */
export const expenseAgentTools = {
  extractReceipt: extractReceiptTool,
  validateReceipt: validateReceiptTool,
  categorizeExpense: categorizeExpenseTool,
  createExpenseDraft: createExpenseDraftTool,
  updateExpenseDraft: updateExpenseDraftTool,
  commitExpenseDraft: commitExpenseDraftTool,
  discardExpenseDraft: discardExpenseDraftTool,
};
