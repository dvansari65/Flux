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
    <nav className="border-b border-[#c8a97e] bg-[#efe1c6] px-4 py-3">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <span className="text-base font-bold text-[#5c3d2e]">
          Intent Settlement
        </span>
        <div className="flex items-center gap-2">
          {publicKey ? (
            <button
              type="button"
              onClick={handleCopyAddress}
              className="rounded-xl border border-[#b08968] bg-[#fff8ec] px-3 py-2 text-sm font-semibold text-[#5c3d2e] shadow-sm transition hover:bg-[#f8edd9]"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleWalletClick}
            disabled={isBusy}
            className="rounded-xl bg-[#6f4e37] px-4 py-2 text-sm font-semibold text-[#fdf6e3] shadow-sm transition hover:bg-[#5c3d2e] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {walletLabel}
          </button>
        </div>
      </div>
    </nav>
  );
}
