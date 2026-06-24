import express from "express";
import {
  getLinkedStudents,
  listUniversities,
  getUniversityPayers,
} from "../controllers/directoryController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/students", requireAuth, getLinkedStudents);
router.get("/universities", requireAuth, listUniversities);
router.get("/university-payers", requireAuth, getUniversityPayers);

export default router;
