import Expense from "../models/Expense.js";
import AIReport from "../models/AIReport.js";
import { analyzeSpending } from "../services/aiAdvisorService.js";

export async function generateReport(req, res, next) {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only student accounts can generate budget reports." });
    }

    const expenses = await Expense.find({ studentId: req.user._id });
    const analysis = await analyzeSpending(expenses);

    const report = await AIReport.create({
      studentId: req.user._id,
      summary: analysis.summary,
      insights: analysis.insights,
      riskLevel: analysis.riskLevel,
      categoryBreakdown: analysis.categoryBreakdown,
      generatedBy: analysis.generatedBy,
    });

    res.status(201).json({ report });
  } catch (err) {
    next(err);
  }
}

export async function getMyReports(req, res, next) {
  try {
    const reports = await AIReport.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) {
    next(err);
  }
}

export async function getLatestReport(req, res, next) {
  try {
    const report = await AIReport.findOne({ studentId: req.user._id }).sort({ createdAt: -1 });
    res.json({ report });
  } catch (err) {
    next(err);
  }
}
