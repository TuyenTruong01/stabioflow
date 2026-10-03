# Flows

Flows is the Stabio Flow workspace for Autopilot DCA, local payment links, invoices, and payment activity.

## Payment request V1

Payment links and invoices are USDC requests on Arc Mainnet (chain ID 5042). A share URL and QR contain a versioned, public request payload: request ID, type, amount, asset, chain, and recipient. They never contain keys, signatures, or private data.

Requests are stored only in the browser's local storage under `stabio-flows-payments-v1`. This V1 does not submit a payment, sign automatically, or claim a payment was received.

## Verification boundary

`PaymentVerifier` is an explicit future integration boundary. Only `applyVerifiedPayment()` can transition a request to `paid`, and it requires verified transaction hash, payer, and confirmation time. Until a reliable verifier is connected, requests remain `waiting`; a receipt is not displayed as paid.

Future work can add server-side storage, an Arc RPC/indexer verifier, expiry jobs, and merchant authentication without changing the request model.
