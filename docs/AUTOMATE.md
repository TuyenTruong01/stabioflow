# Stabio Autopilot V1

Stabio Autopilot converts a user-created USDC-to-cirBTC DCA plan into a local, wallet-confirmed workflow. It is an agent-assisted planner, not an autonomous trading system.

## Lifecycle

1. The user creates a daily or weekly plan with an amount, time, browser timezone, total budget, maximum slippage, and maximum fee.
2. When the app is open, the user can run a due check. The deterministic rule engine verifies the plan state and remaining budget.
3. For plans with a condition, Stabio fetches BTC/USD daily close data, calculates Wilder RSI(14), and marks the check ready, skipped, or failed.
4. A ready plan can request a fresh App Kit USDC-to-cirBTC quote. The quote fee must be present, denominated in USDC, parseable, and within the plan limit. The configured maximum slippage is passed directly to the existing App Kit quote and execution path.
5. The user reviews the quote and signs the real transaction with their connected wallet. No private key, seed phrase, delegated signer, or smart contract is used by Autopilot.

## Market analysis and execution are separate

BTC/USD market history is only used for the optional RSI rule. It never determines a cirBTC output amount. A live Arc App Kit quote determines the actual swap amount, minimum received, and any SDK-provided fees at review time.

V1 uses CoinGecko's BTC market-chart endpoint for daily closes, with a short in-memory cache. If the data is unavailable, stale, or insufficient, the condition is not considered satisfied.

## Scheduling

Plans persist in versioned browser local storage. Next checks are calculated with the browser timezone and daily/weekly schedule. V1 evaluates only when the app is loaded and the user invokes a check. It does not run while the browser is closed and does not guarantee background execution.

## Future architecture

A future server scheduler may trigger notifications or prepare a review. Fully unattended execution would require a separately designed, verified delegation model with explicit spending caps, token/route allowlists, pause controls, auditing, and user consent. It is not part of V1.
