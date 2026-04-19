import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { TokenSignal } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(__dirname, "../../.cache");
const CACHE_TTL_MS = 30_000;

const BITQUERY_URL = "https://graphql.bitquery.io";

const QUERY = `
query FourMemeSignals($since: ISO8601DateTime!) {
  EVM(network: bsc) {
    DEXTradeByTokens(
      where: {
        Trade: { Dex: { ProtocolName: { is: "fourmeme_v1" } } }
        Block: { Time: { after: $since } }
      }
      orderBy: { descendingByField: "volumeUSD" }
      limit: { count: 50 }
    ) {
      Trade {
        Currency {
          SmartContract
          Symbol
        }
        Buyers: count(distinct: Buyer)
        volumeUSD: sum(of: Trade_AmountInUSD)
      }
    }
  }
}
`;

function cacheFile(): string {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const files = fs
    .readdirSync(CACHE_DIR)
    .filter((f) => f.startsWith("signals-"))
    .sort()
    .reverse();

  if (files.length > 0) {
    const latest = files[0];
    const ts = parseInt(latest.replace("signals-", "").replace(".json", ""), 10);
    if (Date.now() - ts < CACHE_TTL_MS) {
      return path.join(CACHE_DIR, latest);
    }
  }
  return path.join(CACHE_DIR, `signals-${Date.now()}.json`);
}

export async function fetchFourMemeSignals(): Promise<TokenSignal[]> {
  const file = cacheFile();
  const ts = parseInt(path.basename(file).replace("signals-", "").replace(".json", ""), 10);

  if (fs.existsSync(file) && Date.now() - ts < CACHE_TTL_MS) {
    return JSON.parse(fs.readFileSync(file, "utf8")) as TokenSignal[];
  }

  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const res = await fetch(BITQUERY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.BITQUERY_TOKEN ?? "",
    },
    body: JSON.stringify({ query: QUERY, variables: { since } }),
  });

  if (!res.ok) throw new Error(`Bitquery request failed: ${res.status}`);

  type TradeRow = {
    Trade: {
      Currency: { SmartContract: string; Symbol: string };
      Buyers: number;
      volumeUSD: number;
    };
  };

  const json = (await res.json()) as {
    data: { EVM: { DEXTradeByTokens: TradeRow[] } };
  };

  const rows = json.data?.EVM?.DEXTradeByTokens ?? [];

  const signals: TokenSignal[] = rows.map((row) => ({
    address: row.Trade.Currency.SmartContract as `0x${string}`,
    symbol: row.Trade.Currency.Symbol,
    bondingCurvePct: 0,   // not available from Bitquery — fill from Four.meme API if needed
    holders: row.Trade.Buyers,
    volumeUSD24h: row.Trade.volumeUSD,
    devWalletPct: 0,      // not available from Bitquery
    ageMinutes: 15,       // approximate — within the last 30-min window
  }));

  fs.writeFileSync(file, JSON.stringify(signals, null, 2));
  return signals;
}
