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
    const history = await getTransactionHistory(req.user.walletPublicKey);
    res.json({ history });
  } catch (err) {
    next(err);
  }
}
