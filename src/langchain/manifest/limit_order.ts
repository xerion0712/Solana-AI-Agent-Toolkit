import { BaseSolanaTool } from "../common";
import { PublicKey } from "@solana/web3.js";

export class SolanaLimitOrderTool extends BaseSolanaTool {
  name = "solana_limit_order";
  description = `This tool can be used to place limit orders using Manifest.
  
    Do not allow users to place multiple orders with this instruction, use solana_batch_order instead.
  
    Inputs ( input is a JSON string ):
    marketId: PublicKey, eg "ENhU8LsaR7vDD2G1CsWcsuSGNrih9Cv5WZEk7q9kPapQ" for SOL/USDC (required)
    quantity: number, eg 1 or 0.01 (required)
    side: string, eg "Buy" or "Sell" (required)
    price: number, in tokens eg 200 for SOL/USDC (required)`;

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const tx = await this.solanaKit.limitOrder(
        new PublicKey(parsedInput.marketId),
        parsedInput.quantity,
        parsedInput.side,
        parsedInput.price,
      );

      return JSON.stringify({
        status: "success",
        message: "Trade executed successfully",
        transaction: tx,
        marketId: parsedInput.marketId,
        quantity: parsedInput.quantity,
        side: parsedInput.side,
        price: parsedInput.price,
      });
    } catch (error: any) {
      return this.handleError(error);
    }
  }
}
