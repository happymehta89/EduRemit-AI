"use client";

import { useState, useEffect } from "react";
import { isAllowed, setAllowed, requestAccess, getPublicKey } from "@stellar/freighter-api";
import { Button } from "./Button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function ConnectWallet() {
  const { user, mutate } = useAuth();
  const [connectedKey, setConnectedKey] = useState<string | null>(user?.walletPublicKey || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.walletPublicKey) {
      setConnectedKey(user.walletPublicKey);
    }
  }, [user]);

  async function handleConnect() {
    setLoading(true);
    try {
      const allowed = await isAllowed();
      if (!allowed) {
        await setAllowed();
      }
      
      const pubKeyObj = await requestAccess();
      if (pubKeyObj.error) {
        throw new Error(pubKeyObj.error);
      }
      
      const publicKey = typeof pubKeyObj === "string" ? pubKeyObj : await getPublicKey();
      
      // Save it to backend
      await api.post("/wallet/connect", { publicKey });
      
      setConnectedKey(publicKey);
      if (mutate) mutate(); // Refresh user data
    } catch (err) {
      console.error("Failed to connect Freighter:", err);
      alert("Please ensure the Freighter extension is installed and unlocked.");
    } finally {
      setLoading(false);
    }
  }

  if (connectedKey) {
    return (
      <div className="flex items-center gap-2 text-sm text-sand bg-ledger-light px-3 py-1.5 rounded-md border border-ledger">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        {connectedKey.slice(0, 6)}...{connectedKey.slice(-4)}
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} disabled={loading} variant="secondary">
      {loading ? "Connecting..." : "Connect Freighter Wallet"}
    </Button>
  );
}
