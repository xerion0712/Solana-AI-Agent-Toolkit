import { Action } from "../types/action";
import { SolanaAgentKit } from "../agent";
import { z } from "zod";
import {
  AMM_V4,
  FEE_DESTINATION_ID,
  MARKET_STATE_LAYOUT_V3,
  OPEN_BOOK_PROGRAM,
  Raydium,
  TxVersion,
} from "@raydium-io/raydium-sdk-v2";
import { MintLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { raydiumCreateAmmV4 } from "../tools";

const raydiumCreateAmmV4Action: Action = {
  name: "solana_raydium_create_amm_v4",
  similes: [
    "create raydium v4 pool",
    "setup raydium v4 liquidity pool",
    "initialize raydium v4 amm",
    "create raydium v4 market maker",
    "setup raydium v4 pool",
    "create raydium v4 trading pair"
  ],
  description: "Create a new AMM V4 pool on Raydium with advanced features and improved efficiency",
  examples: [
    [
      {
        input: {
          baseMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  // USDC
          quoteMint: "So11111111111111111111111111111111111111112",   // SOL
          baseAmount: 1000,
          quoteAmount: 10,
          startPrice: 100,  // 1 SOL = 100 USDC
          openTime: 1672531200  // Unix timestamp
        },
        output: {
          status: "success",
          signature: "2ZE7Rz...",
          poolId: "7nxQB...",
          message: "Successfully created Raydium AMM V4 pool"
        },
        explanation: "Create a USDC-SOL V4 pool with initial liquidity and price"
      }
    ]
  ],
  schema: z.object({
    baseMint: z.string()
      .min(1)
      .describe("The base token mint address"),
    quoteMint: z.string()
      .min(1)
      .describe("The quote token mint address"),
    baseAmount: z.number()
      .positive()
      .describe("Initial base token amount to provide as liquidity"),
    quoteAmount: z.number()
      .positive()
      .describe("Initial quote token amount to provide as liquidity"),
    startPrice: z.number()
      .positive()
      .describe("Initial price of quote token in base token units"),
    openTime: z.number()
      .positive()
      .describe("Unix timestamp when trading should start")
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    try {
      const marketId = new PublicKey(input.marketId);
      const baseAmount = new BN(input.baseAmount);
      const quoteAmount = new BN(input.quoteAmount);
      const startTime = new BN(input.startTime);

      const txId = await raydiumCreateAmmV4(agent, marketId, baseAmount, quoteAmount, startTime);

      return {
        status: "success",
        signature: txId,
        message: "Successfully created Raydium AMM V4 pool"
      };
    } catch (error: any) {
      return {
        status: "error",
        message: `Failed to create AMM V4 pool: ${error.message}`
      };
    }
  }
};

export default raydiumCreateAmmV4Action; 