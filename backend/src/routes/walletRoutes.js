import express from "express";
import { getWallet, getWalletHistory } from "../controllers/walletController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, getWallet);
router.get("/history", requireAuth, getWalletHistory);

export default router;
