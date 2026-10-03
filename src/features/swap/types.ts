export const ARC_SWAP_TOKENS = ["USDC", "EURC", "cirBTC"] as const;

export type SwapToken = (typeof ARC_SWAP_TOKENS)[number];

export type SwapQuote = {
  amountIn: string;
  estimatedOutput: string;
  minimumReceived: string;
  fees: readonly { type?: string; token?: string; amount?: string | null }[];
};

export type SwapResultView = {
  paid: string;
  received?: string;
  txHash: string;
  explorerUrl?: string;
  fees: readonly { type?: string; token?: string; amount?: string | null }[];
  status: string;
};
