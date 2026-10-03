# Stabio Flow

Stabio Flow is a non-custodial web application for stablecoin operations on Arc. It brings supported wallet balances, USDC movement, Earn vaults, swaps, payments, and local automation into one wallet-controlled interface.

## What it does

### Dashboard

- Reads configured wallet assets across supported networks.
- Shows portfolio allocation, available USDC, and Earn value.
- Uses Arc App Kit rates with a public price fallback when available.
- Clearly marks partial or unavailable valuation instead of treating a missing price as a zero balance.

### Move

- **Bridge:** moves USDC between Arc and supported networks using live Circle Arc App Kit estimates.
- **Send:** transfers USDC to a recipient address on the selected network.
- Requires the connected wallet to be on the source network before a transaction can be submitted.

### Earn

- Discovers eligible USDC and EURC vault opportunities on Arc.
- Reads available USDC and existing Earn positions.
- Supports deposit and withdrawal review flows through the connected wallet where supported by the vault and SDK.

### Swap

- Requests live Arc quotes for supported USDC, EURC, and cirBTC routes.
- Shows unavailable quote fields honestly when the SDK does not return a value.
- Clears stale quotes whenever relevant trade inputs change.

### Payment & Automation

- **Autopilot:** local scheduled or RSI-based USDC-to-cirBTC DCA plans.
- **Request Payment:** local Arc Mainnet USDC payment links and invoices with shareable URLs and QR codes.
- **Payment Activity:** local records of created payment requests.

Autopilot plans are evaluated only while the application is open and the user checks them. Each eligible trade still needs a fresh quote and wallet confirmation.

### Agents — Coming soon

The Agents section is currently informational only. It outlines planned Payment, Treasury, Yield, Risk, Settlement, and Service Agents. No agent is active, has a wallet, holds funds, or can initiate transactions in this release.

## Security and custody

Stabio Flow is non-custodial:

- It does not store seed phrases or private keys.
- It does not use delegated signing or background trading.
- Onchain actions are reviewed and signed through the connected wallet.
- Users should verify the network, recipient, amount, token approval, and fees in their wallet before confirming a transaction.

## Current limitations

- The dashboard reads only the assets configured by the application; it is not a complete wallet indexer.
- Portfolio valuation depends on currently available rates. A known asset balance may be unvalued.
- Vault APY, availability, and withdrawal liquidity are variable and not guaranteed.
- Payment requests are stored locally in the browser in V1. They do not submit an incoming payment or independently verify one, so requests remain `Waiting` until a reliable verifier is integrated.
- This project is active development software and is not investment, custody, or payment-processing advice.

## Stack

- Next.js 16, React 19, and TypeScript
- viem and an EIP-1193 browser wallet provider
- Circle Arc App Kit and Circle's viem adapter
- Browser local storage for local Autopilot plans and payment-request records

## Local development

Prerequisites:

- Node.js 22 or later
- A browser wallet compatible with EIP-1193

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open the local URL shown by Next.js. Do not open the repository's legacy `index.html` file directly; it is a static artifact and does not reflect the current Next.js application.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Project guides

- [Autopilot guide](docs/AUTOMATE.md)
- [Flows guide](docs/FLOWS.md)
- [About page](src/app/help/page.tsx)

