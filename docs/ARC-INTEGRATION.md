# Arc integration register

| Feature | Official source | SDK/package | Arc Mainnet | Assets | Status | Notes |
|---|---|---|---|---|---|---|
| Wallet connection and switching | https://docs.arc.io/integrate/connect-to-arc | `viem`, `wagmi` (officially listed) | Yes, chain ID 5042 | Native USDC | Integrated | Uses EIP-1193 wallet methods. RPC: `https://rpc.mainnet.arc.io`. |
| Native Arc USDC balance | https://docs.arc.io/integrate/connect-to-arc | `viem` | Yes | USDC | Integrated | Reads `eth_getBalance`; Arc docs say native and ERC-20 USDC share one balance. |
| Bridge | https://docs.arc.io/app-kit/bridge ; https://docs.arc.io/app-kit/quickstarts/bridge-tokens-across-blockchains ; https://docs.arc.io/app-kit/tutorials/bridge/estimate-costs | `@circle-fin/app-kit`, `@circle-fin/adapter-viem-v2`, `viem` | Yes | USDC | Integrated; not mainnet-tested | Uses App Kit `getSupportedChains("bridge", {chainType:"evm",isTestnet:false})`, `estimateBridge()`, and `bridge()`. Each candidate route requires a live estimate before confirmation. |
| Unified Balance | https://docs.arc.io/app-kit | `@circle-fin/app-kit` / Unified Balance Kit | To verify | To verify | TODO | Kept distinct from Bridge. |
| Swap | https://docs.arc.io/app-kit/swap ; https://docs.arc.io/app-kit/quickstarts/swap-tokens-same-chain ; https://docs.arc.io/app-kit/references/supported-blockchains | `@circle-fin/app-kit`, `@circle-fin/adapter-viem-v2`, `viem` | Yes | USDC, EURC, cirBTC | Integrated; live route untested | Uses `getSupportedChains("swap")`, `estimateSwap()` and `swap()`. A pair is actionable only after its live estimate succeeds. |
| Earn | https://docs.arc.io/app-kit/earn ; https://docs.arc.io/app-kit/quickstarts/earn-deposit ; https://docs.arc.io/app-kit/quickstarts/earn-withdraw | `@circle-fin/app-kit`, `@circle-fin/adapter-viem-v2` | Yes | USDC and EURC | Integrated; live data untested | Uses SDK vault discovery, positions, quotes, deposit and withdrawal. |

## Bridge notes

Bridge is backed by CCTP and the SDK orchestrates approval, burn, attestation, and mint. `BridgeResult.steps` returns status, transaction hash, and explorer URL for each step. CCTP Fast transfers can charge a protocol fee; Standard transfers do not. Fee estimates are read from `estimateBridge().fees` and gas estimates from `estimateBridge().gasFees`. The UI intentionally does not invent expected-received amounts or timing when the SDK does not provide those fields.

The SDK lists many EVM chains with Bridge capability. The source selector is derived at runtime from the SDK's current mainnet EVM Bridge configuration, excluding Arc. A selected route is actionable only after a live `estimateBridge()` succeeds; the public documentation does not expose a static Arc-destination route matrix.

## Swap notes

Arc App Kit documents same-chain Swap support on Arc Mainnet and lists USDC, EURC, and cirBTC as the currently supported Arc swap assets: https://docs.arc.io/app-kit/swap and https://docs.arc.io/app-kit/references/supported-blockchains. The app presents only this official current set and uses the SDK aliases rather than embedding a router, liquidity source, rate, or token address.

`estimateSwap()` is the only quote source. Its live `estimatedOutput`, `stopLimit`, and `fees` are displayed where returned; the SDK does not provide a price-impact field, so the UI explicitly says so instead of calculating one. The App Kit swap configuration supports `slippageBps`; the UI starts at 3% (300 bps), which is the documented SDK default: https://docs.arc.io/app-kit/tutorials/swap/set-slippage-tolerance-or-stop-limit.

Arc USDC is read as the native balance using `eth_getBalance`, per https://docs.arc.io/integrate/connect-to-arc. For cirBTC/EURC, the app first asks App Kit to resolve the alias through its official token-rate/registry response and only then calls ERC-20 `balanceOf`; it has no embedded token address or decimals. `swap()` owns the official allowance/approval path; Stabio Flow does not submit a separate unlimited approval. Execution happens only after the separate Review step and an explicit Confirm click.

## Earn notes

Arc supports Earn for USDC and EURC. The app uses `kit.earn.exploreVaults()`, `getPosition()`, `getDepositQuote()`, `getWithdrawalQuote()`, `deposit()`, and `withdraw()` against the exact vault addresses returned by the SDK. It shows APY only when the SDK returns `currentApy`, and never creates a synthetic yield figure.

Earn deposits mint vault shares; their redemption value reflects lending returns and vault performance/management fees. Same-chain deposits have no Earn deposit fee. The first withdrawal can require a vault-share approval and the SDK owns that flow, so a wallet can show two requests. Sources: https://docs.arc.io/app-kit/earn ; https://docs.arc.io/app-kit/concepts/earn-fees ; https://docs.arc.io/app-kit/references/earn-error-handling.
