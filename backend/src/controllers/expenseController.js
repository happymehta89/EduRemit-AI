import Expense from "../models/Expense.js";

export async function addExpense(req, res, next) {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only student accounts can log expenses." });
    }
    const { category, amount, note, spentAt } = req.body;
    const numericAmount = Number(amount);

    if (!category || !numericAmount || numericAmount <= 0) {
      return res.status(400).json({ error: "category and a positive amount are required." });
    }
    const validCategories = ["food", "books", "rent", "transport", "fees", "other"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${validCategories.join(", ")}` });
    }

    const expense = await Expense.create({
      studentId: req.user._id,
      category,
      amount: numericAmount,
      note: note || "",
      spentAt: spentAt ? new Date(spentAt) : new Date(),
    });

    res.status(201).json({ expense });
  } catch (err) {
    next(err);
  }
}

export async function getMyExpenses(req, res, next) {
  try {
    const expenses = await Expense.find({ studentId: req.user._id }).sort({ spentAt: -1 });
    res.json({ expenses });
  } catch (err) {
    next(err);
  }
}

export async function getExpensesByStudent(req, res, next) {
  // Used by parents viewing a linked student's spending categories
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Only parent accounts can view a student's expenses." });
    }
    const { studentId } = req.params;
    if (!req.user.linkedStudents.map(String).includes(studentId)) {
      return res.status(403).json({ error: "You can only view linked students' expenses." });
    }
    const expenses = await Expense.find({ studentId }).sort({ spentAt: -1 });
    res.json({ expenses });
  } catch (err) {
    next(err);
  }
}

export async function deleteExpense(req, res, next) {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, studentId: req.user._id });
    if (!expense) {
      return res.status(404).json({ error: "Expense not found." });
    }
    await expense.deleteOne();
    res.json({ message: "Expense deleted." });
  } catch (err) {
    next(err);
  }
}
