import express from "express";
import { generateReport, getMyReports, getLatestReport } from "../controllers/aiReportController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/analyze", requireAuth, generateReport);
router.get("/", requireAuth, getMyReports);
router.get("/latest", requireAuth, getLatestReport);

export default router;
