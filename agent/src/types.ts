export interface TokenSignal {
  address: `0x${string}`;
  symbol: string;
  bondingCurvePct: number;
  holders: number;
  volumeUSD24h: number;
  devWalletPct: number;
  ageMinutes: number;
}

export type Action =
  | {
      type: "BUY_AND_HEDGE";
      token: `0x${string}`;
      bnbAmount: number;
      usdtHedge: number;
      leverage: number;
      market: string;
      reasoning: string;
    }
  | {
      type: "HOLD";
      reasoning: string;
    };

export interface PortfolioCtx {
  walletAddress: `0x${string}`;
  usdtBalance: number;
  bnbBalance: number;
  openPositions: number[];
}
