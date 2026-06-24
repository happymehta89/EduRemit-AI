import mongoose from "mongoose";

const aiReportSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    summary: { type: String, required: true },
    insights: [{ type: String }],
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    categoryBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    generatedBy: { type: String, enum: ["gemini", "rule-based"], default: "rule-based" },
  },
  { timestamps: true }
);

export default mongoose.model("AIReport", aiReportSchema);
