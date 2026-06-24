import express from "express";
import { signup, login, me, linkStudent, submitFeedback } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/link-student", requireAuth, linkStudent);
router.post("/feedback", requireAuth, submitFeedback);

export default router;
