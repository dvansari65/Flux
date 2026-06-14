"use client";

import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useRef, useState } from "react";

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function Navbar() {
  const {
    publicKey,
    wallet,
    wallets,
    connected,
    connecting,
    disconnecting,
    select,
    connect,
    disconnect,
  } = useWallet();
  const shouldConnectRef = useRef(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);

  const availableWallet = useMemo(
    () =>
      wallets.find((item) => item.readyState === WalletReadyState.Installed) ??
      wallets[0],
    [wallets]
  );

  useEffect(() => {
    if (!shouldConnectRef.current || !wallet || connected || connecting) return;
    shouldConnectRef.current = false;
    connect().catch((error) => {
      console.error("Failed to connect wallet:", error);
    });
  }, [connect, connected, connecting, wallet]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleWalletClick = async () => {
    if (connected) {
      await disconnect();
      return;
    }
    if (!wallet && availableWallet) {
      shouldConnectRef.current = true;
      select(availableWallet.adapter.name);
      return;
    }
    await connect();
  };

  const handleCopyAddress = async () => {
    const address = publicKey?.toBase58();
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
  };

  const isBusy = connecting || disconnecting;
  const walletLabel = publicKey
    ? shortenAddress(publicKey.toBase58())
    : isBusy
      ? "Connecting..."
      : "Connect Wallet";

  return (
    <nav className="border-b border-white/[0.06] bg-[#08090c]/80 backdrop-blur-xl px-4 py-3">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <span className="text-base font-bold text-white">
          Intent Settlement
        </span>
        <div className="flex items-center gap-2">
          {publicKey ? (
            <button
              type="button"
              onClick={handleCopyAddress}
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleWalletClick}
            disabled={isBusy}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {walletLabel}
          </button>
        </div>
      </div>
    </nav>
  );
}
