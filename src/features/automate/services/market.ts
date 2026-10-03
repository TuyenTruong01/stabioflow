import type { AutomationCondition, MarketSeries } from "../types.ts";

type Timeframe = AutomationCondition["timeframe"];
const cache = new Map<Timeframe, { expires: number; data: MarketSeries }>();

function aggregateFourHour(prices: [number, number][]) {
  const candles = new Map<number, number>();
  for (const [timestamp, price] of prices) candles.set(Math.floor(timestamp / 14_400_000), price);
  return [...candles.values()];
}

export interface MarketDataService { getBitcoinCloses(timeframe: Timeframe): Promise<MarketSeries>; }
export const coinGeckoMarketData: MarketDataService = { async getBitcoinCloses(timeframe) { const cached = cache.get(timeframe); if (cached && cached.expires > Date.now()) return cached.data; const interval = timeframe === "1D" ? "daily" : "hourly"; const response = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=${interval}`); if (!response.ok) throw new Error("Market data is unavailable."); const payload = await response.json() as { prices?: [number, number][] }; const prices = payload.prices?.filter(([timestamp, price]) => Number.isFinite(timestamp) && Number.isFinite(price) && price > 0) ?? []; const closes = timeframe === "4H" ? aggregateFourHour(prices) : prices.map((point) => point[1]); if (closes.length < 15) throw new Error("Insufficient BTC/USD market data for RSI."); const data = { closes, updatedAt: new Date().toISOString(), source: "CoinGecko" as const }; cache.set(timeframe, { expires: Date.now() + 60_000, data }); return data; } };
