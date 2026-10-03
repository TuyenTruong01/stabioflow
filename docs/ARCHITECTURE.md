# Stabio Flow architecture

Stabio Flow uses Next.js, TypeScript, and the App Router. UI is component-based; the wallet provider owns connection state, chain state, and the native Arc USDC balance.

```
src/app                 Route pages
src/components/Header   Responsive application header
src/components/Wallet   EIP-1193 wallet state and network switching
src/config              Verified network configuration
src/lib                 Formatting and future Arc/Circle integrations
```

Milestone 1 reads only the wallet address, active chain, and native Arc USDC balance. It does not submit transactions.
