import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import Decimal from "decimal.js";
import { Tool } from "langchain/tools";
import {
  GibworkCreateTaskReponse,
  OrderParams,
  PythFetchPriceResponse,
  SolanaAgentKit,
} from "../index";
import { create_image, FEE_TIERS, generateOrdersfromPattern } from "../tools";
import { marketTokenMap } from "../utils/flashUtils";
import {
  CreateCollectionOptions,
  CreateSingleOptions,
  StoreInitOptions,
} from "@3land/listings-sdk/dist/types/implementation/implementationTypes";

export class SolanaBalanceTool extends Tool {
  name = "solana_balance";
  description = `Get the balance of a Solana wallet or token account.

  If you want to get the balance of your wallet, you don't need to provide the tokenAddress.
  If no tokenAddress is provided, the balance will be in SOL.

  Inputs ( input is a JSON string ):
  tokenAddress: string, eg "So11111111111111111111111111111111111111112" (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const tokenAddress = input ? new PublicKey(input) : undefined;
      const balance = await this.solanaKit.getBalance(tokenAddress);

      return JSON.stringify({
        status: "success",
        balance,
        token: input || "SOL",
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

export class SolanaBalanceOtherTool extends Tool {
  name = "solana_balance_other";
  description = `Get the balance of a Solana wallet or token account which is different from the agent's wallet.

  If no tokenAddress is provided, the SOL balance of the wallet will be returned.

  Inputs ( input is a JSON string ):
  walletAddress: string, eg "GDEkQF7UMr7RLv1KQKMtm8E2w3iafxJLtyXu3HVQZnME" (required)
  tokenAddress: string, eg "SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa" (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const { walletAddress, tokenAddress } = JSON.parse(input);

      const tokenPubKey = tokenAddress
        ? new PublicKey(tokenAddress)
        : undefined;

      const balance = await this.solanaKit.getBalanceOther(
        new PublicKey(walletAddress),
        tokenPubKey,
      );

      return JSON.stringify({
        status: "success",
        balance,
        wallet: walletAddress,
        token: tokenAddress || "SOL",
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

export class SolanaTransferTool extends Tool {
  name = "solana_transfer";
  description = `Transfer tokens or SOL to another address ( also called as wallet address ).

  Inputs ( input is a JSON string ):
  to: string, eg "8x2dR8Mpzuz2YqyZyZjUbYWKSWesBo5jMx2Q9Y86udVk" (required)
  amount: number, eg 1 (required)
  mint?: string, eg "So11111111111111111111111111111111111111112" or "SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa" (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const recipient = new PublicKey(parsedInput.to);
      const mintAddress = parsedInput.mint
        ? new PublicKey(parsedInput.mint)
        : undefined;

      const tx = await this.solanaKit.transfer(
        recipient,
        parsedInput.amount,
        mintAddress,
      );

      return JSON.stringify({
        status: "success",
        message: "Transfer completed successfully",
        amount: parsedInput.amount,
        recipient: parsedInput.to,
        token: parsedInput.mint || "SOL",
        transaction: tx,
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

export class SolanaDeployTokenTool extends Tool {
  name = "solana_deploy_token";
  description = `Deploy a new token on Solana blockchain.

  Inputs (input is a JSON string):
  name: string, eg "My Token" (required)
  uri: string, eg "https://example.com/token.json" (required)
  symbol: string, eg "MTK" (required)
  decimals?: number, eg 9 (optional, defaults to 9)
  initialSupply?: number, eg 1000000 (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.solanaKit.deployToken(
        parsedInput.name,
        parsedInput.uri,
        parsedInput.symbol,
        parsedInput.decimals,
        parsedInput.initialSupply,
      );

      return JSON.stringify({
        status: "success",
        message: "Token deployed successfully",
        mintAddress: result.mint.toString(),
        decimals: parsedInput.decimals || 9,
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

export class SolanaDeployCollectionTool extends Tool {
  name = "solana_deploy_collection";
  description = `Deploy a new NFT collection on Solana blockchain.

  Inputs (input is a JSON string):
  name: string, eg "My Collection" (required)
  uri: string, eg "https://example.com/collection.json" (required)
  royaltyBasisPoints?: number, eg 500 for 5% (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.solanaKit.deployCollection(parsedInput);

      return JSON.stringify({
        status: "success",
        message: "Collection deployed successfully",
        collectionAddress: result.collectionAddress.toString(),
        name: parsedInput.name,
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

export class SolanaMintNFTTool extends Tool {
  name = "solana_mint_nft";
  description = `Mint a new NFT in a collection on Solana blockchain.

    Inputs (input is a JSON string):
    collectionMint: string, eg "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w" (required) - The address of the collection to mint into
    name: string, eg "My NFT" (required)
    uri: string, eg "https://example.com/nft.json" (required)
    recipient?: string, eg "9aUn5swQzUTRanaaTwmszxiv89cvFwUCjEBv1vZCoT1u" (optional) - The wallet to receive the NFT, defaults to agent's wallet which is ${this.solanaKit.wallet_address.toString()}`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.solanaKit.mintNFT(
        new PublicKey(parsedInput.collectionMint),
        {
          name: parsedInput.name,
          uri: parsedInput.uri,
        },
        parsedInput.recipient
          ? new PublicKey(parsedInput.recipient)
          : this.solanaKit.wallet_address,
      );

      return JSON.stringify({
        status: "success",
        message: "NFT minted successfully",
        mintAddress: result.mint.toString(),
        metadata: {
          name: parsedInput.name,
          symbol: parsedInput.symbol,
          uri: parsedInput.uri,
        },
        recipient: parsedInput.recipient || result.mint.toString(),
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

export class SolanaPerpCloseTradeTool extends Tool {
  name = "solana_close_perp_trade";
  description = `This tool can be used to close perpetuals trade ( It uses Adrena Protocol ).

  Inputs ( input is a JSON string ):
  tradeMint: string, eg "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn", "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" etc. (optional)
  price?: number, eg 100 (optional)
  side: string, eg: "long" or "short"`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const tx =
        parsedInput.side === "long"
          ? await this.solanaKit.closePerpTradeLong({
              price: parsedInput.price,
              tradeMint: new PublicKey(parsedInput.tradeMint),
            })
          : await this.solanaKit.closePerpTradeShort({
              price: parsedInput.price,
              tradeMint: new PublicKey(parsedInput.tradeMint),
            });

      return JSON.stringify({
        status: "success",
        message: "Perpetual trade closed successfully",
        transaction: tx,
        price: parsedInput.price,
        tradeMint: new PublicKey(parsedInput.tradeMint),
        side: parsedInput.side,
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

export class SolanaPerpOpenTradeTool extends Tool {
  name = "solana_open_perp_trade";
  description = `This tool can be used to open perpetuals trade ( It uses Adrena Protocol ).

  Inputs ( input is a JSON string ):
  collateralAmount: number, eg 1 or 0.01 (required)
  collateralMint: string, eg "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn" or "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" etc. (optional)
  tradeMint: string, eg "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn", "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" etc. (optional)
  leverage: number, eg 50000 = x5, 100000 = x10, 1000000 = x100 (optional)
  price?: number, eg 100 (optional)
  slippage?: number, eg 0.3 (optional)
  side: string, eg: "long" or "short"`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const tx =
        parsedInput.side === "long"
          ? await this.solanaKit.openPerpTradeLong({
              price: parsedInput.price,
              collateralAmount: parsedInput.collateralAmount,
              collateralMint: new PublicKey(parsedInput.collateralMint),
              leverage: parsedInput.leverage,
              tradeMint: new PublicKey(parsedInput.tradeMint),
              slippage: parsedInput.slippage,
            })
          : await this.solanaKit.openPerpTradeLong({
              price: parsedInput.price,
              collateralAmount: parsedInput.collateralAmount,
              collateralMint: new PublicKey(parsedInput.collateralMint),
              leverage: parsedInput.leverage,
              tradeMint: new PublicKey(parsedInput.tradeMint),
              slippage: parsedInput.slippage,
            });

      return JSON.stringify({
        status: "success",
        message: "Perpetual trade opened successfully",
        transaction: tx,
        price: parsedInput.price,
        collateralAmount: parsedInput.collateralAmount,
        collateralMint: new PublicKey(parsedInput.collateralMint),
        leverage: parsedInput.leverage,
        tradeMint: new PublicKey(parsedInput.tradeMint),
        slippage: parsedInput.slippage,
        side: parsedInput.side,
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

export class SolanaTradeTool extends Tool {
  name = "solana_trade";
  description = `This tool can be used to swap tokens to another token ( It uses Jupiter Exchange ).

  Inputs ( input is a JSON string ):
  outputMint: string, eg "So11111111111111111111111111111111111111112" or "SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa" (required)
  inputAmount: number, eg 1 or 0.01 (required)
  inputMint?: string, eg "So11111111111111111111111111111111111111112" (optional)
  slippageBps?: number, eg 100 (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const tx = await this.solanaKit.trade(
        new PublicKey(parsedInput.outputMint),
        parsedInput.inputAmount,
        parsedInput.inputMint
          ? new PublicKey(parsedInput.inputMint)
          : new PublicKey("So11111111111111111111111111111111111111112"),
        parsedInput.slippageBps,
      );

      return JSON.stringify({
        status: "success",
        message: "Trade executed successfully",
        transaction: tx,
        inputAmount: parsedInput.inputAmount,
        inputToken: parsedInput.inputMint || "SOL",
        outputToken: parsedInput.outputMint,
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

export class SolanaLimitOrderTool extends Tool {
  name = "solana_limit_order";
  description = `This tool can be used to place limit orders using Manifest.

  Do not allow users to place multiple orders with this instruction, use solana_batch_order instead.

  Inputs ( input is a JSON string ):
  marketId: PublicKey, eg "ENhU8LsaR7vDD2G1CsWcsuSGNrih9Cv5WZEk7q9kPapQ" for SOL/USDC (required)
  quantity: number, eg 1 or 0.01 (required)
  side: string, eg "Buy" or "Sell" (required)
  price: number, in tokens eg 200 for SOL/USDC (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

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
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaBatchOrderTool extends Tool {
  name = "solana_batch_order";
  description = `Places multiple limit orders in one transaction using Manifest. Submit orders either as a list or pattern:

  1. List format:
  {
    "marketId": "ENhU8LsaR7vDD2G1CsWcsuSGNrih9Cv5WZEk7q9kPapQ",
    "orders": [
      { "quantity": 1, "side": "Buy", "price": 200 },
      { "quantity": 0.5, "side": "Sell", "price": 205 }
    ]
  }

  2. Pattern format:
  {
    "marketId": "ENhU8LsaR7vDD2G1CsWcsuSGNrih9Cv5WZEk7q9kPapQ",
    "pattern": {
      "side": "Buy",
      "totalQuantity": 100,
      "priceRange": { "max": 1.0 },
      "spacing": { "type": "percentage", "value": 1 },
      "numberOfOrders": 5
    }
  }

  Examples:
  - "Place 5 buy orders totaling 100 tokens, 1% apart below $1"
  - "Create 3 sell orders of 10 tokens each between $50-$55"
  - "Place buy orders worth 50 tokens, $0.10 spacing from $0.80"

  Important: All orders must be in one transaction. Combine buy and sell orders into a single pattern or list. Never break the orders down to individual buy or sell orders.`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);
      let ordersToPlace: OrderParams[] = [];

      if (!parsedInput.marketId) {
        throw new Error("Market ID is required");
      }

      if (parsedInput.pattern) {
        ordersToPlace = generateOrdersfromPattern(parsedInput.pattern);
      } else if (Array.isArray(parsedInput.orders)) {
        ordersToPlace = parsedInput.orders;
      } else {
        throw new Error("Either pattern or orders array is required");
      }

      if (ordersToPlace.length === 0) {
        throw new Error("No orders generated or provided");
      }

      ordersToPlace.forEach((order: OrderParams, index: number) => {
        if (!order.quantity || !order.side || !order.price) {
          throw new Error(
            `Invalid order at index ${index}: quantity, side, and price are required`,
          );
        }
        if (order.side !== "Buy" && order.side !== "Sell") {
          throw new Error(
            `Invalid side at index ${index}: must be "Buy" or "Sell"`,
          );
        }
      });

      const tx = await this.solanaKit.batchOrder(
        new PublicKey(parsedInput.marketId),
        parsedInput.orders,
      );

      return JSON.stringify({
        status: "success",
        message: "Batch order executed successfully",
        transaction: tx,
        marketId: parsedInput.marketId,
        orders: parsedInput.orders,
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

export class SolanaCancelAllOrdersTool extends Tool {
  name = "solana_cancel_all_orders";
  description = `This tool can be used to cancel all orders from a Manifest market.

  Input ( input is a JSON string ):
  marketId: string, eg "ENhU8LsaR7vDD2G1CsWcsuSGNrih9Cv5WZEk7q9kPapQ" for SOL/USDC (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const marketId = new PublicKey(input.trim());
      const tx = await this.solanaKit.cancelAllOrders(marketId);

      return JSON.stringify({
        status: "success",
        message: "Cancel orders successfully",
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

export class SolanaWithdrawAllTool extends Tool {
  name = "solana_withdraw_all";
  description = `This tool can be used to withdraw all funds from a Manifest market.

  Input ( input is a JSON string ):
  marketId: string, eg "ENhU8LsaR7vDD2G1CsWcsuSGNrih9Cv5WZEk7q9kPapQ" for SOL/USDC (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

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

export class SolanaRequestFundsTool extends Tool {
  name = "solana_request_funds";
  description = "Request SOL from Solana faucet (devnet/testnet only)";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(_input: string): Promise<string> {
    try {
      await this.solanaKit.requestFaucetFunds();

      return JSON.stringify({
        status: "success",
        message: "Successfully requested faucet funds",
        network: this.solanaKit.connection.rpcEndpoint.split("/")[2],
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

export class SolanaRegisterDomainTool extends Tool {
  name = "solana_register_domain";
  description = `Register a .sol domain name for your wallet.

  Inputs:
  name: string, eg "pumpfun.sol" (required)
  spaceKB: number, eg 1 (optional, default is 1)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  private validateInput(input: any): void {
    if (!input.name || typeof input.name !== "string") {
      throw new Error("name is required and must be a string");
    }
    if (
      input.spaceKB !== undefined &&
      (typeof input.spaceKB !== "number" || input.spaceKB <= 0)
    ) {
      throw new Error("spaceKB must be a positive number when provided");
    }
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);
      this.validateInput(parsedInput);

      const tx = await this.solanaKit.registerDomain(
        parsedInput.name,
        parsedInput.spaceKB || 1,
      );

      return JSON.stringify({
        status: "success",
        message: "Domain registered successfully",
        transaction: tx,
        domain: `${parsedInput.name}.sol`,
        spaceKB: parsedInput.spaceKB || 1,
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

export class SolanaResolveDomainTool extends Tool {
  name = "solana_resolve_domain";
  description = `Resolve ONLY .sol domain names to a Solana PublicKey.
  This tool is exclusively for .sol domains.
  DO NOT use this for other domain types like .blink, .bonk, etc.

  Inputs:
  domain: string, eg "pumpfun.sol" (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const domain = input.trim();
      const publicKey = await this.solanaKit.resolveSolDomain(domain);

      return JSON.stringify({
        status: "success",
        message: "Domain resolved successfully",
        publicKey: publicKey.toBase58(),
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

export class SolanaGetDomainTool extends Tool {
  name = "solana_get_domain";
  description = `Retrieve the .sol domain associated for a given account address.

  Inputs:
  account: string, eg "4Be9CvxqHW6BYiRAxW9Q3xu1ycTMWaL5z8NX4HR3ha7t" (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const account = new PublicKey(input.trim());
      const domain = await this.solanaKit.getPrimaryDomain(account);

      return JSON.stringify({
        status: "success",
        message: "Primary domain retrieved successfully",
        domain,
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

export class SolanaGetWalletAddressTool extends Tool {
  name = "solana_get_wallet_address";
  description = `Get the wallet address of the agent`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(_input: string): Promise<string> {
    return this.solanaKit.wallet_address.toString();
  }
}

export class SolanaFlashOpenTrade extends Tool {
  name = "solana_flash_open_trade";
  description = `This tool can be used to open a new leveraged trading position on Flash.Trade exchange.

  Inputs ( input is a JSON string ):
  token: string, eg "SOL", "BTC", "ETH" (required)
  type: string, eg "long", "short" (required) 
  collateral: number, eg 10, 100, 1000 (required) 
  leverage: number, eg 5, 10, 20 (required)
  
  Example prompt is Open a 20x leveraged trade for SOL on long side using flash trade with 500 USD as collateral`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      // Validate input parameters
      if (!parsedInput.token) {
        throw new Error("Token is required, received: " + parsedInput.token);
      }
      if (!Object.keys(marketTokenMap).includes(parsedInput.token)) {
        throw new Error(
          "Token must be one of " +
            Object.keys(marketTokenMap).join(", ") +
            ", received: " +
            parsedInput.token +
            "\n" +
            "Please check https://beast.flash.trade/ for the list of supported tokens",
        );
      }
      if (!["long", "short"].includes(parsedInput.type)) {
        throw new Error(
          'Type must be either "long" or "short", received: ' +
            parsedInput.type,
        );
      }
      if (!parsedInput.collateral || parsedInput.collateral <= 0) {
        throw new Error(
          "Collateral amount must be positive, received: " +
            parsedInput.collateral,
        );
      }
      if (!parsedInput.leverage || parsedInput.leverage <= 0) {
        throw new Error(
          "Leverage must be positive, received: " + parsedInput.leverage,
        );
      }

      const tx = await this.solanaKit.flashOpenTrade({
        token: parsedInput.token,
        side: parsedInput.type,
        collateralUsd: parsedInput.collateral,
        leverage: parsedInput.leverage,
      });

      return JSON.stringify({
        status: "success",
        message: "Flash trade position opened successfully",
        transaction: tx,
        token: parsedInput.token,
        side: parsedInput.type,
        collateral: parsedInput.collateral,
        leverage: parsedInput.leverage,
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

export class SolanaFlashCloseTrade extends Tool {
  name = "solana_flash_close_trade";
  description = `Close an existing leveraged trading position on Flash.Trade exchange.

  Inputs ( input is a JSON string ):
  token: string, eg "SOL", "BTC", "ETH" (required)
  side: string, eg "long", "short" (required)
  
  Example prompt is Close a 20x leveraged trade for SOL on long side`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      // Validate input parameters
      if (!parsedInput.token) {
        throw new Error("Token is required");
      }
      if (!["SOL", "BTC", "ETH"].includes(parsedInput.token)) {
        throw new Error('Token must be one of ["SOL", "BTC", "ETH"]');
      }
      if (!["long", "short"].includes(parsedInput.side)) {
        throw new Error('Side must be either "long" or "short"');
      }

      const tx = await this.solanaKit.flashCloseTrade({
        token: parsedInput.token,
        side: parsedInput.side,
      });

      return JSON.stringify({
        status: "success",
        message: "Flash trade position closed successfully",
        transaction: tx,
        token: parsedInput.token,
        side: parsedInput.side,
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

export class SolanaPumpfunTokenLaunchTool extends Tool {
  name = "solana_launch_pumpfun_token";

  description = `This tool can be used to launch a token on Pump.fun,
   do not use this tool for any other purpose, or for creating SPL tokens.
   If the user asks you to chose the parameters, you should generate valid values.
   For generating the image, you can use the solana_create_image tool.

   Inputs:
   tokenName: string, eg "PumpFun Token",
   tokenTicker: string, eg "PUMP",
   description: string, eg "PumpFun Token is a token on the Solana blockchain",
   imageUrl: string, eg "https://i.imgur.com/UFm07Np_d.png`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  private validateInput(input: any): void {
    if (!input.tokenName || typeof input.tokenName !== "string") {
      throw new Error("tokenName is required and must be a string");
    }
    if (!input.tokenTicker || typeof input.tokenTicker !== "string") {
      throw new Error("tokenTicker is required and must be a string");
    }
    if (!input.description || typeof input.description !== "string") {
      throw new Error("description is required and must be a string");
    }
    if (!input.imageUrl || typeof input.imageUrl !== "string") {
      throw new Error("imageUrl is required and must be a string");
    }
    if (
      input.initialLiquiditySOL !== undefined &&
      typeof input.initialLiquiditySOL !== "number"
    ) {
      throw new Error("initialLiquiditySOL must be a number when provided");
    }
  }

  protected async _call(input: string): Promise<string> {
    try {
      // Parse and normalize input
      input = input.trim();
      const parsedInput = JSON.parse(input);

      this.validateInput(parsedInput);

      // Launch token with validated input
      await this.solanaKit.launchPumpFunToken(
        parsedInput.tokenName,
        parsedInput.tokenTicker,
        parsedInput.description,
        parsedInput.imageUrl,
        {
          twitter: parsedInput.twitter,
          telegram: parsedInput.telegram,
          website: parsedInput.website,
          initialLiquiditySOL: parsedInput.initialLiquiditySOL,
        },
      );

      return JSON.stringify({
        status: "success",
        message: "Token launched successfully on Pump.fun",
        tokenName: parsedInput.tokenName,
        tokenTicker: parsedInput.tokenTicker,
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

export class SolanaCreateImageTool extends Tool {
  name = "solana_create_image";
  description =
    "Create an image using OpenAI's DALL-E. Input should be a string prompt for the image.";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  private validateInput(input: string): void {
    if (typeof input !== "string" || input.trim().length === 0) {
      throw new Error("Input must be a non-empty string prompt");
    }
  }

  protected async _call(input: string): Promise<string> {
    try {
      this.validateInput(input);
      const result = await create_image(this.solanaKit, input.trim());

      return JSON.stringify({
        status: "success",
        message: "Image created successfully",
        ...result,
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

export class SolanaLendAssetTool extends Tool {
  name = "solana_lend_asset";
  description = `Lend idle USDC for yield using Lulo. ( only USDC is supported )

  Inputs (input is a json string):
  amount: number, eg 1, 0.01 (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const amount = JSON.parse(input).amount || input;

      const tx = await this.solanaKit.lendAssets(amount);

      return JSON.stringify({
        status: "success",
        message: "Asset lent successfully",
        transaction: tx,
        amount,
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

export class SolanaTPSCalculatorTool extends Tool {
  name = "solana_get_tps";
  description = "Get the current TPS of the Solana network";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(_input: string): Promise<string> {
    try {
      const tps = await this.solanaKit.getTPS();
      return `Solana (mainnet-beta) current transactions per second: ${tps}`;
    } catch (error: any) {
      return `Error fetching TPS: ${error.message}`;
    }
  }
}

export class SolanaStakeTool extends Tool {
  name = "solana_stake";
  description = `This tool can be used to stake your SOL (Solana), also called as SOL staking or liquid staking.

  Inputs ( input is a JSON string ):
  amount: number, eg 1 or 0.01 (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input) || Number(input);

      const tx = await this.solanaKit.stake(parsedInput.amount);

      return JSON.stringify({
        status: "success",
        message: "Staked successfully",
        transaction: tx,
        amount: parsedInput.amount,
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

export class SolanaRestakeTool extends Tool {
  name = "solana_restake";
  description = `This tool can be used to restake your SOL on Solayer to receive Solayer SOL (sSOL) as a Liquid Staking Token (LST).

  Inputs:
  amount: number, eg 1 or 0.01 (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input) || Number(input);

      const tx = await this.solanaKit.restake(parsedInput.amount);

      return JSON.stringify({
        status: "success",
        message: "Staked successfully",
        transaction: tx,
        amount: parsedInput.amount,
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

/**
 * Tool to fetch the price of a token in USDC
 */
export class SolanaFetchPriceTool extends Tool {
  name = "solana_fetch_price";
  description = `Fetch the price of a given token in USDC.

  Inputs:
  - tokenId: string, the mint address of the token, e.g., "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const price = await this.solanaKit.fetchTokenPrice(input.trim());
      return JSON.stringify({
        status: "success",
        tokenId: input.trim(),
        priceInUSDC: price,
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

export class SolanaTokenDataTool extends Tool {
  name = "solana_token_data";
  description = `Get the token data for a given token mint address

  Inputs: mintAddress is required.
  mintAddress: string, eg "So11111111111111111111111111111111111111112" (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = input.trim();

      const tokenData = await this.solanaKit.getTokenDataByAddress(parsedInput);

      return JSON.stringify({
        status: "success",
        tokenData,
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

export class SolanaTokenDataByTickerTool extends Tool {
  name = "solana_token_data_by_ticker";
  description = `Get the token data for a given token ticker

  Inputs: ticker is required.
  ticker: string, eg "USDC" (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const ticker = input.trim();
      const tokenData = await this.solanaKit.getTokenDataByTicker(ticker);
      return JSON.stringify({
        status: "success",
        tokenData,
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

export class SolanaCompressedAirdropTool extends Tool {
  name = "solana_compressed_airdrop";
  description = `Airdrop SPL tokens with ZK Compression (also called as airdropping tokens)

  Inputs (input is a JSON string):
  mintAddress: string, the mint address of the token, e.g., "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" (required)
  amount: number, the amount of tokens to airdrop per recipient, e.g., 42 (required)
  decimals: number, the decimals of the token, e.g., 6 (required)
  recipients: string[], the recipient addresses, e.g., ["1nc1nerator11111111111111111111111111111111"] (required)
  priorityFeeInLamports: number, the priority fee in lamports. Default is 30_000. (optional)
  shouldLog: boolean, whether to log progress to stdout. Default is false. (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const txs = await this.solanaKit.sendCompressedAirdrop(
        parsedInput.mintAddress,
        parsedInput.amount,
        parsedInput.decimals,
        parsedInput.recipients,
        parsedInput.priorityFeeInLamports || 30_000,
        parsedInput.shouldLog || false,
      );

      return JSON.stringify({
        status: "success",
        message: `Airdropped ${parsedInput.amount} tokens to ${parsedInput.recipients.length} recipients.`,
        transactionHashes: txs,
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

export class SolanaClosePosition extends Tool {
  name = "orca_close_position";
  description = `Closes an existing liquidity position in an Orca Whirlpool. This function fetches the position
  details using the provided mint address and closes the position with a 1% slippage.

  Inputs (JSON string):
  - positionMintAddress: string, the address of the position mint that represents the liquidity position.`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);
      const positionMintAddress = new PublicKey(
        inputFormat.positionMintAddress,
      );

      const txId = await this.solanaKit.orcaClosePosition(positionMintAddress);

      return JSON.stringify({
        status: "success",
        message: "Liquidity position closed successfully.",
        transaction: txId,
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

export class SolanaOrcaCreateCLMM extends Tool {
  name = "orca_create_clmm";
  description = `Create a Concentrated Liquidity Market Maker (CLMM) pool on Orca, the most efficient and capital-optimized CLMM on Solana. This function initializes a CLMM pool but does not add liquidity. You can add liquidity later using a centered position or a single-sided position.

  Inputs (JSON string):
  - mintDeploy: string, the mint of the token you want to deploy (required).
  - mintPair: string, The mint of the token you want to pair the deployed mint with (required).
  - initialPrice: number, initial price of mintA in terms of mintB, e.g., 0.001 (required).
  - feeTier: number, fee tier in bps. Options: 1, 2, 4, 5, 16, 30, 65, 100, 200 (required).`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);
      const mintA = new PublicKey(inputFormat.mintDeploy);
      const mintB = new PublicKey(inputFormat.mintPair);
      const initialPrice = new Decimal(inputFormat.initialPrice);
      const feeTier = inputFormat.feeTier;

      if (!feeTier || !(feeTier in FEE_TIERS)) {
        throw new Error(
          `Invalid feeTier. Available options: ${Object.keys(FEE_TIERS).join(
            ", ",
          )}`,
        );
      }

      const txId = await this.solanaKit.orcaCreateCLMM(
        mintA,
        mintB,
        initialPrice,
        feeTier,
      );

      return JSON.stringify({
        status: "success",
        message:
          "CLMM pool created successfully. Note: No liquidity was added.",
        transaction: txId,
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

export class SolanaOrcaCreateSingleSideLiquidityPool extends Tool {
  name = "orca_create_single_sided_liquidity_pool";
  description = `Create a single-sided liquidity pool on Orca, the most efficient and capital-optimized CLMM platform on Solana.

  This function initializes a single-sided liquidity pool, ideal for community driven project, fair launches, and fundraising. Minimize price impact by setting a narrow price range.

  Inputs (JSON string):
  - depositTokenAmount: number, in units of the deposit token including decimals, e.g., 1000000000 (required).
  - depositTokenMint: string, mint address of the deposit token, e.g., "DepositTokenMintAddress" (required).
  - otherTokenMint: string, mint address of the other token, e.g., "OtherTokenMintAddress" (required).
  - initialPrice: number, initial price of the deposit token in terms of the other token, e.g., 0.001 (required).
  - maxPrice: number, maximum price at which liquidity is added, e.g., 5.0 (required).
  - feeTier: number, fee tier for the pool in bps. Options: 1, 2, 4, 5, 16, 30, 65, 100, 200 (required).`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);
      const depositTokenAmount = inputFormat.depositTokenAmount;
      const depositTokenMint = new PublicKey(inputFormat.depositTokenMint);
      const otherTokenMint = new PublicKey(inputFormat.otherTokenMint);
      const initialPrice = new Decimal(inputFormat.initialPrice);
      const maxPrice = new Decimal(inputFormat.maxPrice);
      const feeTier = inputFormat.feeTier;

      if (!feeTier || !(feeTier in FEE_TIERS)) {
        throw new Error(
          `Invalid feeTier. Available options: ${Object.keys(FEE_TIERS).join(
            ", ",
          )}`,
        );
      }

      const txId = await this.solanaKit.orcaCreateSingleSidedLiquidityPool(
        depositTokenAmount,
        depositTokenMint,
        otherTokenMint,
        initialPrice,
        maxPrice,
        feeTier,
      );

      return JSON.stringify({
        status: "success",
        message: "Single-sided Whirlpool created successfully",
        transaction: txId,
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

export class SolanaOrcaFetchPositions extends Tool {
  name = "orca_fetch_positions";
  description = `Fetch all the liquidity positions in an Orca Whirlpool by owner. Returns an object with positiont mint addresses as keys and position status details as values.`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(): Promise<string> {
    try {
      const txId = await this.solanaKit.orcaFetchPositions();

      return JSON.stringify({
        status: "success",
        message: "Liquidity positions fetched.",
        transaction: txId,
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

export class SolanaOrcaOpenCenteredPosition extends Tool {
  name = "orca_open_centered_position_with_liquidity";
  description = `Add liquidity to a CLMM by opening a centered position in an Orca Whirlpool, the most efficient liquidity pool on Solana.

  Inputs (JSON string):
  - whirlpoolAddress: string, address of the Orca Whirlpool (required).
  - priceOffsetBps: number, bps offset (one side) from the current pool price, e.g., 500 for 5% (required).
  - inputTokenMint: string, mint address of the deposit token (required).
  - inputAmount: number, amount of the deposit token, e.g., 100.0 (required).`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);
      const whirlpoolAddress = new PublicKey(inputFormat.whirlpoolAddress);
      const priceOffsetBps = parseInt(inputFormat.priceOffsetBps, 10);
      const inputTokenMint = new PublicKey(inputFormat.inputTokenMint);
      const inputAmount = new Decimal(inputFormat.inputAmount);

      if (priceOffsetBps < 0) {
        throw new Error(
          "Invalid distanceFromCurrentPriceBps. It must be equal or greater than 0.",
        );
      }

      const txId = await this.solanaKit.orcaOpenCenteredPositionWithLiquidity(
        whirlpoolAddress,
        priceOffsetBps,
        inputTokenMint,
        inputAmount,
      );

      return JSON.stringify({
        status: "success",
        message: "Centered liquidity position opened successfully.",
        transaction: txId,
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

export class SolanaOrcaOpenSingleSidedPosition extends Tool {
  name = "orca_open_single_sided_position";
  description = `Add liquidity to a CLMM by opening a single-sided position in an Orca Whirlpool, the most efficient liquidity pool on Solana.

  Inputs (JSON string):
  - whirlpoolAddress: string, address of the Orca Whirlpool (required).
  - distanceFromCurrentPriceBps: number, distance in basis points from the current price for the position (required).
  - widthBps: number, width of the position in basis points (required).
  - inputTokenMint: string, mint address of the deposit token (required).
  - inputAmount: number, amount of the deposit token, e.g., 100.0 (required).`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);
      const whirlpoolAddress = new PublicKey(inputFormat.whirlpoolAddress);
      const distanceFromCurrentPriceBps =
        inputFormat.distanceFromCurrentPriceBps;
      const widthBps = inputFormat.widthBps;
      const inputTokenMint = new PublicKey(inputFormat.inputTokenMint);
      const inputAmount = new Decimal(inputFormat.inputAmount);

      if (distanceFromCurrentPriceBps < 0 || widthBps < 0) {
        throw new Error(
          "Invalid distanceFromCurrentPriceBps or width. It must be equal or greater than 0.",
        );
      }

      const txId = await this.solanaKit.orcaOpenSingleSidedPosition(
        whirlpoolAddress,
        distanceFromCurrentPriceBps,
        widthBps,
        inputTokenMint,
        inputAmount,
      );

      return JSON.stringify({
        status: "success",
        message: "Single-sided liquidity position opened successfully.",
        transaction: txId,
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

export class SolanaRaydiumCreateAmmV4 extends Tool {
  name = "raydium_create_ammV4";
  description = `Raydium's Legacy AMM that requires an OpenBook marketID

  Inputs (input is a json string):
  marketId: string (required)
  baseAmount: number(int), eg: 111111 (required)
  quoteAmount: number(int), eg: 111111 (required)
  startTime: number(seconds), eg: now number or zero (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);

      const tx = await this.solanaKit.raydiumCreateAmmV4(
        new PublicKey(inputFormat.marketId),
        new BN(inputFormat.baseAmount),
        new BN(inputFormat.quoteAmount),
        new BN(inputFormat.startTime),
      );

      return JSON.stringify({
        status: "success",
        message: "Raydium amm v4 pool created successfully",
        transaction: tx,
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

export class SolanaRaydiumCreateClmm extends Tool {
  name = "raydium_create_clmm";
  description = `Concentrated liquidity market maker, custom liquidity ranges, increased capital efficiency

  Inputs (input is a json string):
  mint1: string (required)
  mint2: string (required)
  configId: string (required) stores pool info, id, index, protocolFeeRate, tradeFeeRate, tickSpacing, fundFeeRate
  initialPrice: number, eg: 123.12 (required)
  startTime: number(seconds), eg: now number or zero (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);

      const tx = await this.solanaKit.raydiumCreateClmm(
        new PublicKey(inputFormat.mint1),
        new PublicKey(inputFormat.mint2),

        new PublicKey(inputFormat.configId),

        new Decimal(inputFormat.initialPrice),
        new BN(inputFormat.startTime),
      );

      return JSON.stringify({
        status: "success",
        message: "Raydium clmm pool created successfully",
        transaction: tx,
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

export class SolanaRaydiumCreateCpmm extends Tool {
  name = "raydium_create_cpmm";
  description = `Raydium's newest CPMM, does not require marketID, supports Token 2022 standard

  Inputs (input is a json string):
  mint1: string (required)
  mint2: string (required)
  configId: string (required), stores pool info, index, protocolFeeRate, tradeFeeRate, fundFeeRate, createPoolFee
  mintAAmount: number(int), eg: 1111 (required)
  mintBAmount: number(int), eg: 2222 (required)
  startTime: number(seconds), eg: now number or zero (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);

      const tx = await this.solanaKit.raydiumCreateCpmm(
        new PublicKey(inputFormat.mint1),
        new PublicKey(inputFormat.mint2),

        new PublicKey(inputFormat.configId),

        new BN(inputFormat.mintAAmount),
        new BN(inputFormat.mintBAmount),

        new BN(inputFormat.startTime),
      );

      return JSON.stringify({
        status: "success",
        message: "Raydium cpmm pool created successfully",
        transaction: tx,
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

export class SolanaOpenbookCreateMarket extends Tool {
  name = "solana_openbook_create_market";
  description = `Openbook marketId, required for ammv4

  Inputs (input is a json string):
  baseMint: string (required)
  quoteMint: string (required)
  lotSize: number (required)
  tickSize: number (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);

      const tx = await this.solanaKit.openbookCreateMarket(
        new PublicKey(inputFormat.baseMint),
        new PublicKey(inputFormat.quoteMint),

        inputFormat.lotSize,
        inputFormat.tickSize,
      );

      return JSON.stringify({
        status: "success",
        message: "Openbook market created successfully",
        transaction: tx,
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

export class SolanaManifestCreateMarket extends Tool {
  name = "solana_manifest_create_market";
  description = `Manifest market

  Inputs (input is a json string):
  baseMint: string (required)
  quoteMint: string (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);

      const tx = await this.solanaKit.manifestCreateMarket(
        new PublicKey(inputFormat.baseMint),
        new PublicKey(inputFormat.quoteMint),
      );

      return JSON.stringify({
        status: "success",
        message: "Create manifest market successfully",
        transaction: tx[0],
        marketId: tx[1],
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

export class SolanaPythFetchPrice extends Tool {
  name = "solana_pyth_fetch_price";
  description = `Fetch the price of a given price feed from Pyth's Hermes service

  Inputs:
  tokenSymbol: string, e.g., BTC for bitcoin`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const priceFeedID = await this.solanaKit.getPythPriceFeedID(input);
      const price = await this.solanaKit.getPythPrice(priceFeedID);

      const response: PythFetchPriceResponse = {
        status: "success",
        tokenSymbol: input,
        priceFeedID,
        price,
      };

      return JSON.stringify(response);
    } catch (error: any) {
      const response: PythFetchPriceResponse = {
        status: "error",
        tokenSymbol: input,
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      };
      return JSON.stringify(response);
    }
  }
}

export class SolanaResolveAllDomainsTool extends Tool {
  name = "solana_resolve_all_domains";
  description = `Resolve domain names to a public key for ALL domain types EXCEPT .sol domains.
  Use this for domains like .blink, .bonk, etc.
  DO NOT use this for .sol domains (use solana_resolve_domain instead).

  Input:
  domain: string, eg "mydomain.blink" or "mydomain.bonk" (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const owner = await this.solanaKit.resolveAllDomains(input);

      if (!owner) {
        return JSON.stringify({
          status: "error",
          message: "Domain not found",
          code: "DOMAIN_NOT_FOUND",
        });
      }

      return JSON.stringify({
        status: "success",
        message: "Domain resolved successfully",
        owner: owner?.toString(),
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "DOMAIN_RESOLUTION_ERROR",
      });
    }
  }
}

export class SolanaGetOwnedDomains extends Tool {
  name = "solana_get_owned_domains";
  description = `Get all domains owned by a specific wallet address.

  Inputs:
  owner: string, eg "4Be9CvxqHW6BYiRAxW9Q3xu1ycTMWaL5z8NX4HR3ha7t" (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const ownerPubkey = new PublicKey(input.trim());
      const domains = await this.solanaKit.getOwnedAllDomains(ownerPubkey);

      return JSON.stringify({
        status: "success",
        message: "Owned domains fetched successfully",
        domains,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "FETCH_OWNED_DOMAINS_ERROR",
      });
    }
  }
}

export class SolanaGetOwnedTldDomains extends Tool {
  name = "solana_get_owned_tld_domains";
  description = `Get all domains owned by the agent's wallet for a specific TLD.

  Inputs:
  tld: string, eg "bonk" (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const domains = await this.solanaKit.getOwnedDomainsForTLD(input);

      return JSON.stringify({
        status: "success",
        message: "TLD domains fetched successfully",
        domains,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "FETCH_TLD_DOMAINS_ERROR",
      });
    }
  }
}

export class SolanaGetAllTlds extends Tool {
  name = "solana_get_all_tlds";
  description = `Get all active top-level domains (TLDs) in the AllDomains Name Service`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(): Promise<string> {
    try {
      const tlds = await this.solanaKit.getAllDomainsTLDs();

      return JSON.stringify({
        status: "success",
        message: "TLDs fetched successfully",
        tlds,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "FETCH_TLDS_ERROR",
      });
    }
  }
}

export class SolanaGetMainDomain extends Tool {
  name = "solana_get_main_domain";
  description = `Get the main/favorite domain for a given wallet address.

  Inputs:
  owner: string, eg "4Be9CvxqHW6BYiRAxW9Q3xu1ycTMWaL5z8NX4HR3ha7t" (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const ownerPubkey = new PublicKey(input.trim());
      const mainDomain =
        await this.solanaKit.getMainAllDomainsDomain(ownerPubkey);

      return JSON.stringify({
        status: "success",
        message: "Main domain fetched successfully",
        domain: mainDomain,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "FETCH_MAIN_DOMAIN_ERROR",
      });
    }
  }
}

export class SolanaCreateGibworkTask extends Tool {
  name = "create_gibwork_task";
  description = `Create a task on Gibwork.

  Inputs (input is a JSON string):
  title: string, title of the task (required)
  content: string, description of the task (required)
  requirements: string, requirements to complete the task (required)
  tags: string[], list of tags associated with the task (required)
  payer: string, payer address (optional, defaults to agent wallet)
  tokenMintAddress: string, the mint address of the token, e.g., "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" (required)
  amount: number, payment amount (required)
  `;

  constructor(private solanaSdk: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const taskData = await this.solanaSdk.createGibworkTask(
        parsedInput.title,
        parsedInput.content,
        parsedInput.requirements,
        parsedInput.tags,
        parsedInput.tokenMintAddress,
        parsedInput.amount,
        parsedInput.payer,
      );

      const response: GibworkCreateTaskReponse = {
        status: "success",
        taskId: taskData.taskId,
        signature: taskData.signature,
      };

      return JSON.stringify(response);
    } catch (err: any) {
      return JSON.stringify({
        status: "error",
        message: err.message,
        code: err.code || "CREATE_TASK_ERROR",
      });
    }
  }
}

export class SolanaRockPaperScissorsTool extends Tool {
  name = "rock_paper_scissors";
  description = `Play rock paper scissors to win SEND coins.

  Inputs (input is a JSON string):
  choice: string, either "rock", "paper", or "scissors" (required)
  amount: number, amount of SOL to play with - must be 0.1, 0.01, or 0.005 SOL (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  private validateInput(input: any): void {
    if (input.choice !== undefined) {
      throw new Error("choice is required.");
    }
    if (
      input.amount !== undefined &&
      (typeof input.spaceKB !== "number" || input.spaceKB <= 0)
    ) {
      throw new Error("amount must be a positive number when provided");
    }
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);
      this.validateInput(parsedInput);
      const result = await this.solanaKit.rockPaperScissors(
        Number(parsedInput['"amount"']),
        parsedInput['"choice"'].replace(/^"|"$/g, "") as
          | "rock"
          | "paper"
          | "scissors",
      );

      return JSON.stringify({
        status: "success",
        message: result,
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

export class SolanaTipLinkTool extends Tool {
  name = "solana_tiplink";
  description = `Create a TipLink for transferring SOL or SPL tokens.
  Input is a JSON string with:
  - amount: number (required) - Amount to transfer
  - splmintAddress: string (optional) - SPL token mint address`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      if (!parsedInput.amount) {
        throw new Error("Amount is required");
      }

      const amount = parseFloat(parsedInput.amount);
      const splmintAddress = parsedInput.splmintAddress
        ? new PublicKey(parsedInput.splmintAddress)
        : undefined;

      const { url, signature } = await this.solanaKit.createTiplink(
        amount,
        splmintAddress,
      );

      return JSON.stringify({
        status: "success",
        url,
        signature,
        amount,
        tokenType: splmintAddress ? "SPL" : "SOL",
        message: `TipLink created successfully`,
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

export class SolanaListNFTForSaleTool extends Tool {
  name = "solana_list_nft_for_sale";
  description = `List an NFT for sale on Tensor Trade.

  Inputs (input is a JSON string):
  nftMint: string, the mint address of the NFT (required)
  price: number, price in SOL (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      // Validate NFT ownership first
      const nftAccount =
        await this.solanaKit.connection.getTokenAccountsByOwner(
          this.solanaKit.wallet_address,
          { mint: new PublicKey(parsedInput.nftMint) },
        );

      if (nftAccount.value.length === 0) {
        return JSON.stringify({
          status: "error",
          message:
            "NFT not found in wallet. Please make sure you own this NFT.",
          code: "NFT_NOT_FOUND",
        });
      }

      const tx = await this.solanaKit.tensorListNFT(
        new PublicKey(parsedInput.nftMint),
        parsedInput.price,
      );

      return JSON.stringify({
        status: "success",
        message: "NFT listed for sale successfully",
        transaction: tx,
        price: parsedInput.price,
        nftMint: parsedInput.nftMint,
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

export class SolanaCancelNFTListingTool extends Tool {
  name = "solana_cancel_nft_listing";
  description = `Cancel an NFT listing on Tensor Trade.

  Inputs (input is a JSON string):
  nftMint: string, the mint address of the NFT (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const tx = await this.solanaKit.tensorCancelListing(
        new PublicKey(parsedInput.nftMint),
      );

      return JSON.stringify({
        status: "success",
        message: "NFT listing cancelled successfully",
        transaction: tx,
        nftMint: parsedInput.nftMint,
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

export class SolanaFetchTokenReportSummaryTool extends Tool {
  name = "solana_fetch_token_report_summary";
  description = `Fetches a summary report for a specific token from RugCheck.
  Inputs:
  - mint: string, the mint address of the token, e.g., "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" (required).`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const mint = input.trim();
      const report = await this.solanaKit.fetchTokenReportSummary(mint);

      return JSON.stringify({
        status: "success",
        message: "Token report summary fetched successfully",
        report,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "FETCH_TOKEN_REPORT_SUMMARY_ERROR",
      });
    }
  }
}

export class SolanaFetchTokenDetailedReportTool extends Tool {
  name = "solana_fetch_token_detailed_report";
  description = `Fetches a detailed report for a specific token from RugCheck.
  Inputs:
  - mint: string, the mint address of the token, e.g., "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" (required).`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const mint = input.trim();
      const detailedReport =
        await this.solanaKit.fetchTokenDetailedReport(mint);

      return JSON.stringify({
        status: "success",
        message: "Detailed token report fetched successfully",
        report: detailedReport,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "FETCH_TOKEN_DETAILED_REPORT_ERROR",
      });
    }
  }
}

export class Solana3LandCreateSingle extends Tool {
  name = "3land_minting_tool";
  description = `Creates an NFT and lists it on 3.land's website

  Inputs:
  privateKey (required): represents the privateKey of the wallet - can be an array of numbers, Uint8Array or base58 string
  collectionAccount (optional): represents the account for the nft collection
  itemName (required): the name of the NFT
  sellerFee (required): the fee of the seller
  itemAmount (required): the amount of the NFTs that can be minted
  itemDescription (required): the description of the NFT
  traits (required): the traits of the NFT [{trait_type: string, value: string}]
  price (required): the price of the item, if is 0 the listing will be free
  mainImageUrl (required): the main image of the NFT
  coverImageUrl (optional): the cover image of the NFT
  splHash (optional): the hash of the spl token, if not provided listing will be in $SOL
  isMainnet (required): defines is the tx takes places in mainnet
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);
      const privateKey = inputFormat.privateKey;
      const isMainnet = inputFormat.isMainnet;

      const optionsWithBase58: StoreInitOptions = {
        ...(privateKey && { privateKey }),
        ...(isMainnet && { isMainnet }),
      };

      const collectionAccount = inputFormat.collectionAccount;

      const itemName = inputFormat?.itemName;
      const sellerFee = inputFormat?.sellerFee;
      const itemAmount = inputFormat?.itemAmount;
      const itemSymbol = inputFormat?.itemSymbol;
      const itemDescription = inputFormat?.itemDescription;
      const traits = inputFormat?.traits;
      const price = inputFormat?.price;
      const mainImageUrl = inputFormat?.mainImageUrl;
      const coverImageUrl = inputFormat?.coverImageUrl;
      const splHash = inputFormat?.splHash;

      const createItemOptions: CreateSingleOptions = {
        ...(itemName && { itemName }),
        ...(sellerFee && { sellerFee }),
        ...(itemAmount && { itemAmount }),
        ...(itemSymbol && { itemSymbol }),
        ...(itemDescription && { itemDescription }),
        ...(traits && { traits }),
        ...(price && { price }),
        ...(mainImageUrl && { mainImageUrl }),
        ...(coverImageUrl && { coverImageUrl }),
        ...(splHash && { splHash }),
      };

      if (!collectionAccount) {
        throw new Error("Collection account is required");
      }

      const tx = await this.solanaKit.create3LandNft(
        optionsWithBase58,
        collectionAccount,
        createItemOptions,
        isMainnet,
      );
      return JSON.stringify({
        status: "success",
        message: `Created listing successfully ${tx}`,
        transaction: tx,
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

export class Solana3LandCreateCollection extends Tool {
  name = "3land_minting_tool";
  description = `Creates an NFT Collection that you can visit on 3.land's website (3.land/collection/{collectionAccount})
  
  Inputs:
  privateKey (required): represents the privateKey of the wallet - can be an array of numbers, Uint8Array or base58 string
  isMainnet (required): defines is the tx takes places in mainnet
  collectionSymbol (required): the symbol of the collection
  collectionName (required): the name of the collection
  collectionDescription (required): the description of the collection
  mainImageUrl (required): the image of the collection
  coverImageUrl (optional): the cover image of the collection
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);
      const privateKey = inputFormat.privateKey;
      const isMainnet = inputFormat.isMainnet;

      const optionsWithBase58: StoreInitOptions = {
        ...(privateKey && { privateKey }),
        ...(isMainnet && { isMainnet }),
      };

      const collectionSymbol = inputFormat?.collectionSymbol;
      const collectionName = inputFormat?.collectionName;
      const collectionDescription = inputFormat?.collectionDescription;
      const mainImageUrl = inputFormat?.mainImageUrl;
      const coverImageUrl = inputFormat?.coverImageUrl;

      const collectionOpts: CreateCollectionOptions = {
        ...(collectionSymbol && { collectionSymbol }),
        ...(collectionName && { collectionName }),
        ...(collectionDescription && { collectionDescription }),
        ...(mainImageUrl && { mainImageUrl }),
        ...(coverImageUrl && { coverImageUrl }),
      };

      const tx = await this.solanaKit.create3LandCollection(
        optionsWithBase58,
        collectionOpts,
      );
      return JSON.stringify({
        status: "success",
        message: `Created Collection successfully ${tx}`,
        transaction: tx,
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

export class SolanaCloseEmptyTokenAccounts extends Tool {
  name = "close_empty_token_accounts";
  description = `Close all empty spl-token accounts and reclaim the rent`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(): Promise<string> {
    try {
      const { signature, size } =
        await this.solanaKit.closeEmptyTokenAccounts();

      return JSON.stringify({
        status: "success",
        message: `${size} accounts closed successfully. ${size === 48 ? "48 accounts can be closed in a single transaction try again to close more accounts" : ""}`,
        signature,
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

export class SolanaCreate2by2Multisig extends Tool {
  name = "create_2by2_multisig";
  description = `Create a 2-of-2 multisig account on Solana with the user and the agent, where both approvals will be required to run the transactions.
  
  Note: For one AI agent, only one 2-by-2 multisig can be created as it is pair-wise.

  Inputs (JSON string):
  - creator: string, the public key of the creator (required).`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);
      const creator = new PublicKey(inputFormat.creator);

      const multisig = await this.solanaKit.createSquadsMultisig(creator);

      return JSON.stringify({
        status: "success",
        message: "2-by-2 multisig account created successfully",
        multisig,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "CREATE_2BY2_MULTISIG_ERROR",
      });
    }
  }
}

export class SolanaDepositTo2by2Multisig extends Tool {
  name = "deposit_to_2by2_multisig";
  description = `Deposit funds to a 2-of-2 multisig account on Solana with the user and the agent, where both approvals will be required to run the transactions.

  Inputs (JSON string):
  - amount: number, the amount to deposit in SOL (required).`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);
      const amount = new Decimal(inputFormat.amount);

      const tx = await this.solanaKit.depositToMultisig(amount.toNumber());

      return JSON.stringify({
        status: "success",
        message: "Funds deposited to 2-by-2 multisig account successfully",
        transaction: tx,
        amount: amount.toString(),
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "DEPOSIT_TO_2BY2_MULTISIG_ERROR",
      });
    }
  }
}

export class SolanaTransferFrom2by2Multisig extends Tool {
  name = "transfer_from_2by2_multisig";
  description = `Create a transaction to transfer funds from a 2-of-2 multisig account on Solana with the user and the agent, where both approvals will be required to run the transactions.

  Inputs (JSON string):
  - amount: number, the amount to transfer in SOL (required).
  - recipient: string, the public key of the recipient (required).`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);
      const amount = new Decimal(inputFormat.amount);
      const recipient = new PublicKey(inputFormat.recipient);

      const tx = await this.solanaKit.transferFromMultisig(
        amount.toNumber(),
        recipient,
      );

      return JSON.stringify({
        status: "success",
        message: "Transaction added to 2-by-2 multisig account successfully",
        transaction: tx,
        amount: amount.toString(),
        recipient: recipient.toString(),
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "TRANSFER_FROM_2BY2_MULTISIG_ERROR",
      });
    }
  }
}

export class SolanaCreateProposal2by2Multisig extends Tool {
  name = "create_proposal_2by2_multisig";
  description = `Create a proposal to transfer funds from a 2-of-2 multisig account on Solana with the user and the agent, where both approvals will be required to run the transactions.
  
  If transactionIndex is not provided, the latest index will automatically be fetched and used.

  Inputs (JSON string):
  - transactionIndex: number, the index of the transaction (optional).`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);
      const transactionIndex = inputFormat.transactionIndex ?? undefined;

      const tx = await this.solanaKit.createMultisigProposal(transactionIndex);

      return JSON.stringify({
        status: "success",
        message: "Proposal created successfully",
        transaction: tx,
        transactionIndex: transactionIndex?.toString(),
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "CREATE_PROPOSAL_2BY2_MULTISIG_ERROR",
      });
    }
  }
}

export class SolanaApproveProposal2by2Multisig extends Tool {
  name = "approve_proposal_2by2_multisig";
  description = `Approve a proposal to transfer funds from a 2-of-2 multisig account on Solana with the user and the agent, where both approvals will be required to run the transactions.
  
  If proposalIndex is not provided, the latest index will automatically be fetched and used.

  Inputs (JSON string):
  - proposalIndex: number, the index of the proposal (optional).`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);
      const proposalIndex = inputFormat.proposalIndex ?? undefined;

      const tx = await this.solanaKit.approveMultisigProposal(proposalIndex);

      return JSON.stringify({
        status: "success",
        message: "Proposal approved successfully",
        transaction: tx,
        proposalIndex: proposalIndex.toString(),
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "APPROVE_PROPOSAL_2BY2_MULTISIG_ERROR",
      });
    }
  }
}

export class SolanaRejectProposal2by2Multisig extends Tool {
  name = "reject_proposal_2by2_multisig";
  description = `Reject a proposal to transfer funds from a 2-of-2 multisig account on Solana with the user and the agent, where both approvals will be required to run the transactions.
  
  If proposalIndex is not provided, the latest index will automatically be fetched and used.

  Inputs (JSON string):
  - proposalIndex: number, the index of the proposal (optional).`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);
      const proposalIndex = inputFormat.proposalIndex ?? undefined;

      const tx = await this.solanaKit.rejectMultisigProposal(proposalIndex);

      return JSON.stringify({
        status: "success",
        message: "Proposal rejected successfully",
        transaction: tx,
        proposalIndex: proposalIndex.toString(),
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "REJECT_PROPOSAL_2BY2_MULTISIG_ERROR",
      });
    }
  }
}

export class SolanaExecuteProposal2by2Multisig extends Tool {
  name = "execute_proposal_2by2_multisig";
  description = `Execute a proposal/transaction to transfer funds from a 2-of-2 multisig account on Solana with the user and the agent, where both approvals will be required to run the transactions.
  
  If proposalIndex is not provided, the latest index will automatically be fetched and used.

  Inputs (JSON string):
  - proposalIndex: number, the index of the proposal (optional).`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);
      const proposalIndex = inputFormat.proposalIndex ?? undefined;

      const tx = await this.solanaKit.executeMultisigTransaction(proposalIndex);

      return JSON.stringify({
        status: "success",
        message: "Proposal executed successfully",
        transaction: tx,
        proposalIndex: proposalIndex.toString(),
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "EXECUTE_PROPOSAL_2BY2_MULTISIG_ERROR",
      });
    }
  }
}

export function createSolanaTools(solanaKit: SolanaAgentKit) {
  return [
    new SolanaBalanceTool(solanaKit),
    new SolanaBalanceOtherTool(solanaKit),
    new SolanaTransferTool(solanaKit),
    new SolanaDeployTokenTool(solanaKit),
    new SolanaDeployCollectionTool(solanaKit),
    new SolanaMintNFTTool(solanaKit),
    new SolanaTradeTool(solanaKit),
    new SolanaRequestFundsTool(solanaKit),
    new SolanaRegisterDomainTool(solanaKit),
    new SolanaGetWalletAddressTool(solanaKit),
    new SolanaPumpfunTokenLaunchTool(solanaKit),
    new SolanaCreateImageTool(solanaKit),
    new SolanaLendAssetTool(solanaKit),
    new SolanaTPSCalculatorTool(solanaKit),
    new SolanaStakeTool(solanaKit),
    new SolanaRestakeTool(solanaKit),
    new SolanaFetchPriceTool(solanaKit),
    new SolanaGetDomainTool(solanaKit),
    new SolanaTokenDataTool(solanaKit),
    new SolanaTokenDataByTickerTool(solanaKit),
    new SolanaCompressedAirdropTool(solanaKit),
    new SolanaRaydiumCreateAmmV4(solanaKit),
    new SolanaRaydiumCreateClmm(solanaKit),
    new SolanaRaydiumCreateCpmm(solanaKit),
    new SolanaOpenbookCreateMarket(solanaKit),
    new SolanaManifestCreateMarket(solanaKit),
    new SolanaLimitOrderTool(solanaKit),
    new SolanaBatchOrderTool(solanaKit),
    new SolanaCancelAllOrdersTool(solanaKit),
    new SolanaWithdrawAllTool(solanaKit),
    new SolanaClosePosition(solanaKit),
    new SolanaOrcaCreateCLMM(solanaKit),
    new SolanaOrcaCreateSingleSideLiquidityPool(solanaKit),
    new SolanaOrcaFetchPositions(solanaKit),
    new SolanaOrcaOpenCenteredPosition(solanaKit),
    new SolanaOrcaOpenSingleSidedPosition(solanaKit),
    new SolanaPythFetchPrice(solanaKit),
    new SolanaResolveDomainTool(solanaKit),
    new SolanaGetOwnedDomains(solanaKit),
    new SolanaGetOwnedTldDomains(solanaKit),
    new SolanaGetAllTlds(solanaKit),
    new SolanaGetMainDomain(solanaKit),
    new SolanaResolveAllDomainsTool(solanaKit),
    new SolanaCreateGibworkTask(solanaKit),
    new SolanaRockPaperScissorsTool(solanaKit),
    new SolanaTipLinkTool(solanaKit),
    new SolanaListNFTForSaleTool(solanaKit),
    new SolanaCancelNFTListingTool(solanaKit),
    new SolanaCloseEmptyTokenAccounts(solanaKit),
    new SolanaFetchTokenReportSummaryTool(solanaKit),
    new SolanaFetchTokenDetailedReportTool(solanaKit),
    new Solana3LandCreateSingle(solanaKit),
    new Solana3LandCreateCollection(solanaKit),
    new SolanaPerpOpenTradeTool(solanaKit),
    new SolanaPerpCloseTradeTool(solanaKit),
    new SolanaFlashOpenTrade(solanaKit),
    new SolanaFlashCloseTrade(solanaKit),
    new Solana3LandCreateSingle(solanaKit),
    new SolanaCreate2by2Multisig(solanaKit),
    new SolanaDepositTo2by2Multisig(solanaKit),
    new SolanaTransferFrom2by2Multisig(solanaKit),
    new SolanaCreateProposal2by2Multisig(solanaKit),
    new SolanaApproveProposal2by2Multisig(solanaKit),
    new SolanaRejectProposal2by2Multisig(solanaKit),
    new SolanaExecuteProposal2by2Multisig(solanaKit),
  ];
}
