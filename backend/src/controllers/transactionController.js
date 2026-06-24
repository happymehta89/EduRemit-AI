import mongoose from "mongoose";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Expense from "../models/Expense.js";
import { sendPayment } from "../services/stellarService.js";

/**
 * Parent sends funds to a linked student.
 */
export async function sendFunds(req, res, next) {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Only parent accounts can send funds." });
    }

    const { studentId, amount, memo } = req.body;
    const numericAmount = Number(amount);

    if (!studentId || !numericAmount || numericAmount <= 0) {
      return res.status(400).json({ error: "studentId and a positive amount are required." });
    }

    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) {
      return res.status(404).json({ error: "Student not found." });
    }
    if (!req.user.linkedStudents.map(String).includes(String(student._id))) {
      return res.status(403).json({ error: "You can only send funds to a linked student." });
    }
    if (!req.user.walletSecretKeyEncrypted) {
      return res.status(400).json({ error: "Your wallet isn't set up yet." });
    }

    let result;
    try {
      result = await sendPayment({
        senderSecretKey: req.user.walletSecretKeyEncrypted,
        receiverPublicKey: student.walletPublicKey,
        amount: numericAmount,
        memo: memo || "Education funding",
      });
    } catch (err) {
      const detail = err?.response?.data?.extras?.result_codes || err.message;
      return res.status(502).json({
        error: "The Stellar payment failed. This usually means insufficient testnet balance.",
        detail,
      });
    }

    const tx = await Transaction.create({
      sender: req.user._id,
      receiver: student._id,
      senderWallet: req.user.walletPublicKey,
      receiverWallet: student.walletPublicKey,
      amount: numericAmount,
      hash: result.hash,
      type: "funding",
      memo: memo || "",
      status: result.successful ? "success" : "failed",
    });

    res.status(201).json({ transaction: tx, stellarHash: result.hash });
  } catch (err) {
    next(err);
  }
}

/**
 * Student pays a university (tuition/rent/other) from their wallet.
 */
export async function payUniversity(req, res, next) {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only student accounts can make payments." });
    }

    const { universityId, amount, type, memo } = req.body;
    const numericAmount = Number(amount);

    if (!universityId || !numericAmount || numericAmount <= 0) {
      return res.status(400).json({ error: "universityId and a positive amount are required." });
    }

    const university = await User.findOne({ _id: universityId, role: "university" });
    if (!university) {
      return res.status(404).json({ error: "University not found." });
    }

    let result;
    try {
      result = await sendPayment({
        senderSecretKey: req.user.walletSecretKeyEncrypted,
        receiverPublicKey: university.walletPublicKey,
        amount: numericAmount,
        memo: memo || "Tuition payment",
      });
    } catch (err) {
      const detail = err?.response?.data?.extras?.result_codes || err.message;
      return res.status(502).json({
        error: "The Stellar payment failed. This usually means insufficient testnet balance.",
        detail,
      });
    }

    const tx = await Transaction.create({
      sender: req.user._id,
      receiver: university._id,
      senderWallet: req.user.walletPublicKey,
      receiverWallet: university.walletPublicKey,
      amount: numericAmount,
      hash: result.hash,
      type: type === "rent" ? "rent" : "tuition",
      memo: memo || "",
      status: result.successful ? "success" : "failed",
    });

    res.status(201).json({ transaction: tx, stellarHash: result.hash });
  } catch (err) {
    next(err);
  }
}

/**
 * Transaction history from our own DB (fast, paginated) — distinct from the
 * live Horizon lookup in walletController, which hits the Stellar network directly.
 */
export async function getMyTransactions(req, res, next) {
  try {
    const txs = await Transaction.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name role")
      .populate("receiver", "name role");

    res.json({ transactions: txs });
  } catch (err) {
    next(err);
  }
}

/**
 * Parent monitoring view: total sent, student's remaining balance estimate,
 * and that student's spending categories.
 */
export async function getStudentSummary(req, res, next) {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Only parent accounts can view student summaries." });
    }
    const { studentId } = req.params;
    if (!req.user.linkedStudents.map(String).includes(String(studentId))) {
      return res.status(403).json({ error: "You can only view linked students." });
    }

    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    const [fundingTotals, spendingTotals] = await Promise.all([
      Transaction.aggregate([
        { $match: { receiver: studentObjectId, type: "funding" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        { $match: { studentId: studentObjectId } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
      ]),
    ]);

    const totalSent = fundingTotals[0]?.total || 0;
    const categoryBreakdown = {};
    let totalSpent = 0;
    for (const row of spendingTotals) {
      categoryBreakdown[row._id] = row.total;
      totalSpent += row.total;
    }

    res.json({
      totalSent,
      totalSpent,
      remainingBalance: Math.round((totalSent - totalSpent) * 100) / 100,
      categoryBreakdown,
    });
  } catch (err) {
    next(err);
  }
}
