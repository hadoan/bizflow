import { callLLM } from "@/lib/ai";

export interface ReceiptCategorisationSuggestion {
  category: string;
  vatRate: number;
  explanation: string;
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

const CATEGORY_RULES: Record<string, { category: string; vatRate: number }> = {
  // Transport
  bahn: { category: "Transport", vatRate: 0.19 },
  db: { category: "Transport", vatRate: 0.19 },
  taxi: { category: "Transport", vatRate: 0.19 },
  uber: { category: "Transport", vatRate: 0.19 },

  // Cloud services (more specific first)
  aws: { category: "Cloud services", vatRate: 0.19 },
  google: { category: "Cloud services", vatRate: 0.19 },
  azure: { category: "Cloud services", vatRate: 0.19 },

  // Software subscriptions
  microsoft: { category: "Software subscriptions", vatRate: 0.19 },
  adobe: { category: "Software subscriptions", vatRate: 0.19 },

  // Office supplies (more general, comes after specific cloud/software)
  amazon: { category: "Office supplies", vatRate: 0.19 },

  // Meals & entertainment
  restaurant: { category: "Meals & entertainment", vatRate: 0.19 },
  cafe: { category: "Meals & entertainment", vatRate: 0.19 },
  hotel: { category: "Meals & entertainment", vatRate: 0.19 },

  // Utilities
  electricity: { category: "Utilities", vatRate: 0.19 },
  gas: { category: "Utilities", vatRate: 0.19 },
  internet: { category: "Utilities", vatRate: 0.19 },
  phone: { category: "Utilities", vatRate: 0.19 },

  // Insurance
  insurance: { category: "Insurance", vatRate: 0.19 },
};

export async function suggestReceiptCategorisation({
  text,
  amount,
  vendor,
  history = [],
}: {
  text: string;
  amount: number;
  vendor: string;
  history?: Array<{ category: string; vendor: string; amount: number }>;
}): Promise<ReceiptCategorisationSuggestion> {
  // First, try simple rule-based matching
  const vendorLower = vendor.toLowerCase();
  const textLower = text.toLowerCase();

  for (const [keyword, rule] of Object.entries(CATEGORY_RULES)) {
    if (vendorLower.includes(keyword) || textLower.includes(keyword)) {
      return {
        category: rule.category,
        vatRate: rule.vatRate,
        explanation: `Matched keyword "${keyword}" in vendor or text`,
      };
    }
  }

  // If no rules match, use AI for intelligent categorization
  try {
    const historyContext = history.length > 0
      ? `\n\nPrevious similar receipts:\n${history.slice(-3).map(h =>
          `- ${h.vendor}: ${h.category} (€${h.amount})`
        ).join('\n')}`
      : '';

    const prompt = `Categorize this business receipt for a German freelancer:

Vendor: ${vendor}
Amount: €${amount}
Text/Description: ${text}${historyContext}

Available categories: ${GERMAN_CATEGORIES.join(", ")}

German VAT rates:
- 19% (standard rate)
- 7% (reduced rate - books, food, etc.)
- 0% (exempt - certain services, small business scheme)

Return only a JSON object with: {"category": "CategoryName", "vatRate": 0.19, "explanation": "Brief reason"}`;

    const aiResponse = await callLLM(prompt, {
      system: "You are a helpful assistant for categorizing business receipts. Always return valid JSON.",
    });

    // Try to parse JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        category: parsed.category || "Other",
        vatRate: typeof parsed.vatRate === 'number' ? parsed.vatRate : 0.19,
        explanation: parsed.explanation || "AI-generated categorization",
      };
    }

    // Fallback if JSON parsing fails
    return {
      category: "Other",
      vatRate: 0.19,
      explanation: "Could not parse AI response, using default categorization",
    };
  } catch (error) {
    console.error("Receipt categorisation error:", error);
    return {
      category: "Other",
      vatRate: 0.19,
      explanation: "Fallback categorization (AI unavailable)",
    };
  }
}
