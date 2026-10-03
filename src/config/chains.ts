/** Arc Mainnet configuration verified from https://docs.arc.io/integrate/connect-to-arc */
export const ARC_MAINNET = {
  id: 5042,
  hexId: "0x13b2",
  name: "Arc",
  rpcUrl: "https://rpc.mainnet.arc.io",
  explorerUrl: "https://explorer.arc.io",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
} as const;

export const arcWalletChain = {
  chainId: ARC_MAINNET.hexId,
  chainName: ARC_MAINNET.name,
  nativeCurrency: ARC_MAINNET.nativeCurrency,
  rpcUrls: [ARC_MAINNET.rpcUrl],
  blockExplorerUrls: [ARC_MAINNET.explorerUrl],
} as const;
