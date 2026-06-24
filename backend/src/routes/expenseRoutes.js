import express from "express";
import {
  addExpense,
  getMyExpenses,
  getExpensesByStudent,
  deleteExpense,
} from "../controllers/expenseController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireAuth, addExpense);
router.get("/", requireAuth, getMyExpenses);
router.get("/student/:studentId", requireAuth, getExpensesByStudent);
router.delete("/:id", requireAuth, deleteExpense);

export default router;
