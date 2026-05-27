"use client"
import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { toast } from "sonner";
import { isValidSolanaAddress } from "@/helper/validateAddr";

type ChainOptions = "Etherium" | "Solana" | "Arbitrum" | "Base" | "Polygon"

const CHAIN_OPTIONS: ChainOptions[] = ["Etherium", "Solana", "Arbitrum", "Base", "Polygon"]

type TokenOptions = "USDC" | "ETH" | "SOL" | "USDT" | "WBTC" | "MATIC"

const TOKEN_OPTIONS: TokenOptions[] = ["USDC", "ETH", "SOL", "USDT", "WBTC", "MATIC"]

export default function Home() {
  const [inputAmount, setInputAmount] = useState<number | null>(null)
  const [minOutputAmount, setMinOutputAmount] = useState<number | null>(null)
  const [sourceChain, setSourceChain] = useState<ChainOptions>("Solana")
  const [destChain, setDestChain] = useState<ChainOptions>("Etherium")
  const [inputToken, setInputToken] = useState<TokenOptions>("USDC")
  const [outputToken, setOutputToken] = useState<TokenOptions>("ETH")
  const [addr, setAddr] = useState("")
  const [deadline, setDeadline] = useState<number | null>(null);
  const { publicKey, signMessage } = useWallet();
  const [loading, setLoading] = useState(false)
  const handleCreateIntent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true)
      if (!isValidSolanaAddress(addr)) {
        toast.error("Invalid Recipient address!");
        setLoading(false)
        return
      }
      if (!signMessage) {
        toast.error("Browser wallet not laoded!")
        setLoading(false)
        return
      }
      if (!publicKey) {
        toast.error("Wallet not connected!");
        setLoading(false)
        return
      }
      if (typeof inputAmount !== "number" || inputAmount < 0) {
        toast.error("Invalid input amount!");
        setLoading(false)
        return;
      }
      if (typeof minOutputAmount !== "number" || minOutputAmount < 0) {
        toast.error("Invalid minimum output amount!")
        setLoading(false)
        return
      }

      const intent = {
        sourceChain,
        destChain,
        inputToken,
        outputToken,
        inputAmount,
        minOutputAmount,
        senderAddress: publicKey?.toBase58(),
        recipientAddr: addr,
        deadline,
        nonce: Date.now()
      }

     // Sort keys for consistency — same intent always produces same string
    const intentString = JSON.stringify(intent, Object.keys(intent).sort())

    // Pass UTF-8 encoded text — Phantom shows this as readable text to user
    const message = new TextEncoder().encode(intentString)
    const signature = await signMessage(message)

    console.log("Intent:", intent)
    console.log("Signature:", Buffer.from(signature).toString("base64"))
      
    toast.success("Intent signed successfully!")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "something went wrong!")
      throw error
    } finally {
      setLoading(false)
    }
  }
  return (
    <main className="flex-1 overflow-hidden bg-[#f4ead5] flex items-center justify-center px-4 py-4">
      <div className="w-full max-w-2xl bg-[#efe1c6] border border-[#c8a97e] rounded-2xl shadow-xl p-6">

        <div className="mb-5 text-center">
          <h1 className="text-3xl font-bold text-[#5c3d2e] tracking-wide">
            Cross-Chain Intent Settlement
          </h1>
          <p className="mt-2 text-[#7a5c46] text-sm">
            Create your payment intent across chains.
          </p>
        </div>

        <form onSubmit={handleCreateIntent} className="space-y-4">
          {/* Chains */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#5c3d2e] mb-1">
                Source Chain
              </label>

              <select value={sourceChain} onChange={(e) => setSourceChain(e.target.value as ChainOptions)} className="w-full rounded-xl border border-[#b08968] bg-[#fff8ec] px-4 py-2 text-sm text-[#4e342e] focus:outline-none focus:ring-2 focus:ring-[#b08968]">
                <option value="" disabled>Select Source Chain</option>
                {CHAIN_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#5c3d2e] mb-1">
                Destination Chain
              </label>

              <select value={destChain} onChange={(e) => setDestChain(e.target.value as ChainOptions)} className="w-full rounded-xl border border-[#b08968] bg-[#fff8ec] px-4 py-2 text-sm text-[#4e342e] focus:outline-none focus:ring-2 focus:ring-[#b08968]">
                <option value="" disabled>Select Source Chain</option>
                {CHAIN_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Tokens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#5c3d2e] mb-1">
                Input Token
              </label>
              <select
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value as TokenOptions)}
                className="w-full rounded-xl border border-[#b08968] bg-[#fff8ec] px-4 py-2 text-sm text-[#4e342e] focus:outline-none focus:ring-2 focus:ring-[#b08968]"
              >
                {TOKEN_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#5c3d2e] mb-1">
                Output Token
              </label>
              <select
                value={outputToken}
                onChange={(e) => setOutputToken(e.target.value as TokenOptions)}
                className="w-full rounded-xl border border-[#b08968] bg-[#fff8ec] px-4 py-2 text-sm text-[#4e342e] focus:outline-none focus:ring-2 focus:ring-[#b08968]"
              >
                {TOKEN_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#5c3d2e] mb-1">
                Input Amount
              </label>

              <input
                type="number"
                value={inputAmount as number}
                placeholder="1000"
                onChange={(e) => setInputAmount(e.target.value === "" ? null : Number(e.target.value))}
                className="w-full rounded-xl border border-[#b08968] bg-[#fff8ec] px-4 py-2 text-sm text-[#4e342e] placeholder:text-[#9c7c5b] focus:outline-none focus:ring-2 focus:ring-[#b08968]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#5c3d2e] mb-1">
                Minimum Output Amount
              </label>

              <input
                type="number"
                placeholder="0.49"
                value={minOutputAmount as number}
                onChange={(e) => setMinOutputAmount(e.target.value === "" ? null : Number(e.target.value))}
                className="w-full rounded-xl border border-[#b08968] bg-[#fff8ec] px-4 py-2 text-sm text-[#4e342e] placeholder:text-[#9c7c5b] focus:outline-none focus:ring-2 focus:ring-[#b08968]"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-[#5c3d2e] mb-1">
              Recipient Address
            </label>

            <input
              type="text"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-xl border border-[#b08968] bg-[#fff8ec] px-4 py-2 text-sm text-[#4e342e] placeholder:text-[#9c7c5b] focus:outline-none focus:ring-2 focus:ring-[#b08968]"
            />
          </div>

          {/* Deadline & Gas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#5c3d2e] mb-1">
                Deadline
              </label>

              <input
                value={deadline as number}
                type="datetime-local"
                onChange={(e) => {
                  const unixTimestamp = Math.floor(new Date(e.target.value).getTime() / 1000)
                  setDeadline(unixTimestamp)
                }}
                className="w-full rounded-xl border border-[#b08968] bg-[#fff8ec] px-4 py-2 text-sm text-[#4e342e] focus:outline-none focus:ring-2 focus:ring-[#b08968]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#5c3d2e] mb-1">
                Gas Drop Amount
              </label>

              <input
                type="number"
                placeholder="0.002"
                className="w-full rounded-xl border border-[#b08968] bg-[#fff8ec] px-4 py-2 text-sm text-[#4e342e] placeholder:text-[#9c7c5b] focus:outline-none focus:ring-2 focus:ring-[#b08968]"
              />
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full rounded-2xl bg-[#6f4e37] hover:bg-[#5c3d2e] text-[#fdf6e3] py-3 text-base font-semibold transition-all duration-300 shadow-md"
          >
            {
              loading ? "Creating..." : "Create Intent"
            }
          </button>
        </form>
      </div>
    </main>
  );
}
