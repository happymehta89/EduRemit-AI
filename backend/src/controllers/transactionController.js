import mongoose from "mongoose";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Expense from "../models/Expense.js";
import { buildPaymentXDR, submitSignedXDR } from "../services/stellarService.js";

/**
 * Build unsigned XDR for parent funding student.
 */
export async function buildFundTransaction(req, res, next) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ error: "Only parents can build fund tx." });
    
    const { studentId, amount, memo } = req.body;
    const numericAmount = Number(amount);
    if (!studentId || !numericAmount || numericAmount <= 0) return res.status(400).json({ error: "Invalid data." });
    
    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) return res.status(404).json({ error: "Student not found." });
    
    if (!req.user.walletPublicKey) return res.status(400).json({ error: "Connect your Freighter wallet first." });
    
    const xdr = await buildPaymentXDR({
      senderPublicKey: req.user.walletPublicKey,
      receiverPublicKey: student.walletPublicKey,
      amount: numericAmount,
      memo: memo || "Education funding",
    });
    
    res.json({ xdr });
  } catch (err) {
    next(err);
  }
}

/**
 * Parent submits signed funding XDR.
 */
export async function sendFunds(req, res, next) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ error: "Only parent accounts can send funds." });

    const { studentId, amount, memo, signedXDR, transactionHash } = req.body;
    const numericAmount = Number(amount);

    if (!studentId || !numericAmount || (!signedXDR && !transactionHash)) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) return res.status(404).json({ error: "Student not found." });

    let hash = transactionHash;
    let successful = true;

    if (signedXDR) {
      try {
        const result = await submitSignedXDR(signedXDR);
        hash = result.hash;
        successful = result.successful !== false;
      } catch (err) {
        const detail = err?.response?.data?.extras?.result_codes || err.message;
        return res.status(502).json({
          error: "The Stellar payment failed.",
          detail,
        });
      }
    }

    const tx = await Transaction.create({
      sender: req.user._id,
      receiver: student._id,
      senderWallet: req.user.walletPublicKey,
      receiverWallet: student.walletPublicKey,
      amount: numericAmount,
      hash: hash,
      type: "funding",
      memo: memo || "",
      status: successful ? "success" : "failed",
    });

    res.status(201).json({ transaction: tx, stellarHash: hash });
  } catch (err) {
    next(err);
  }
}

/**
 * Build unsigned XDR for tuition payment.
 */
export async function buildTuitionTransaction(req, res, next) {
  try {
    if (req.user.role !== "student") return res.status(403).json({ error: "Only students can build tuition tx." });
    
    const { universityId, amount, memo } = req.body;
    const numericAmount = Number(amount);
    if (!universityId || !numericAmount || numericAmount <= 0) return res.status(400).json({ error: "Invalid data." });
    
    const university = await User.findOne({ _id: universityId, role: "university" });
    if (!university) return res.status(404).json({ error: "University not found." });
    
    if (!req.user.walletPublicKey) return res.status(400).json({ error: "Connect your Freighter wallet first." });
    
    const xdr = await buildPaymentXDR({
      senderPublicKey: req.user.walletPublicKey,
      receiverPublicKey: university.walletPublicKey,
      amount: numericAmount,
      memo: memo || "Tuition payment",
    });
    
    res.json({ xdr });
  } catch (err) {
    next(err);
  }
}

/**
 * Student submits signed tuition XDR.
 */
export async function payUniversity(req, res, next) {
  try {
    if (req.user.role !== "student") return res.status(403).json({ error: "Only student accounts can make payments." });

    const { universityId, amount, type, memo, signedXDR, transactionHash } = req.body;
    const numericAmount = Number(amount);

    if (!universityId || !numericAmount || (!signedXDR && !transactionHash)) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const university = await User.findOne({ _id: universityId, role: "university" });
    if (!university) return res.status(404).json({ error: "University not found." });

    let hash = transactionHash;
    let successful = true;

    if (signedXDR) {
      try {
        const result = await submitSignedXDR(signedXDR);
        hash = result.hash;
        successful = result.successful !== false;
      } catch (err) {
        const detail = err?.response?.data?.extras?.result_codes || err.message;
        return res.status(502).json({
          error: "The Stellar payment failed.",
          detail,
        });
      }
    }

    const tx = await Transaction.create({
      sender: req.user._id,
      receiver: university._id,
      senderWallet: req.user.walletPublicKey,
      receiverWallet: university.walletPublicKey,
      amount: numericAmount,
      hash: hash,
      type: type === "rent" ? "rent" : "tuition",
      memo: memo || "",
      status: successful ? "success" : "failed",
    });

    res.status(201).json({ transaction: tx, stellarHash: hash });
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
