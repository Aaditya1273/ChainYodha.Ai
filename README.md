# ChainYodha.Ai

An onchain AI-powered trust & risk scoring infrastructure for Web3 on Arbitrum.

## Overview

ChainYodha.Ai provides transparent wallet and project trust scores derived from onchain activity and optional offchain signals. It exposes an onchain oracle contract where dApps can query wallet trust scores and integrates with a backend AI scoring pipeline.

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Rust (for Stylus contracts)
- Git

### Local Development

1. **Clone and setup**
\`\`\`bash
git clone https://github.com/your-username/trustgrid-ai.git
cd trustgrid-ai
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

## Demo Wallets

- **High Trust**: `0x1234...` (Score: 85-95)
- **Medium Trust**: `0x5678...` (Score: 50-70)
- **Low Trust**: `0x9abc...` (Score: 10-30)

## Environment Variables

Copy `.env.example` to `.env` and configure:

\`\`\`bash
# Arbitrum Sepolia
ARB_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
ORACLE_PRIVATE_KEY=your_oracle_private_key
CONTRACT_ADDRESS=deployed_contract_address

# Optional APIs
FARCASTER_API_KEY=your_farcaster_key
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_key
\`\`\`

## Deployment

### Arbitrum Sepolia Testnet
- Contract: `0x...` (will be populated after deployment)
- Frontend: `https://trustgrid-ai.vercel.app`
- API: `https://api.trustgrid-ai.com`

## License

MIT License - see [LICENSE.md](LICENSE.md)
