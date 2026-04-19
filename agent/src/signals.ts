import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { TokenSignal } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(__dirname, "../../.cache");
const CACHE_TTL_MS = 30_000;

const BITQUERY_URL = "https://streaming.bitquery.io/graphql";
const OAUTH_URL    = "https://oauth2.bitquery.io/oauth2/token";

let _cachedToken: { token: string; expiresAt: number } | null = null;

async function getBitqueryToken(): Promise<string> {
  if (_cachedToken && Date.now() < _cachedToken.expiresAt) {
    return _cachedToken.token;
  }

  const clientId     = process.env.BITQUERY_CLIENT_ID     ?? "";
  const clientSecret = process.env.BITQUERY_CLIENT_SECRET ?? "";

  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "client_credentials",
      client_id:     clientId,
      client_secret: clientSecret,
      scope:         "api",
    }),
  });

  if (!res.ok) throw new Error(`Bitquery OAuth failed: ${res.status}`);

  const json = (await res.json()) as { access_token: string; expires_in: number };
  _cachedToken = {
    token:     json.access_token,
    expiresAt: Date.now() + (json.expires_in - 60) * 1000, // 1-min buffer
  };
  return _cachedToken.token;
}

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
      }
      count
      volumeUSD: sum(of: Trade_AmountInUSD)
    }
  }
}
`;

function latestCacheFile(): { file: string; fresh: boolean } {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const files = fs
    .readdirSync(CACHE_DIR)
    .filter((f) => f.startsWith("signals-") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length > 0) {
    const ts = parseInt(files[0].replace("signals-", "").replace(".json", ""), 10);
    const file = path.join(CACHE_DIR, files[0]);
    if (Date.now() - ts < CACHE_TTL_MS) return { file, fresh: true };
  }

  return { file: path.join(CACHE_DIR, `signals-${Date.now()}.json`), fresh: false };
}

export async function fetchFourMemeSignals(): Promise<TokenSignal[]> {
  const { file, fresh } = latestCacheFile();
  if (fresh) return JSON.parse(fs.readFileSync(file, "utf8")) as TokenSignal[];

  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const token = await getBitqueryToken();

  const res = await fetch(BITQUERY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ query: QUERY, variables: { since } }),
  });

  if (!res.ok) throw new Error(`Bitquery request failed: ${res.status}`);

  type TradeRow = {
    Trade: { Currency: { SmartContract: string; Symbol: string } };
    count: string;
    volumeUSD: string;
  };

  const json = (await res.json()) as {
    data: { EVM: { DEXTradeByTokens: TradeRow[] } };
    errors?: { message: string }[];
  };

  if (json.errors?.length) throw new Error(`Bitquery error: ${json.errors[0].message}`);

  const rows = json.data?.EVM?.DEXTradeByTokens ?? [];

  const signals: TokenSignal[] = rows.map((row) => ({
    address:          row.Trade.Currency.SmartContract as `0x${string}`,
    symbol:           row.Trade.Currency.Symbol,
    bondingCurvePct:  0,   // not in Bitquery — supplement from Four.meme API if needed
    holders:          parseInt(row.count, 10),
    volumeUSD24h:     parseFloat(row.volumeUSD),
    devWalletPct:     0,   // not in Bitquery
    ageMinutes:       15,  // approximate — within the 30-min window
  }));

  fs.writeFileSync(file, JSON.stringify(signals, null, 2));
  return signals;
}
