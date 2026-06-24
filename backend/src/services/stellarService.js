import * as StellarSdk from "@stellar/stellar-sdk";
import fetch from "node-fetch";

const HORIZON_URL = process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const FRIENDBOT_URL = process.env.STELLAR_FRIENDBOT_URL || "https://friendbot.stellar.org";
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

/**
 * Generates a brand-new Stellar testnet keypair and funds it via Friendbot.
 * Returns { publicKey, secretKey }.
 *
 * NOTE on secret keys: this is a TESTNET DEMO. We store the secret key so the
 * app can sign transactions on the user's behalf without a wallet popup, which
 * keeps the demo flow simple. This is NOT how you'd handle real funds — a
 * production app must never hold user secret keys server-side; use a
 * non-custodial flow (Freighter/Albedo wallet signing, or a signing service
 * with proper key management/HSM) instead. Flagged clearly in the README too.
 */
export async function createFundedWallet() {
  const pair = StellarSdk.Keypair.random();

  try {
    const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(pair.publicKey())}`);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Friendbot funding failed: ${res.status} ${body}`);
    }
  } catch (err) {
    console.error("[stellar] Friendbot funding error:", err.message);
    throw new Error(
      "Could not fund testnet wallet via Friendbot. The testnet or network may be temporarily unavailable — try again shortly."
    );
  }

  return {
    publicKey: pair.publicKey(),
    secretKey: pair.secret(),
  };
}

/**
 * Fetches current XLM balance and basic account info for a public key.
 */
export async function getAccountInfo(publicKey) {
  try {
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find((b) => b.asset_type === "native");
    return {
      publicKey,
      balance: nativeBalance ? parseFloat(nativeBalance.balance) : 0,
      sequence: account.sequenceNumber(),
      exists: true,
    };
  } catch (err) {
    if (err?.response?.status === 404) {
      return { publicKey, balance: 0, exists: false };
    }
    throw err;
  }
}

/**
 * Sends a native XLM payment from sender to receiver on testnet.
 * senderSecretKey must correspond to senderPublicKey.
 * Returns { hash, ledger, successful }.
 */
export async function sendPayment({ senderSecretKey, receiverPublicKey, amount, memo = "" }) {
  const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecretKey);
  const senderPublicKey = senderKeypair.publicKey();

  const senderAccount = await server.loadAccount(senderPublicKey);

  const txBuilder = new StellarSdk.TransactionBuilder(senderAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  }).addOperation(
    StellarSdk.Operation.payment({
      destination: receiverPublicKey,
      asset: StellarSdk.Asset.native(),
      amount: amount.toString(),
    })
  );

  if (memo) {
    txBuilder.addMemo(StellarSdk.Memo.text(memo.slice(0, 28))); // Stellar memo text limit
  }

  const transaction = txBuilder.setTimeout(60).build();
  transaction.sign(senderKeypair);

  const result = await server.submitTransaction(transaction);

  return {
    hash: result.hash,
    ledger: result.ledger,
    successful: result.successful !== false,
  };
}

/**
 * Builds an unsigned native XLM payment transaction from sender to receiver.
 * Returns the transaction XDR string to be signed by the frontend.
 */
export async function buildPaymentXDR({ senderPublicKey, receiverPublicKey, amount, memo = "" }) {
  const senderAccount = await server.loadAccount(senderPublicKey);

  const txBuilder = new StellarSdk.TransactionBuilder(senderAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  }).addOperation(
    StellarSdk.Operation.payment({
      destination: receiverPublicKey,
      asset: StellarSdk.Asset.native(),
      amount: amount.toString(),
    })
  );

  if (memo) {
    txBuilder.addMemo(StellarSdk.Memo.text(memo.slice(0, 28)));
  }

  const transaction = txBuilder.setTimeout(300).build(); // 5 minutes to sign
  return transaction.toXDR();
}

/**
 * Submits a signed transaction XDR to the Horizon network.
 */
export async function submitSignedXDR(signedXDR) {
  const transaction = StellarSdk.TransactionBuilder.fromXDR(signedXDR, NETWORK_PASSPHRASE);
  const result = await server.submitTransaction(transaction);
  
  return {
    hash: result.hash,
    ledger: result.ledger,
    successful: result.successful !== false,
  };
}

/**
 * Fetches recent payment operations for a given public key, for the
 * "transaction history" view. Returns Horizon's records, lightly shaped.
 */
export async function getTransactionHistory(publicKey, limit = 20) {
  try {
    const page = await server
      .payments()
      .forAccount(publicKey)
      .order("desc")
      .limit(limit)
      .call();

    return page.records
      .filter((r) => r.type === "payment" || r.type === "create_account")
      .map((r) => ({
        id: r.id,
        type: r.type,
        from: r.from || r.funder,
        to: r.to || r.account,
        amount: r.amount || r.starting_balance,
        asset: r.asset_type === "native" ? "XLM" : r.asset_code,
        createdAt: r.created_at,
        transactionHash: r.transaction_hash,
      }));
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throw err;
  }
}

export const horizonExplorerUrl = (hash) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;
