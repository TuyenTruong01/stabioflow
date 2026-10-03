type ChainMetadata = { chainId: number; name: string };

function mainnetDisplayName(name: string) {
  return name === "Arc" || name === "Arbitrum" || name === "Ethereum" ? `${name} Mainnet` : name;
}

export function resolveNetworkDisplayName(chainId: number | undefined, chains: readonly ChainMetadata[]) {
  if (chainId === undefined) return "Unknown network";
  const chain = chains.find((item) => item.chainId === chainId);
  return chain ? mainnetDisplayName(chain.name) : "Unknown network";
}
