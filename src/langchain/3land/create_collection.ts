import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../agent";
import {
  CreateCollectionOptions,
  StoreInitOptions,
} from "@3land/listings-sdk/dist/types/implementation/implementationTypes";

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
