import { BaseSolanaTool } from "../common";
import { PublicKey } from "@solana/web3.js";

export class SolanaWithdrawAllTool extends BaseSolanaTool {
  name = "solana_withdraw_all";
  description = `This tool can be used to withdraw all funds from a Manifest market.
  
    Input ( input is a JSON string ):
    marketId: string, eg "ENhU8LsaR7vDD2G1CsWcsuSGNrih9Cv5WZEk7q9kPapQ" for SOL/USDC (required)`;

  protected async _call(input: string): Promise<string> {
    try {
      const marketId = new PublicKey(input.trim());
      const tx = await this.solanaKit.withdrawAll(marketId);

      return JSON.stringify({
        status: "success",
        message: "Withdrew successfully",
        transaction: tx,
        marketId,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}
