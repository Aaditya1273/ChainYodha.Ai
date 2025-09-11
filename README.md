# ChainYodha.Ai:

An onchain AI-powered trust & risk scoring infrastructure for Web3 on Arbitrum.

## Overview

ChainYodha.Ai provides transparent wallet and project trust scores derived from real blockchain activity and optional offchain signals. It features a comprehensive scoring system that analyzes 8 key factors including transaction history, smart contract usage, portfolio stability, account age, social presence, ENS domains, cross-chain activity, and DeFi engagement. The system exposes an onchain oracle contract where dApps can query wallet trust scores with cryptographic signatures.

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Rust (for Stylus contracts)
- Git

### Local Development

1. **Clone and setup**
\`\`\`bash
git clone https://github.com/your-username/chainyodha-ai.git
cd chainyodha-ai
./scripts/setup_local.sh
\`\`\`

2. **Generate Oracle Keys**
\`\`\`bash
./scripts/generate_keypair.sh
\`\`\`

3. **Deploy Contracts (Arbitrum Sepolia)**
\`\`\`bash
./scripts/deploy_contracts.sh
\`\`\`

4. **Run Demo**
\`\`\`bash
./scripts/run_demo.sh
\`\`\`

## Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  Smart Contract │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Stylus/Sol)  │
│                 │    │                 │    │                 │
│ • Score Display │    │ • Feature Eng   │    │ • Oracle Store  │
│ • Wallet Connect│    │ • ML Pipeline   │    │ • Score Query   │
│ • Integration   │    │ • ECDSA Signing │    │ • Signature Val │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## Components

- **`contracts/`** - Stylus (Rust) and Solidity smart contracts
- **`backend/`** - Node.js/TypeScript API and oracle service
- **`frontend/`** - Next.js PWA mobile-first interface
- **`ml/`** - Machine learning pipeline and feature engineering
- **`scripts/`** - Deployment and demo automation
- **`docs/`** - Documentation and pitch materials

## Trust Scoring Features

### Comprehensive Analysis
- **Transaction History** - Volume, frequency, and patterns
- **Smart Contract Usage** - DeFi protocols and contract interactions
- **Portfolio Stability** - Balance consistency and risk assessment
- **Account Age** - Estimated from transaction activity
- **Social Presence** - Farcaster followers and GitHub contributions
- **ENS Domain** - Domain ownership verification
- **Cross-chain Activity** - Bridge transactions and multi-chain presence
- **DeFi Engagement** - Swap frequency and protocol usage

### Real-time Features
- Fresh score computation (no stale cached data)
- Dynamic confidence levels (0-100% based on data availability)
- Risk assessment (Low/Medium/High based on score)
- Detailed breakdown with normalized values and weights
- AI-powered explanations for score factors

### Wallet Support
- MetaMask, WalletConnect, Coinbase Wallet
- Phantom, Brave Wallet, Trust Wallet
- Ledger, Trezor, Argent, and more via RainbowKit

## Demo Wallets

- **High Trust**: `0x1234...` (Score: 80-100, Low Risk)
- **Medium Trust**: `0x5678...` (Score: 50-79, Medium Risk)
- **Low Trust**: `0x9abc...` (Score: 0-49, High Risk)

## Environment Variables

Copy `.env.example` to `.env` and configure:

### Backend (.env)
```bash
# Arbitrum Sepolia
ARB_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
ORACLE_PRIVATE_KEY=your_oracle_private_key
TRUST_ORACLE_CONTRACT=deployed_contract_address

# Optional APIs for enhanced scoring
FARCASTER_API_KEY=your_farcaster_key
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_key
```

### Frontend (.env.development)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_ARB_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
```

## API Endpoints

### Trust Score Analysis
```bash
POST /api/score
{
  "wallet": "0x...",
  "optionalSignals": {
    "githubContributions": 150,
    "farcasterFollowers": 500
  }
}
```

### Response Format
```json
{
  "score": 44,
  "confidence": 70,
  "breakdown": [
    {
      "feature": "Transaction History",
      "weight": 25,
      "value": 150,
      "normalizedValue": 0.75
    }
  ],
  "explanation": "AI-generated analysis",
  "metadataHash": "0x...",
  "signature": "0x...",
  "timestamp": 1704067200
}
```

## Deployment

### Arbitrum Sepolia Testnet
- Contract: `0x...` (will be populated after deployment)
- Frontend: `https://chainyodha-ai.vercel.app`
- API: `https://api.chainyodha-ai.com`

## Recent Updates

- ✅ Fixed API endpoint mismatches between frontend and backend
- ✅ Enhanced wallet connector support via RainbowKit
- ✅ Replaced mock data with real blockchain queries
- ✅ Fixed confidence calculation (was showing 0%)
- ✅ Disabled caching for fresh score computation
- ✅ Added comprehensive feature breakdown display
- ✅ Improved risk level assessment logic

## License

MIT License - see [LICENSE.md](LICENSE.md)
