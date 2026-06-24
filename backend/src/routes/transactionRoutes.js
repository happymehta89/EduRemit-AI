import express from "express";
import {
  buildFundTransaction,
  sendFunds,
  buildTuitionTransaction,
  payUniversity,
  getMyTransactions,
  getStudentSummary,
} from "../controllers/transactionController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/build-fund", requireAuth, buildFundTransaction);
router.post("/fund", requireAuth, sendFunds);
router.post("/build-tuition", requireAuth, buildTuitionTransaction);
router.post("/pay-university", requireAuth, payUniversity);
router.get("/", requireAuth, getMyTransactions);
router.get("/summary/:studentId", requireAuth, getStudentSummary);

export default router;
