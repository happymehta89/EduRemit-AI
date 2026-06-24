import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

/**
 * Parent dashboard: list of this parent's linked students.
 */
export async function getLinkedStudents(req, res, next) {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Only parent accounts have linked students." });
    }
    await req.user.populate("linkedStudents", "name email walletPublicKey");
    res.json({ students: req.user.linkedStudents });
  } catch (err) {
    next(err);
  }
}

/**
 * Any authenticated user can list universities to pay (public directory).
 */
export async function listUniversities(req, res, next) {
  try {
    const universities = await User.find({ role: "university" }).select(
      "name universityName walletPublicKey email"
    );
    res.json({ universities });
  } catch (err) {
    next(err);
  }
}

/**
 * University dashboard: incoming payment records grouped by payer.
 */
export async function getUniversityPayers(req, res, next) {
  try {
    if (req.user.role !== "university") {
      return res.status(403).json({ error: "Only university accounts can view payers." });
    }
    const txs = await Transaction.find({ receiver: req.user._id })
      .populate("sender", "name role email")
      .sort({ createdAt: -1 });
    res.json({ payments: txs });
  } catch (err) {
    next(err);
  }
}
