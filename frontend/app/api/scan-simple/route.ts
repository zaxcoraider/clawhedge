import { NextResponse } from "next/server";

const OAUTH_URL    = "https://oauth2.bitquery.io/oauth2/token";
const BITQUERY_URL = "https://streaming.bitquery.io/graphql";
const GOPLUS_URL   = "https://api.gopluslabs.io/api/v1/token_security/56";

const EXCLUDE = new Set([
  "0x0000000000000000000000000000000000000000",
  "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
  "0x55d398326f99059ff775485246999027b3197955",
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
]);

const BLOCK_FLAGS = ["is_honeypot","cannot_sell_all","transfer_pausable","hidden_owner"] as const;

let _token: { value: string; expiresAt: number } | null = null;
async function getBQToken() {
  if (_token && Date.now() < _token.expiresAt) return _token.value;
  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(process.env.BITQUERY_CLIENT_ID ?? "")}&client_secret=${encodeURIComponent(process.env.BITQUERY_CLIENT_SECRET ?? "")}&scope=api`,
  });
  const j = await res.json() as { access_token: string; expires_in: number };
  _token = { value: j.access_token, expiresAt: Date.now() + (j.expires_in - 60) * 1000 };
  return _token.value;
}

export async function GET() {
  try {
    const bqToken = await getBQToken();
    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const bqRes = await fetch(BITQUERY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bqToken}` },
      body: JSON.stringify({ query: `{
        EVM(network: bsc) {
          DEXTradeByTokens(
            where: {
              Trade: {
                Dex: { ProtocolName: { is: "fourmeme_v1" } }
                Currency: { SmartContract: { notIn: [
                  "0x0000000000000000000000000000000000000000",
                  "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
                  "0x55d398326f99059fF775485246999027B3197955"
                ]}}
              }
              Block: { Time: { after: "${since}" } }
            }
            orderBy: { descendingByField: "volumeUSD" }
            limit: { count: 20 }
          ) {
            Trade { Currency { SmartContract Symbol } }
            count
            volumeUSD: sum(of: Trade_AmountInUSD)
          }
        }
      }` }),
      signal: AbortSignal.timeout(12000),
    });

    const bqJson = await bqRes.json() as { data?: { EVM?: { DEXTradeByTokens?: { Trade: { Currency: { SmartContract: string; Symbol: string } }; count: string; volumeUSD: string }[] } } };
    const rows = (bqJson.data?.EVM?.DEXTradeByTokens ?? [])
      .filter(r => !EXCLUDE.has(r.Trade.Currency.SmartContract?.toLowerCase() ?? ""));

    // GoPlus check top 5 only
    const results = [];
    for (const row of rows.slice(0, 5)) {
      const addr = row.Trade.Currency.SmartContract;
      try {
        const gp = await fetch(`${GOPLUS_URL}?contract_addresses=${addr}`, { signal: AbortSignal.timeout(5000) });
        const gpJson = await gp.json() as { result?: Record<string, Record<string, string | { liquidity?: string }[]>> };
        const data = gpJson?.result?.[addr.toLowerCase()];
        const flags = data ? BLOCK_FLAGS.filter(f => (data[f] as string) === "1") : ["no_data"];
        const dex = (data?.["dex"] ?? []) as { liquidity?: string }[];
        const liquidity = dex.reduce((s, p) => s + parseFloat(p.liquidity ?? "0"), 0);
        results.push({
          symbol: row.Trade.Currency.Symbol,
          address: addr,
          volumeUSD: parseFloat(row.volumeUSD).toFixed(0),
          trades: parseInt(row.count),
          safe: flags.length === 0,
          flags,
          liquidity: liquidity > 100 ? `$${(liquidity/1000).toFixed(0)}K` : "BONDING",
          bscscan: `https://bscscan.com/token/${addr}`,
        });
      } catch {
        results.push({ symbol: row.Trade.Currency.Symbol, address: addr, safe: false, flags: ["timeout"] });
      }
    }

    return NextResponse.json({ ok: true, scannedAt: new Date().toISOString(), count: results.length, tokens: results });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
