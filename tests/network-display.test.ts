import assert from "node:assert/strict";
import test from "node:test";
import { resolveNetworkDisplayName } from "../src/lib/network-display.ts";

const chains = [
  { chainId: 5042, name: "Arc" },
  { chainId: 42161, name: "Arbitrum" },
  { chainId: 8453, name: "Base" },
];

test("resolves App Kit chain metadata to header-friendly network names", () => {
  assert.equal(resolveNetworkDisplayName(5042, chains), "Arc Mainnet");
  assert.equal(resolveNetworkDisplayName(42161, chains), "Arbitrum Mainnet");
  assert.equal(resolveNetworkDisplayName(8453, chains), "Base");
  assert.equal(resolveNetworkDisplayName(12345, chains), "Unknown network");
});
