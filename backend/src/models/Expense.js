import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: {
      type: String,
      enum: ["food", "books", "rent", "transport", "fees", "other"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: "", trim: true },
    spentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

expenseSchema.index({ studentId: 1, spentAt: -1 });

export default mongoose.model("Expense", expenseSchema);
