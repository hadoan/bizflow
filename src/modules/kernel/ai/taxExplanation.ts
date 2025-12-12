import { generateCompletion, AIMessage } from "@/lib/ai";

export interface TaxSummary {
  period: string;
  income: number;
  expenses: number;
  vatCollected: number;
  vatPaid: number;
  vatDue: number;
  isKleinunternehmer: boolean;
}

export interface TaxExplanation {
  summary: string;
  details: string[];
  recommendations?: string[];
}

export async function explainTaxSummary(
  summary: TaxSummary,
  language: string = "de"
): Promise<TaxExplanation> {
  try {
    const systemPrompt =
      language === "de"
        ? `Du bist ein KI-Assistent für deutsche Steuerberatung. Erkläre Steuerperioden verständlich für Freiberufler und Solo-Gründer.`
        : `You are an AI assistant for German tax advice. Explain tax periods clearly for freelancers and solo founders.`;

    const userPrompt =
      language === "de"
        ? `Erkläre diese Steuerperiode:
Zeitraum: ${summary.period}
Einnahmen: €${summary.income.toFixed(2)}
Ausgaben: €${summary.expenses.toFixed(2)}
USt eingenommen: €${summary.vatCollected.toFixed(2)}
USt gezahlt: €${summary.vatPaid.toFixed(2)}
USt-Zahllast: €${summary.vatDue.toFixed(2)}
Kleinunternehmerregelung: ${summary.isKleinunternehmer ? "Ja" : "Nein"}

Gib eine kurze Zusammenfassung, wichtige Details und ggf. Empfehlungen.`
        : `Explain this tax period:
Period: ${summary.period}
Income: €${summary.income.toFixed(2)}
Expenses: €${summary.expenses.toFixed(2)}
VAT collected: €${summary.vatCollected.toFixed(2)}
VAT paid: €${summary.vatPaid.toFixed(2)}
VAT due: €${summary.vatDue.toFixed(2)}
Small business scheme: ${summary.isKleinunternehmer ? "Yes" : "No"}

Provide a brief summary, key details, and recommendations if applicable.`;

    const messages: AIMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    const response = await generateCompletion({
      messages,
      temperature: 0.5,
      maxTokens: 800,
    });

    return {
      summary: response.content.split("\n")[0],
      details: response.content
        .split("\n")
        .slice(1)
        .filter((line) => line.trim()),
    };
  } catch (error) {
    console.error("Tax explanation error:", error);
    return {
      summary: "Tax summary explanation unavailable",
      details: ["AI service is currently unavailable"],
    };
  }
}
