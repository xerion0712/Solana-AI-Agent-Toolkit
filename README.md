<div align="center">

# Solana Agent Kit

![Solana Agent Kit Cover 1 (3)](https://github.com/user-attachments/assets/cfa380f6-79d9-474d-9852-3e1976c6de70)


![NPM Downloads](https://img.shields.io/npm/dm/solana-agent-kit?style=for-the-badge)
![GitHub forks](https://img.shields.io/github/forks/sendaifun/solana-agent-kit?style=for-the-badge)
![GitHub License](https://img.shields.io/github/license/sendaifun/solana-agent-kit?style=for-the-badge)

</div>

An open-source toolkit for connecting AI agents to Solana protocols. Now, any agent, using any model can autonomously perform 15+ Solana actions:

- Trade tokens
- Launch new tokens
- Lend assets
- Send compressed airdrops
- Execute blinks
- Launch tokens on AMMs
- And more...

Anyone - whether an SF-based AI researcher or a crypto-native builder - can bring their AI agents trained with any model and seamlessly integrate with Solana.


[![Run on Repl.it](https://replit.com/badge/github/sendaifun/solana-agent-kit)](https://replit.com/@sendaifun/Solana-Agent-Kit)
> Replit template created by [Arpit Singh](https://github.com/The-x-35)

## 🔧 Core Blockchain Features

- **Token Operations**
  - Deploy SPL tokens by Metaplex
  - Transfer assets
  - Balance checks
  - Stake SOL
  - Zk compressed Airdrop by Light Protocol and Helius

- **NFT Management via Metaplex**
  - Collection deployment
  - NFT minting
  - Metadata management
  - Royalty configuration

- **DeFi Integration**
  - Jupiter Exchange swaps
  - Launch on Pump via PumpPortal
  - Raydium pool creation (CPMM, CLMM, AMMv4)
  - Orca Whirlpool integration
  - Manifest market creation, and limit orders
  - Meteora Dynamic AMM, DLMM Pool, and Alpha Vault
  - Openbook market creation
  - Register and Resolve SNS
  - Jito Bundles
  - Pyth Price feeds for fetching Asset Prices
  - Register/resolve Alldomains

- **Solana Blinks**
   - Lending by Lulo (Best APR for USDC)
   - Send Arcade Games
   - JupSOL staking

- **Non-Financial Actions**
  - Gib Work for registering bounties

## 🤖 AI Integration Features

- **LangChain Integration**
  - Ready-to-use LangChain tools for blockchain operations
  - Autonomous agent support with React framework
  - Memory management for persistent interactions
  - Streaming responses for real-time feedback

- **Autonomous Modes**
  - Interactive chat mode for guided operations
  - Autonomous mode for independent agent actions
  - Configurable action intervals
  - Built-in error handling and recovery

- **AI Tools**
  - DALL-E integration for NFT artwork generation
  - Natural language processing for blockchain commands
  - Price feed integration for market analysis
  - Automated decision-making capabilities

## 📦 Installation

```bash
npm install solana-agent-kit
```

## Quick Start

```typescript
import { SolanaAgentKit, createSolanaTools } from "solana-agent-kit";

// Initialize with private key and optional RPC URL
const agent = new SolanaAgentKit(
  "your-wallet-private-key-as-base58",
  "https://api.mainnet-beta.solana.com",
  "your-openai-api-key"
);

// Create LangChain tools
const tools = createSolanaTools(agent);
```

## Usage Examples

### Deploy a New Token

```typescript
const result = await agent.deployToken(
  "my ai token", // name
  "uri", // uri
  "token", // symbol
  9, // decimals
  1000000 // initial supply
);

console.log("Token Mint Address:", result.mint.toString());
```

### Create NFT Collection

```typescript
const collection = await agent.deployCollection({
  name: "My NFT Collection",
  uri: "https://arweave.net/metadata.json",
  royaltyBasisPoints: 500, // 5%
  creators: [
    {
      address: "creator-wallet-address",
      percentage: 100,
    },
  ],
});
```

### Swap Tokens

```typescript
import { PublicKey } from "@solana/web3.js";

const signature = await agent.trade(
  new PublicKey("target-token-mint"),
  100, // amount
  new PublicKey("source-token-mint"),
  300 // 3% slippage
);
```

### Lend Tokens

```typescript
import { PublicKey } from "@solana/web3.js";

const signature = await agent.lendAssets(
  100 // amount of USDC to lend
);
```

### Stake SOL

```typescript
const signature = await agent.stake(
  1 // amount in SOL to stake
);
```

### Send an SPL Token Airdrop via ZK Compression

```typescript
import { PublicKey } from "@solana/web3.js";

(async () => {
  console.log(
    "~Airdrop cost estimate:",
    getAirdropCostEstimate(
      1000, // recipients
      30_000 // priority fee in lamports
    )
  );

  const signature = await agent.sendCompressedAirdrop(
    new PublicKey("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"), // mint
    42, // amount per recipient
    [
      new PublicKey("1nc1nerator11111111111111111111111111111111"),
      // ... add more recipients
    ],
    30_000 // priority fee in lamports
  );
})();
```

### Fetch Price Data from Pyth

```typescript

const price = await agent.pythFetchPrice(
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"
);

console.log("Price in BTC/USD:", price);
```

## Examples

### LangGraph Multi-Agent System

The repository includes an advanced example of building a multi-agent system using LangGraph and Solana Agent Kit. Located in `examples/agent-kit-langgraph`, this example demonstrates:

- Multi-agent architecture using LangGraph's StateGraph
- Specialized agents for different tasks:
  - General purpose agent for basic queries
  - Transfer/Swap agent for transaction operations
  - Read agent for blockchain data queries
  - Manager agent for routing and orchestration
- Fully typed TypeScript implementation
- Environment-based configuration

Check out the [LangGraph example](examples/agent-kit-langgraph) for a complete implementation of an advanced Solana agent system.

## Dependencies

The toolkit relies on several key Solana and Metaplex libraries:

- @solana/web3.js
- @solana/spl-token
- @metaplex-foundation/mpl-token-metadata
- @metaplex-foundation/mpl-core
- @metaplex-foundation/umi
- @lightprotocol/compressed-token
- @lightprotocol/stateless.js
- @pythnetwork/price-service-client

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
Refer to [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on how to contribute to this project.

## Contributors

<a href="https://github.com/sendaifun/solana-agent-kit/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=sendaifun/solana-agent-kit" />
</a>


## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=sendaifun/solana-agent-kit&type=Date)](https://star-history.com/#sendaifun/solana-agent-kit&Date)

## License

Apache-2 License

## Security

This toolkit handles private keys and transactions. Always ensure you're using it in a secure environment and never share your private keys.

