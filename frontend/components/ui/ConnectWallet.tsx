"use client";

import { useState, useEffect } from "react";
import { isAllowed, setAllowed, requestAccess, getAddress } from "@stellar/freighter-api";
import { Button } from "./Button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function ConnectWallet() {
  const { user, refreshUser } = useAuth();
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
      if (typeof pubKeyObj !== "string" && 'error' in pubKeyObj) {
        throw new Error(pubKeyObj.error);
      }
      
      const res = await getAddress();
      const publicKey = typeof res === "string" ? res : res.address;
      
      // Save it to backend
      await api.post("/wallet/connect", { publicKey });
      
      setConnectedKey(publicKey);
      if (refreshUser) refreshUser(); // Refresh user data
    } catch (err) {
      console.error("Failed to connect Freighter:", err);
      alert("Please ensure the Freighter extension is installed and unlocked.");
    } finally {
      setLoading(false);
    }
  }

  if (connectedKey) {
    return (
      <button 
        onClick={handleConnect}
        disabled={loading}
        className="flex items-center gap-2 text-sm text-sand bg-ledger-light hover:bg-ledger-light/80 px-3 py-1.5 rounded-md border border-ledger transition-colors"
        title="Change Wallet"
      >
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        {loading ? "Connecting..." : `${connectedKey.slice(0, 6)}...${connectedKey.slice(-4)}`}
      </button>
    );
  }

  return (
    <Button onClick={handleConnect} disabled={loading} variant="secondary">
      {loading ? "Connecting..." : "Connect Freighter Wallet"}
    </Button>
  );
}
