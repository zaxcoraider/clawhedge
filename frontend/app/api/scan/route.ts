import { NextResponse } from "next/server";

const OAUTH_URL    = "https://oauth2.bitquery.io/oauth2/token";
const BITQUERY_URL = "https://streaming.bitquery.io/graphql";
const GOPLUS_URL   = "https://api.gopluslabs.io/api/v1/token_security/56";

let _token: { value: string; expiresAt: number } | null = null;

async function getBitqueryToken(): Promise<string> {
  if (_token && Date.now() < _token.expiresAt) return _token.value;
  const res  = await fetch(OAUTH_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(
      process.env.BITQUERY_CLIENT_ID ?? ""
    )}&client_secret=${encodeURIComponent(
      process.env.BITQUERY_CLIENT_SECRET ?? ""
    )}&scope=api`,
    signal: AbortSignal.timeout(8000),
  });
  const json = (await res.json()) as { access_token: string; expires_in: number };
  _token = { value: json.access_token, expiresAt: Date.now() + (json.expires_in - 60) * 1000 };
  return _token.value;
}

// Known base/quote tokens to exclude — these are not meme tokens
const EXCLUDE_ADDRS = new Set([
  "0x",                                                        // native BNB
  "0x0000000000000000000000000000000000000000",
  "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",               // WBNB
  "0x55d398326f99059ff775485246999027b3197955",               // USDT
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",               // USDC
  "0xe9e7cea3dedca5984780bafc599bd69add087d56",               // BUSD
]);

function buildQuery(since: string) {
  return `{
  EVM(network: bsc) {
    DEXTradeByTokens(
      where: {
        Trade: {
          Dex: { ProtocolName: { is: "fourmeme_v1" } }
          Currency: {
            SmartContract: {
              notIn: [
                "0x0000000000000000000000000000000000000000",
                "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
                "0x55d398326f99059fF775485246999027B3197955",
                "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
                "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
              ]
            }
          }
        }
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

// Security flags that disqualify a token — low_liquidity removed because
// bonding-curve tokens have zero PancakeSwap liquidity by design
const BLOCK_FLAGS = ["is_honeypot","cannot_sell_all","transfer_pausable","hidden_owner"] as const;

async function goPlusCheck(address: string) {
  try {
    const res  = await fetch(`${GOPLUS_URL}?contract_addresses=${address}`,
      { signal: AbortSignal.timeout(6000) });
    const json = (await res.json()) as Record<string, unknown>;
    const data = (json as Record<string, Record<string, Record<string,string>>>)
      ?.result?.[address.toLowerCase()];
    if (!data) return { safe: false, flags: ["no_data"], liquidity: 0 };
    const flags: string[] = BLOCK_FLAGS.filter(f => data[f] === "1");
    // is_mintable is a soft warning only — don't block for it
    if (data["is_mintable"] === "1") flags.push("mintable_warn");
    const liquidity = parseFloat(data["liquidity"] ?? "0");
    return { safe: flags.length === 0, flags, liquidity };
  } catch {
    return { safe: false, flags: ["goplus_timeout"], liquidity: 0 };
  }
}

/* ── Streaming GET ── */
export async function GET() {
  const encoder = new TextEncoder();

  function evt(type: string, payload: unknown) {
    const merged = Object.assign({ type }, payload as object);
    return encoder.encode(`data: ${JSON.stringify(merged)}\n\n`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Stage 1 — auth
        controller.enqueue(evt("status", { msg: "AUTHENTICATING BITQUERY..." }));
        const token = await getBitqueryToken();

        // Stage 2 — query
        controller.enqueue(evt("status", { msg: "QUERYING FOUR.MEME TOKENS..." }));
        const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();

        const bqRes = await fetch(BITQUERY_URL, {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ query: buildQuery(since) }),
          signal:  AbortSignal.timeout(12000),
        });
        const bqJson = (await bqRes.json()) as {
          data?: { EVM?: { DEXTradeByTokens?: { Trade: { Currency: { SmartContract: string; Symbol: string } }; count: string; volumeUSD: string }[] } };
          errors?: unknown;
        };

        if (bqJson.errors) {
          controller.enqueue(evt("error", { msg: `Bitquery error: ${JSON.stringify(bqJson.errors)}` }));
          controller.close(); return;
        }

        const rows = (bqJson.data?.EVM?.DEXTradeByTokens ?? [])
          .filter(r => {
            const addr = r.Trade.Currency.SmartContract?.toLowerCase() ?? "";
            return addr.length > 10 && !EXCLUDE_ADDRS.has(addr);
          });
        const top  = rows.slice(0, 10);

        controller.enqueue(evt("status", { msg: `FOUND ${rows.length} TOKENS — RUNNING GOPLUS CHECKS...` }));

        // Stage 3 — GoPlus one-by-one so UI updates progressively
        const scannedAt = new Date().toISOString();
        let idx = 0;
        for (const row of top) {
          idx++;
          const addr = row.Trade.Currency.SmartContract;
          controller.enqueue(evt("status", { msg: `GOPLUS CHECK ${idx}/${top.length} — ${row.Trade.Currency.Symbol || addr.slice(0,8)}` }));
          const safety = await goPlusCheck(addr);
          controller.enqueue(evt("token", {
            token: {
              address:    addr,
              symbol:     row.Trade.Currency.Symbol,
              trades:     parseInt(row.count, 10),
              volumeUSD:  parseFloat(row.volumeUSD),
              safe:       safety.safe,
              flags:      safety.flags,
              liquidity:  safety.liquidity,
              bscscanUrl: `https://bscscan.com/token/${addr}`,
            }
          }));
        }

        controller.enqueue(evt("done", { scannedAt }));
      } catch (e) {
        controller.enqueue(evt("error", { msg: String(e) }));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
    },
  });
}
