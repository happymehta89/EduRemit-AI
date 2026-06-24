import { getAccountInfo, getTransactionHistory } from "../services/stellarService.js";

export async function getWallet(req, res, next) {
  try {
    const info = await getAccountInfo(req.user.walletPublicKey);
    res.json(info);
  } catch (err) {
    next(err);
  }
}

export async function getWalletHistory(req, res, next) {
  try {
    if (!req.user.walletPublicKey) return res.json({ history: [] });
    const history = await getTransactionHistory(req.user.walletPublicKey);
    res.json({ history });
  } catch (err) {
    next(err);
  }
}

export async function connectWallet(req, res, next) {
  try {
    const { publicKey } = req.body;
    if (!publicKey) return res.status(400).json({ error: "publicKey is required." });
    
    req.user.walletPublicKey = publicKey;
    await req.user.save();
    
    res.json({ message: "Wallet connected", user: req.user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}
