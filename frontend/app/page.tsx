"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { validateIntentParams } from "@/helper/validateIntent";
import {
  SUPPORTED_CHAINS,
  SupportedChain,
  convertIntoRawUnits,
  IntentArgs,
  SUPPORTED_TOKENS,
  TokenSymbol,
} from "@intent/shared";
import { useLockFunds } from "@/api/lockFunds";
import { tokenMint } from "@/helpers/tokenMint";
import { getDestChainID } from "@/helpers/destChainId";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpDown,
  Settings2,
  ChevronDown,
  Clock,
  Zap,
  Shield,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Info,
  X,
  TrendingUp,
  Fuel,
  Users,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteType = "FAST" | "MAX_RETURN" | "SECURE";

// ─── Constants ────────────────────────────────────────────────────────────────

const CHAIN_META: Record<SupportedChain, { logo: string; color: string; label: string }> = {
  Solana:   { logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",   color: "#9945FF", label: "Solana" },
  Ethereum: { logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png", color: "#627EEA", label: "Ethereum" },
  Arbitrum: { logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png", color: "#12AAFF", label: "Arbitrum" },
  Base:     { logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",     color: "#0052FF", label: "Base" },
  Polygon:  { logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png", color: "#8247E5", label: "Polygon" },
  Avalanche:{ logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png", color: "#E84142", label: "Avalanche" },
  Optimism: { logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png", color: "#FF0420", label: "Optimism" },
  BSC:      { logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png", color: "#F3BA2F", label: "BSC" },
};

const TOKEN_META: Record<TokenSymbol, { logo: string; color: string; name: string }> = {
  USDC: { logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png", color: "#2775CA", name: "USD Coin" },
  ETH:  { logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",                                                  color: "#627EEA", name: "Ethereum" },
  SOL:  { logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",                                                    color: "#9945FF", name: "Solana" },
  USDT: { logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",    color: "#26A17B", name: "Tether" },
  WBTC: { logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png",    color: "#F7931A", name: "Wrapped Bitcoin" },
  MATIC:{ logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",                                                   color: "#8247E5", name: "Polygon" },
};



// ─── Sub-components ───────────────────────────────────────────────────────────

function TokenChainSelector({
  token, chain, onTokenChange, onChainChange, label,
}: {
  token: TokenSymbol; chain: SupportedChain;
  onTokenChange: (t: TokenSymbol) => void; onChainChange: (c: SupportedChain) => void;
  label: string;
}) {
  const [tokenOpen, setTokenOpen] = useState(false);
  const [chainOpen, setChainOpen] = useState(false);
  const tokenRef = useRef<HTMLDivElement>(null);
  const chainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tokenRef.current && !tokenRef.current.contains(e.target as Node)) setTokenOpen(false);
      if (chainRef.current && !chainRef.current.contains(e.target as Node)) setChainOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Chain Picker */}
      <div ref={chainRef} className="relative">
        <button
          type="button"
          onClick={() => { setChainOpen(!chainOpen); setTokenOpen(false); }}
          className="flex items-center gap-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/5 text-xs text-zinc-300 py-1 pl-2 pr-2 rounded-full transition-all group"
        >
          <img src={CHAIN_META[chain].logo} alt={CHAIN_META[chain].label} className="w-4 h-4 rounded-full object-cover" />
          <span className="max-w-[60px] truncate">{CHAIN_META[chain].label}</span>
          <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${chainOpen ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {chainOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 left-0 w-44 bg-zinc-900 border border-white/10 rounded-2xl p-1.5 shadow-2xl z-50"
            >
              {SUPPORTED_CHAINS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onChainChange(c); setChainOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors text-left ${chain === c ? "bg-purple-500/10 text-purple-300" : "text-zinc-300 hover:bg-white/5"}`}
                >
                  <img src={CHAIN_META[c].logo} alt={CHAIN_META[c].label} className="w-5 h-5 rounded-full object-cover shrink-0" />
                  {CHAIN_META[c].label}
                  {chain === c && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-purple-400" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Token Picker */}
      <div ref={tokenRef} className="relative">
        <button
          type="button"
          onClick={() => { setTokenOpen(!tokenOpen); setChainOpen(false); }}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-1.5 pl-2 pr-2.5 rounded-2xl transition-all text-sm"
        >
          <img
            src={TOKEN_META[token].logo}
            alt={token}
            className="w-5 h-5 rounded-full object-cover"
          />
          {token}
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${tokenOpen ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {tokenOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 right-0 w-52 bg-zinc-900 border border-white/10 rounded-2xl p-1.5 shadow-2xl z-50"
            >
              <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Select Token</p>
              {SUPPORTED_TOKENS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { onTokenChange(t); setTokenOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${token === t ? "bg-purple-500/10" : "hover:bg-white/5"}`}
                >
                  <img
                    src={TOKEN_META[t].logo}
                    alt={t}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div>
                    <p className={`text-sm font-semibold ${token === t ? "text-purple-300" : "text-white"}`}>{t}</p>
                    <p className="text-[11px] text-zinc-500">{TOKEN_META[t].name}</p>
                  </div>
                  {token === t && <CheckCircle2 className="w-4 h-4 ml-auto text-purple-400 shrink-0" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [inputAmount, setInputAmount] = useState<number | "">("");
  const [minOutputAmount, setMinOutputAmount] = useState<number | "">("");
  const [sourceChain, setSourceChain] = useState<SupportedChain>("Solana");
  const [destChain, setDestChain] = useState<SupportedChain>("Ethereum");
  const [inputToken, setInputToken] = useState<TokenSymbol>("USDC");
  const [outputToken, setOutputToken] = useState<TokenSymbol>("ETH");
  const [addr, setAddr] = useState("");
  const [routePref, setRoutePref] = useState<RouteType>("FAST");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [slippage, setSlippage] = useState("0.5");
  const [isSwapping, setIsSwapping] = useState(false);

  const { publicKey, signMessage } = useWallet();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<"ata" | "intent" | null>(null);
  const { mutate: lockFunds, isPending } = useLockFunds();


  const handleSwapDirection = () => {
    setIsSwapping(true);
    setTimeout(() => {
      setSourceChain(destChain);
      setDestChain(sourceChain);
      setInputToken(outputToken);
      setOutputToken(inputToken);
      setInputAmount(minOutputAmount);
      setIsSwapping(false);
    }, 200);
  };

  const handleUseSelf = () => {
    if (publicKey) setAddr(publicKey.toBase58());
    else toast.error("Wallet not connected");
  };

  const handleCreateIntent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const validation = validateIntentParams({
        destChain,
        recipientAddress: addr,
        isWalletConnected: !!publicKey,
        hasSignMessage: !!signMessage,
        inputAmount,
        minOutputAmount,
        inputToken,
        outputToken,
      });

      if (!validation.isValid) {
        toast.error(validation.error);
        setLoading(false);
        return;
      }

      const convertedInput  = convertIntoRawUnits(inputToken, typeof inputAmount === "number" ? inputAmount : null);
      const convertedOutput = convertIntoRawUnits(outputToken, typeof minOutputAmount === "number" ? minOutputAmount : null);
      if (!convertedInput || !convertedOutput) { toast.error("Failed to convert token units!"); return; }
      if (!publicKey) return;

      const nonce       = Date.now();
      const deadlineMins = routePref === "FAST" ? 5 : routePref === "SECURE" ? 60 : 15;
      const deadline    = Math.floor(Date.now() / 1000) + deadlineMins * 60;

      const args: IntentArgs = {
        inputMint:        tokenMint(inputToken),
        outputMint:       tokenMint(outputToken),
        inputAmount:      convertedInput as number,
        minOutputAmount:  convertedOutput as number,
        destinationChain: getDestChainID(destChain),
        recipient:        publicKey,
        deadline,
        nonce,
      };

      lockFunds(args, {
        onSuccess: () => {
          setLoadingStep(null);
          toast.success("Funds locked! Intent broadcast to solvers.");
        },
        onError: (e) => {
          setLoadingStep(null);
          toast.error(`Failed to lock funds: ${e.message}`);
        },
      });
    } catch (err: any) {
      toast.error(err.message || "Something went wrong!");
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  const isLoading  = loading || isPending;
  const canSubmit  = !isLoading && !!inputAmount;

  return (
    <main className="h-screen bg-[#08090c] text-white flex flex-col items-center justify-center px-4 py-4 font-[var(--font-geist-sans)] selection:bg-violet-500/20 relative overflow-hidden">

      {/* ── Ambient background blobs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-violet-600/8 rounded-full blur-[140px]" />
        <div className="absolute -bottom-60 -right-20 w-[600px] h-[600px] bg-blue-600/6 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 mb-4 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[11px] font-medium mb-2.5 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Intent Protocol · Solver Network Active
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1.5 leading-tight">
          Cross-Chain Swaps,{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-blue-400">
            Solver Settled
          </span>
        </h1>
        <p className="text-zinc-500 text-[13px] max-w-sm mx-auto">
          Submit your intent. Solvers compete for best execution.
        </p>
      </motion.div>

      {/* ── Main Widget ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-[488px] z-10 relative"
      >
        {/* Outer glow border */}
        <div className="absolute -inset-px rounded-[28px] bg-gradient-to-b from-white/10 to-white/0 pointer-events-none" />

        <div className="relative bg-zinc-950/80 border border-white/[0.06] rounded-[26px] backdrop-blur-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.8)] overflow-visible">
          <form onSubmit={handleCreateIntent}>

            {/* ── Top toolbar ── */}
            <div className="flex items-center justify-between px-4 pt-4 pb-1">
              <div className="flex gap-1 bg-zinc-900/60 p-1 rounded-xl">
                <button type="button" className="px-3 py-1 rounded-lg text-xs font-medium text-white bg-zinc-800">Swap</button>
                <button type="button" className="px-3 py-1 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">Bridge</button>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-1.5 rounded-xl transition-all ${isSettingsOpen ? "bg-violet-500/10 text-violet-400" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"}`}
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ── Settings Panel ── */}
            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden px-5"
                >
                  <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 my-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-zinc-300">Slippage Tolerance</span>
                      <button type="button" onClick={() => setIsSettingsOpen(false)}>
                        <X className="w-4 h-4 text-zinc-500 hover:text-zinc-300" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {["0.1", "0.5", "1.0", "Auto"].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSlippage(val)}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${
                            slippage === val
                              ? "bg-violet-500/10 border-violet-500/40 text-violet-300"
                              : "bg-white/3 border-white/5 text-zinc-400 hover:bg-white/6 hover:text-zinc-200"
                          }`}
                        >
                          {val === "Auto" ? val : `${val}%`}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-zinc-600 mt-2 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Your transaction reverts if the price changes unfavorably by more than this percentage.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Pay panel ── */}
            <div className="px-3 pt-1.5">
              <motion.div
                animate={{ opacity: isSwapping ? 0 : 1, y: isSwapping ? -8 : 0 }}
                className="group bg-zinc-900/40 hover:bg-zinc-900/70 border border-white/[0.04] hover:border-white/[0.08] focus-within:border-violet-500/30 rounded-2xl p-3 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-500 font-medium">You pay</span>
                  <TokenChainSelector
                    token={inputToken}
                    chain={sourceChain}
                    label="Source"
                    onTokenChange={setInputToken}
                    onChainChange={setSourceChain}
                  />
                </div>
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <input
                      type="number"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0"
                      min={0}
                      className="w-full bg-transparent text-[32px] font-semibold text-white placeholder:text-zinc-700 focus:outline-none leading-none tabular-nums"
                    />
                  </div>
                  {publicKey && (
                    <div className="text-right ml-3 pt-1 shrink-0">
                      <p className="text-[11px] text-zinc-600">Balance</p>
                      <p className="text-xs text-zinc-400 font-medium">—</p>
                      <button type="button" className="text-[10px] text-violet-400 hover:text-violet-300 mt-0.5 font-medium">MAX</button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* ── Swap Direction Arrow ── */}
            <div className="relative flex items-center justify-center h-4 my-0.5 z-20">
              <button
                type="button"
                onClick={handleSwapDirection}
                className="group absolute w-11 h-11 bg-zinc-900 hover:bg-zinc-800 border-4 border-zinc-950 rounded-[16px] flex items-center justify-center transition-all hover:border-violet-500/20 shadow-xl"
              >
                <ArrowUpDown className="w-4 h-4 text-zinc-400 group-hover:text-violet-400 group-hover:scale-110 transition-all duration-200" />
              </button>
            </div>

            {/* ── Receive panel ── */}
            <div className="px-3 pb-1.5">
              <motion.div
                animate={{ opacity: isSwapping ? 0 : 1, y: isSwapping ? 8 : 0 }}
                className="group bg-zinc-900/40 hover:bg-zinc-900/70 border border-white/[0.04] hover:border-white/[0.08] rounded-2xl p-3 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-500 font-medium">You receive</span>
                  <TokenChainSelector
                    token={outputToken}
                    chain={destChain}
                    label="Destination"
                    onTokenChange={setOutputToken}
                    onChainChange={setDestChain}
                  />
                </div>
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <input
                      type="number"
                      value={minOutputAmount}
                      onChange={(e) => setMinOutputAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-transparent text-[32px] font-semibold placeholder:text-zinc-700 focus:outline-none leading-none tabular-nums text-emerald-400"
                    />
                  </div>
                  {typeof inputAmount === "number" && inputAmount > 0 && typeof minOutputAmount === "number" && (
                    <div className="ml-3 pt-2 shrink-0 text-right">
                      <span className="text-[11px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                        Min. received
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* ── Recipient Address ── */}
            <div className="px-3 pb-1.5">
              <div className="flex items-center gap-2 bg-zinc-900/40 border border-white/[0.04] focus-within:border-violet-500/30 rounded-xl px-3 py-2 transition-all">
                <Wallet className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <input
                  type="text"
                  value={addr}
                  onChange={(e) => setAddr(e.target.value)}
                  placeholder="Recipient address on destination chain"
                  className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleUseSelf}
                  className="text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 border border-white/5 px-2 py-0.5 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all shrink-0"
                >
                  Self
                </button>
              </div>
            </div>

           
            {/* ── CTA Button ── */}
            <div className="px-3 pb-3">
              <button
                type="submit"
                disabled={!canSubmit}
                className="relative w-full py-3 rounded-xl font-semibold text-sm transition-all overflow-hidden group
                  enabled:bg-gradient-to-r enabled:from-violet-600 enabled:to-blue-600
                  enabled:hover:from-violet-500 enabled:hover:to-blue-500
                  enabled:shadow-[0_0_32px_-4px_rgba(139,92,246,0.4)]
                  enabled:hover:shadow-[0_0_40px_-4px_rgba(139,92,246,0.6)]
                  disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {/* Shine */}
                <span className="absolute inset-0 -translate-x-full group-enabled:group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {loadingStep === "ata" ? "Setting up token account..." : "Broadcasting Intent..."}
                  </>
                ) : !inputAmount ? (
                  <span className="text-zinc-600">Enter an amount</span>
                ) : (
                  <>
                    Create Intent
                    <ArrowRight className="w-3.5 h-3.5 group-enabled:group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </motion.div>

      {/* ── Footer trust indicators ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-3 z-10 flex items-center gap-4 text-zinc-600 text-[11px]"
      >
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500/60" />MEV Protected</span>
        <span className="w-px h-2.5 bg-zinc-800" />
        <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-500/60" />Non-custodial</span>
        <span className="w-px h-2.5 bg-zinc-800" />
        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-violet-500/60" />12 Solvers</span>
      </motion.div>

    </main>
  );
}
