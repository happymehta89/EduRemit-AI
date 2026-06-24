import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderWallet: { type: String, required: true },
    receiverWallet: { type: String, required: true },
    amount: { type: Number, required: true },
    asset: { type: String, default: "XLM" },
    hash: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["funding", "tuition", "rent", "other"],
      default: "funding",
    },
    memo: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
    },
  },
  { timestamps: true }
);

transactionSchema.index({ sender: 1, createdAt: -1 });
transactionSchema.index({ receiver: 1, createdAt: -1 });

export default mongoose.model("Transaction", transactionSchema);
