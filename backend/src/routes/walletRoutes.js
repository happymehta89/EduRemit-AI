import express from "express";
import { getWallet, getWalletHistory, connectWallet } from "../controllers/walletController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, getWallet);
router.get("/history", requireAuth, getWalletHistory);
router.post("/connect", requireAuth, connectWallet);

export default router;
