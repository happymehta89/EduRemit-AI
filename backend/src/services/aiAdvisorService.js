/**
 * Budget Advisor
 * - If GEMINI_API_KEY is set, asks Gemini to analyze the student's spending.
 * - Otherwise, falls back to a genuinely useful rule-based analysis so the
 *   feature works fully out of the box.
 */

const CATEGORY_BENCHMARKS = {
  // Rough "healthy" share of total spend, used by the rule-based advisor
  food: 0.3,
  rent: 0.4,
  books: 0.1,
  transport: 0.1,
  fees: 0.15,
  other: 0.1,
};

function buildCategoryBreakdown(expenses) {
  const totals = {};
  let total = 0;
  for (const e of expenses) {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
    total += e.amount;
  }
  const breakdown = {};
  for (const [cat, amt] of Object.entries(totals)) {
    breakdown[cat] = {
      amount: Math.round(amt * 100) / 100,
      percent: total > 0 ? Math.round((amt / total) * 1000) / 10 : 0,
    };
  }
  return { breakdown, total };
}

function ruleBasedAnalysis(expenses) {
  if (!expenses.length) {
    return {
      summary: "No expenses logged yet — once you add some, you'll get a real spending breakdown here.",
      insights: ["Add at least a few expenses across categories to unlock personalized insights."],
      riskLevel: "low",
      categoryBreakdown: {},
      generatedBy: "rule-based",
    };
  }

  const { breakdown, total } = buildCategoryBreakdown(expenses);
  const insights = [];
  let riskScore = 0;

  for (const [cat, { percent }] of Object.entries(breakdown)) {
    const benchmark = (CATEGORY_BENCHMARKS[cat] ?? 0.15) * 100;
    const overBy = percent - benchmark;
    if (overBy > 15) {
      insights.push(
        `You spent ${percent}% of your budget on ${cat} — that's well above a typical ${Math.round(
          benchmark
        )}% share. Consider trimming ${cat} spending by 10–15% next month.`
      );
      riskScore += 2;
    } else if (overBy > 5) {
      insights.push(
        `${cat[0].toUpperCase() + cat.slice(1)} spending (${percent}%) is a bit above the typical ${Math.round(
          benchmark
        )}% benchmark — worth keeping an eye on.`
      );
      riskScore += 1;
    }
  }

  const topCategory = Object.entries(breakdown).sort((a, b) => b[1].amount - a[1].amount)[0];
  if (topCategory) {
    insights.push(
      `Your largest expense category is ${topCategory[0]} at ${topCategory[1].percent}% of total spend (${topCategory[1].amount} XLM).`
    );
  }

  if (insights.length === 0) {
    insights.push("Your spending looks well-balanced across categories — nice work staying on budget.");
  }

  const riskLevel = riskScore >= 4 ? "high" : riskScore >= 2 ? "medium" : "low";

  const summary = `Across ${expenses.length} logged expense${expenses.length === 1 ? "" : "s"} totaling ${Math.round(
    total * 100
  ) / 100} XLM, your spending is ${
    riskLevel === "high" ? "concentrated in a few categories and worth rebalancing" : riskLevel === "medium" ? "mostly reasonable with a couple of categories to watch" : "well distributed"
  }.`;

  return {
    summary,
    insights,
    riskLevel,
    categoryBreakdown: breakdown,
    generatedBy: "rule-based",
  };
}

async function geminiAnalysis(expenses, apiKey) {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const { breakdown, total } = buildCategoryBreakdown(expenses);

  const prompt = `You are a careful, encouraging financial advisor for a student studying abroad.
Analyze this student's expenses and respond ONLY with valid JSON, no markdown fences, in this exact shape:
{"summary": string, "insights": string[] (2-4 short actionable bullet points), "riskLevel": "low"|"medium"|"high"}

Expense data (category: amount in XLM, percent of total):
${JSON.stringify(breakdown, null, 2)}
Total spent: ${total} XLM
Number of transactions: ${expenses.length}

Find overspending categories, suggest concrete improvements, and set riskLevel based on how concentrated/risky the spending pattern is.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(text);

  return {
    summary: parsed.summary,
    insights: parsed.insights || [],
    riskLevel: parsed.riskLevel || "low",
    categoryBreakdown: breakdown,
    generatedBy: "gemini",
  };
}

export async function analyzeSpending(expenses) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (apiKey) {
    try {
      return await geminiAnalysis(expenses, apiKey);
    } catch (err) {
      console.error("[ai] Gemini analysis failed, falling back to rule-based:", err.message);
      return ruleBasedAnalysis(expenses);
    }
  }

  return ruleBasedAnalysis(expenses);
}
