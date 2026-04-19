const GOPLUS_URL = "https://api.gopluslabs.io/api/v1/token_security/56";

const BLOCK_FLAGS = [
  "is_honeypot",
  "cannot_sell_all",
  "transfer_pausable",
  "is_mintable",
  "hidden_owner",
] as const;

export async function goPlusCheck(
  token: string
): Promise<{ safe: boolean; flags: string[] }> {
  const res = await fetch(`${GOPLUS_URL}?contract_addresses=${token}`);
  if (!res.ok) throw new Error(`GoPlus request failed: ${res.status}`);

  const json = (await res.json()) as Record<string, unknown>;
  const result = (json as Record<string, Record<string, Record<string, string>>>)
    ?.result?.[token.toLowerCase()];

  if (!result) return { safe: false, flags: ["no_data"] };

  const triggered: string[] = BLOCK_FLAGS.filter((f) => result[f] === "1");
  const liquidity = parseFloat((result["liquidity"] as string) ?? "0");

  if (liquidity < 1000) triggered.push("low_liquidity");

  return { safe: triggered.length === 0, flags: triggered };
}
