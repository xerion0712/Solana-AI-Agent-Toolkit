# Solana AI Agent Toolkit

A comprehensive trading and DeFi automation framework that enables AI agents to interact seamlessly with the Solana blockchain. Empower your AI models with the ability to execute sophisticated financial operations autonomously.


## Quick Start

```bash
npm install solana-agent-kit
```

```typescript
import { SolanaAgentKit, createSolanaTools } from "solana-agent-kit";

// Initialize your AI trading agent
const agent = new SolanaAgentKit(
  "your-wallet-private-key", 
  "https://api.mainnet-beta.solana.com",
  "your-openai-api-key"
);

// Get LangChain-ready tools
const tools = createSolanaTools(agent);
```

## Core Capabilities

### Token & NFT Operations
- SPL Token Deployment: Launch new tokens via Metaplex
- NFT Collections: Create and manage NFT collections on 3.Land
- Automated Listings: Auto-list NFTs for sale in any SPL token
- Royalty Management: Configure creator fees and distributions

### Advanced Trading
- DEX Swaps: Jupiter Exchange integration with optimal routing
- Liquidity Provision: Create pools on Raydium, Orca, Meteor
- Perpetuals Trading: Leveraged positions via Adrena Protocol
- Limit Orders: Advanced order types on Manifest

### DeFi & Staking
- Lending Protocols: Earn yield with Lulo (best USDC APR)
- Liquid Staking: Stake SOL via JupSOL and Solayer
- Vault Strategies: Deposit into Drift and Voltr yield vaults
- Borrowing: Access leverage through Drift lending

### Advanced Features
- ZK Airdrops: Compressed token distributions via Light Protocol
- Solana Blinks: Transaction links for seamless user experiences
- Priority Fees: Configurable transaction prioritization
- Multi-Agent Systems: LangGraph integration for complex workflows

## Key Features

### AI Integration
- LangChain Compatible: Ready-to-use tools for autonomous agents
- Vercel AI SDK: Framework-agnostic AI agent support
- Memory Management: Persistent state for continuous interactions
- Streaming Responses: Real-time feedback for dynamic environments

### Security & Reliability
- Priority Fee Management: Ensure transaction confirmation
- Error Handling: Robust recovery mechanisms
- Multi-Network Support: Devnet and Mainnet compatibility
- Gas Optimization: Efficient transaction bundling

## Usage Examples

### Deploy a New Token
```typescript
const result = await agent.deployToken(
  "AI Trading Token",
  "https://metadata.url",
  "AITT",
  9,
  1000000
);
console.log("Token Address:", result.mint.toString());
```

### Execute a Trade
```typescript
const signature = await agent.trade(
  new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // USDC
  100, // Amount
  new PublicKey("So11111111111111111111111111111111111111112"), // SOL
  2 // 2% slippage
);
```

### Create NFT Collection
```typescript
const collection = await agent.create3LandCollection({
  collectionName: "AI Generated Art",
  collectionSymbol: "AIGA",
  collectionDescription: "Art created by AI agents",
  mainImageUrl: "https://image.url"
});
```

### Advanced: Multi-Agent System
Check out our `examples/agent-kit-langgraph` for a sophisticated multi-agent implementation featuring:
- Specialized agents for different tasks
- LangGraph state management
- Typed TypeScript architecture
- Environment-based configuration

## Technical Stack

### Core Dependencies
- @solana/web3.js - Solana blockchain interaction
- @metaplex-foundation/* - NFT and token standards
- @lightprotocol/compressed-token - ZK airdrops
- @solana/spl-token - SPL token management

### AI Integration
- LangChain compatibility
- Vercel AI SDK support
- React framework for autonomous agents
- Streaming response handling

## Advanced Features

### Drift Protocol Integration
```typescript
// Create leveraged positions
const signature = await agent.tradeUsingDriftPerpAccount({
  amount: 500,
  symbol: "SOL",
  action: "long",
  type: "limit",
  price: 180 // Limit order at $180/SOL
});

// Manage yield vaults
const vaultInfo = await agent.voltrGetPositionValues("vault-address");
```

### ZK Compressed Airdrops
```typescript
const cost = getAirdropCostEstimate(1000, 30000);
const signature = await agent.sendCompressedAirdrop(
  tokenMint,
  42, // Amount per recipient
  recipientList,
  30000 // Priority fee
);
```

## Development

### Contributing
We welcome contributions! Please see CONTRIBUTING.md for guidelines.

### Security
This toolkit handles sensitive operations. Always:
- Use secure environments
- Never expose private keys
- Test on devnet first
- Review all transactions

### Funding Support
Support open-source development:
Solana Address: EKHTbXpsm6YDgJzMkFxNU1LNXeWcUW7Ezf8mjUNQQ4Pa
