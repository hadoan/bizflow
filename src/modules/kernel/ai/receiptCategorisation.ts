import { generateCompletion, AIMessage } from "@/lib/ai";

export interface ReceiptData {
  vendorName: string;
  amount: number;
  documentDate: string;
  description?: string;
}

export interface ReceiptCategorisationSuggestion {
  category: string;
  vatRate: number;
  confidence: number;
  reasoning?: string;
}

const GERMAN_CATEGORIES = [
  "Cloud services",
  "Software subscriptions",
  "Office supplies",
  "Transport",
  "Meals & entertainment",
  "Marketing & advertising",
  "Professional services",
  "Insurance",
  "Utilities",
  "Equipment",
  "Other",
];

const SYSTEM_PROMPT = `You are an AI assistant helping German freelancers and solo founders categorise business receipts.

Available categories: ${GERMAN_CATEGORIES.join(", ")}

German VAT rates:
- 19% (standard rate)
- 7% (reduced rate - books, food, etc.)
- 0% (exempt - certain services, small business scheme)

Return your suggestion as JSON with:
{
  "category": "category name",
  "vatRate": 0.19 | 0.07 | 0,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

export async function suggestReceiptCategorisation(
  receipt: ReceiptData
): Promise<ReceiptCategorisationSuggestion> {
  try {
    const messages: AIMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Please categorise this receipt:
Vendor: ${receipt.vendorName}
Amount: €${receipt.amount}
Date: ${receipt.documentDate}
${receipt.description ? `Description: ${receipt.description}` : ""}`,
      },
    ];

    const response = await generateCompletion({
      messages,
      temperature: 0.3,
      maxTokens: 500,
    });

    const suggestion = JSON.parse(response.content);
    return {
      category: suggestion.category,
      vatRate: suggestion.vatRate,
      confidence: suggestion.confidence,
      reasoning: suggestion.reasoning,
    };
  } catch (error) {
    console.error("Receipt categorisation error:", error);
    return {
      category: "Other",
      vatRate: 0.19,
      confidence: 0.3,
      reasoning: "Fallback categorisation (AI unavailable)",
    };
  }
}
