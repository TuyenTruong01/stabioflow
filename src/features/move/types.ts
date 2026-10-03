export type SourceChain = {
  name: string;
  chainId: number;
  nativeCurrency: { symbol: string; decimals: number } | null;
  explorerUrl: string;
  rpcUrl: string;
  rpcUrls: readonly string[];
  usdcAddress: `0x${string}` | null;
  isArc: boolean;
};

export type BridgeStage = "idle" | "preparingQuote" | "quoteReady" | "wrongNetwork" | "waitingForWallet" | "submitted" | "bridging" | "waitingForAttestation" | "minting" | "completed" | "failed";

export type BridgePreview = { fees: { type: string; token: string; amount: string | null }[]; gasFees: { name: string; token: string; amount: string | null }[]; quote?: unknown };
export type BridgeStep = { name: string; state: string; txHash?: string; explorerUrl?: string; error?: string };
