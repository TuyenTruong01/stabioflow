# ArcPilot — Product & User Guide

## 1. What ArcPilot is
ArcPilot is a non-custodial product concept for managing stablecoin workflows around Arc. The product combines moving funds, Unified Balance, Earn, Swap, and rule-based automation in one interface.

The key product idea is not simply to copy separate Arc utilities. ArcPilot combines them into workflows, especially automated DCA.

## 2. Main modules
### Dashboard
Shows portfolio totals, balances by chain, Arc balance, Earn positions, and active automations.

### Move
Used to move USDC from a supported source chain to Arc or to a Unified Balance. Before execution, the production version should show the route, expected amount received, network/provider fees, and estimated completion information.

### Unified Balance
Represents USDC deposited across supported networks as a unified funding source. It can reduce the need for users to manually decide which chain should fund each action. Exact supported routes must be read from the live Arc/Circle SDK configuration.

### Earn
Lets the user discover supported vaults, preview a deposit or withdrawal, inspect APY and positions, and put idle stablecoins to work. APY is variable and vault/protocol risk remains with the user.

### Swap
Used for supported asset swaps. ArcPilot V1 focuses on USDC -> cirBTC for DCA. The asset list should expand only when supported routes and sufficient liquidity are available.

### Automate / DCA
The distinctive ArcPilot feature. The user defines the asset, amount, frequency, duration, and funding strategy. V1 starts with USDC -> cirBTC.

## 3. DCA funding strategies
### Strategy A — Bridge when needed
Funds stay on the source chain. At each scheduled DCA, only the required amount is moved to Arc and then swapped.

Advantages: capital does not need to be moved to Arc in advance.
Trade-off: repeated cross-chain operations may add cost, time, and more failure points.

### Strategy B — Move once to Arc
The complete DCA budget is moved to Arc once. Future DCA executions occur on Arc.

Advantages: only one initial cross-chain move is required and future executions are Arc-native.
Trade-off: the full budget is moved in advance.

### Strategy B+ — Move once + Earn idle capital
After moving the DCA budget to Arc, the portion not yet needed for the next purchase may be placed in an Earn position. Before a scheduled DCA, the required amount is withdrawn and swapped.

This is more complex than normal DCA and must account for vault withdrawal behavior, live APY, transaction costs, and protocol risk.

### Strategy C — Unified Balance
DCA funding can come from USDC deposited across supported chains. The production app should preview the actual route and cost before the user approves a plan.

## 4. Strategy comparison
ArcPilot should not claim that Arc or any funding strategy is always cheapest. The interface should compare live estimates such as:
- number of cross-chain operations
- expected network/provider fees
- Arc execution fees
- expected received amount
- idle capital location
- whether idle capital can use Earn
- execution complexity and timing

The user chooses the strategy after seeing the comparison.

## 5. Automation security model
A browser wallet cannot normally sign a transaction by itself every week while the user is offline. Production Auto-DCA therefore needs a controlled execution model such as delegated/session permissions or an appropriate smart-account design.

Permissions should be narrow and visible, for example:
- maximum amount per execution
- maximum total/monthly spend
- approved token(s)
- approved contract(s)
- maximum slippage
- expiry date
- pause/revoke controls

ArcPilot must never ask the user to paste a seed phrase or private key into the application or store a normal wallet private key on its backend.

## 6. Example workflow
A user has 1,000 USDC on Base and wants to buy 50 USDC of cirBTC every Monday for 20 weeks.

ArcPilot shows three funding choices:
1. Keep 1,000 USDC on Base and move 50 USDC for every scheduled purchase.
2. Move 1,000 USDC to Arc once, then execute 20 Arc-native swaps.
3. Fund through Unified Balance where supported.

For option 2, ArcPilot may additionally offer Earn for the portion waiting for future DCA executions.

## 7. What V1 should implement
Phase 1: wallet connection, Arc network configuration, real balances, activity UI.

Phase 2: connect Arc/Circle capabilities for Move/Bridge, Unified Balance, Earn, Swap, Send/Add Funds where appropriate.

Phase 3: DCA plan creation with USDC -> cirBTC, strategy comparison, and manual Execute Now. Plans can be created, edited, paused, resumed, or cancelled.

Phase 4: unattended Auto-DCA with explicit delegated/session permissions, spending caps, expiry, slippage limits, execution logs, retries, and failure states.

Phase 5: add more DCA assets only when Arc/Swap routes and liquidity support them reliably; add more sophisticated Earn + DCA workflows after the basic automation is proven.

## 8. Prototype limitations
The included HTML prototype is visual only. Displayed balances, APY, routes, fees, DCA progress, and wallet addresses are examples. It does not execute blockchain transactions or represent live quotes.
