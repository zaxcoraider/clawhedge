import { NextResponse } from "next/server";

const OAUTH_URL    = "https://oauth2.bitquery.io/oauth2/token";
const BITQUERY_URL = "https://streaming.bitquery.io/graphql";
const GOPLUS_URL   = "https://api.gopluslabs.io/api/v1/token_security/56";

let _token: { value: string; expiresAt: number } | null = null;

async function getBitqueryToken(): Promise<string> {
  if (_token && Date.now() < _token.expiresAt) return _token.value;
  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(
      process.env.BITQUERY_CLIENT_ID ?? ""
    )}&client_secret=${encodeURIComponent(
      process.env.BITQUERY_CLIENT_SECRET ?? ""
    )}&scope=api`,
  });
  const json = (await res.json()) as { access_token: string; expires_in: number };
  _token = { value: json.access_token, expiresAt: Date.now() + (json.expires_in - 60) * 1000 };
  return _token.value;
}

function buildQuery(since: string) {
  return `{
  EVM(network: bsc) {
    DEXTradeByTokens(
      where: {
        Trade: { Dex: { ProtocolName: { is: "fourmeme_v1" } } }
        Block: { Time: { after: "${since}" } }
      }
      orderBy: { descendingByField: "volumeUSD" }
      limit: { count: 30 }
    ) {
      Trade { Currency { SmartContract Symbol } }
      count
      volumeUSD: sum(of: Trade_AmountInUSD)
    }
  }
}`;
}

const BLOCK_FLAGS = ["is_honeypot","cannot_sell_all","transfer_pausable","is_mintable","hidden_owner"] as const;

async function goPlusCheck(address: string) {
  try {
    const res  = await fetch(`${GOPLUS_URL}?contract_addresses=${address}`);
    const json = (await res.json()) as Record<string, unknown>;
    const data = (json as Record<string, Record<string, Record<string,string>>>)
      ?.result?.[address.toLowerCase()];
    if (!data) return { safe: false, flags: ["no_data"], liquidity: 0 };
    const flags: string[] = BLOCK_FLAGS.filter(f => data[f] === "1");
    const liquidity = parseFloat(data["liquidity"] ?? "0");
    if (liquidity < 1000) flags.push("low_liquidity");
    return { safe: flags.length === 0, flags, liquidity };
  } catch {
    return { safe: false, flags: ["goplus_error"], liquidity: 0 };
  }
}

export async function GET() {
  try {
    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const token = await getBitqueryToken();

    const bqRes = await fetch(BITQUERY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: buildQuery(since) }),
    });
    const bqJson = (await bqRes.json()) as {
      data: { EVM: { DEXTradeByTokens: { Trade: { Currency: { SmartContract: string; Symbol: string } }; count: string; volumeUSD: string }[] } };
    };

    const rows = bqJson.data?.EVM?.DEXTradeByTokens ?? [];

    // GoPlus check top 10 only to stay fast
    const results = await Promise.all(
      rows.slice(0, 10).map(async (row) => {
        const addr    = row.Trade.Currency.SmartContract;
        const safety  = await goPlusCheck(addr);
        return {
          address:     addr,
          symbol:      row.Trade.Currency.Symbol,
          trades:      parseInt(row.count, 10),
          volumeUSD:   parseFloat(row.volumeUSD),
          safe:        safety.safe,
          flags:       safety.flags,
          liquidity:   safety.liquidity,
          bscscanUrl:  `https://bscscan.com/token/${addr}`,
        };
      })
    );

    return NextResponse.json({ tokens: results, scannedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
