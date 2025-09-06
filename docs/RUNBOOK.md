# ChainYodha.Ai - Deployment & Demo Runbook

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+
- Python 3.9+
- Rust (for Stylus contracts)
- Git

### Option 1: Use Live Demo
```bash
# Visit the deployed application
open https://chainyodha-ai.vercel.app

# Try demo wallets:
# High Trust: 0x1234567890123456789012345678901234567890 (Score: 92)
# Medium Trust: 0x5678901234567890123456789012345678901234 (Score: 65)  
# Low Trust: 0x9abcdef123456789012345678901234567890123 (Score: 23)
```

### Option 2: Local Development
```bash
# 1. Clone repository
git clone https://github.com/your-username/chainyodha-ai.git
cd chainyodha-ai

# 2. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 3. Install dependencies and start services
./scripts/setup_local.sh

# 4. Run demo
./scripts/run_demo.sh
```

---

## 📋 Complete Setup Instructions

### 1. Environment Configuration

Create `.env` file with required variables:

```bash
# Arbitrum Sepolia Configuration
ARB_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
ARB_SEPOLIA_CHAIN_ID=421614

# Oracle Configuration (generate with ./scripts/generate_keypair.sh)
ORACLE_PRIVATE_KEY=0x...
ORACLE_PUBLIC_KEY=0x...

# Contract Addresses (populated after deployment)
TRUST_ORACLE_CONTRACT=0x...

# Database
DATABASE_URL=sqlite:./data/chainyodha.db

# API Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Optional External APIs
FARCASTER_API_KEY=your_farcaster_api_key
GITHUB_TOKEN=your_github_personal_access_token
OPENAI_API_KEY=your_openai_api_key
```

### 2. Generate Oracle Keys

```bash
# Generate ECDSA keypair for oracle signing
./scripts/generate_keypair.sh

# This will output:
# ORACLE_PRIVATE_KEY=0x...
# ORACLE_PUBLIC_KEY=0x...
# Add these to your .env file
```

### 3. Install Dependencies

```bash
# Root dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..

# Frontend dependencies  
cd frontend && npm install && cd ..

# Contracts dependencies
cd contracts && npm install && cd ..

# ML dependencies
cd ml && pip install -r requirements.txt && cd ..
```

### 4. Start Local Services

```bash
# Start all services with one command
./scripts/setup_local.sh

# Or start individually:

# 1. Start local blockchain (optional - can use Arbitrum Sepolia)
npx hardhat node

# 2. Start backend API
cd backend && npm run dev &

# 3. Start frontend
cd frontend && npm run dev &

# 4. Train ML model (optional - pre-trained model included)
cd ml && python train.py
```

---

## 🌐 Deploy to Arbitrum Sepolia

### 1. Deploy Smart Contracts

```bash
# Ensure you have ARB_SEPOLIA_RPC and ORACLE_PUBLIC_KEY in .env
./scripts/deploy_contracts.sh

# This will:
# 1. Compile Solidity contracts with Hardhat
# 2. Build Stylus contracts with Cargo
# 3. Deploy TrustOracle to Arbitrum Sepolia
# 4. Verify contracts on Arbiscan
# 5. Update .env with contract addresses
```

### 2. Deploy Backend API

```bash
# Build backend
cd backend && npm run build

# Deploy to your preferred platform:
# - Railway: railway up
# - Render: render deploy
# - AWS: sam deploy
# - Or use Docker: docker build -t chainyodha-backend .
```

### 3. Deploy Frontend

```bash
# Build frontend
cd frontend && npm run build

# Deploy to Vercel (recommended)
vercel --prod

# Or deploy to Netlify
netlify deploy --prod --dir=out

# Update FRONTEND_URL in backend .env
```

---

## 🎮 Demo Script (For Judges)

### Demo 1: Trust Score Computation (2 minutes)

```bash
# 1. Open frontend
open http://localhost:3000

# 2. Enter demo wallet address
# High Trust: 0x1234567890123456789012345678901234567890

# 3. Show real-time computation
# - Score: 92/100
# - Explanation: "Consistent DeFi activity with strong social signals"
# - Feature breakdown with visual charts
# - Confidence: 94%

# 4. Submit to blockchain
# Click "Submit to Chain" button
# Show transaction on Arbiscan
```

### Demo 2: Smart Contract Integration (1 minute)

```bash
# 1. Open Remix IDE or use Hardhat console
npx hardhat console --network arbitrumSepolia

# 2. Connect to deployed contract
const TrustOracle = await ethers.getContractFactory("TrustOracle");
const oracle = TrustOracle.attach("0x...");

# 3. Query trust score
const score = await oracle.getTrustScore("0x1234567890123456789012345678901234567890");
console.log("Score:", score.score.toString());

# 4. Check if trusted
const trusted = await oracle.isTrusted("0x1234567890123456789012345678901234567890");
console.log("Trusted:", trusted);
```

### Demo 3: API Integration (1 minute)

```bash
# 1. Compute score via API
curl -X POST http://localhost:3001/compute-score \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x1234567890123456789012345678901234567890",
    "optionalSignals": {
      "farcasterFollowers": 1500,
      "githubContributions": 250
    }
  }'

# 2. Get cached score
curl http://localhost:3001/wallet/0x1234567890123456789012345678901234567890

# 3. Submit to blockchain
curl -X POST http://localhost:3001/submit-onchain \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "score": 92,
    "timestamp": 1699123456
  }'
```

---

## 🔧 Troubleshooting

### Common Issues

**1. Contract deployment fails**
```bash
# Check network configuration
echo $ARB_SEPOLIA_RPC
# Ensure you have testnet ETH
# Verify ORACLE_PUBLIC_KEY is set
```

**2. Backend API errors**
```bash
# Check database connection
ls -la data/chainyodha.db
# Verify environment variables
cat .env | grep -v "PRIVATE_KEY"
# Check logs
tail -f backend/logs/app.log
```

**3. Frontend build errors**
```bash
# Clear Next.js cache
cd frontend && rm -rf .next
# Reinstall dependencies
rm -rf node_modules package-lock.json && npm install
# Check environment variables
echo $NEXT_PUBLIC_API_URL
```

**4. ML model issues**
```bash
# Reinstall Python dependencies
cd ml && pip install -r requirements.txt --force-reinstall
# Regenerate synthetic data
python generate_synth.py
# Retrain model
python train.py
```

### Performance Optimization

**1. Database optimization**
```sql
-- Add indexes for better query performance
CREATE INDEX idx_wallet_address ON trust_scores(wallet_address);
CREATE INDEX idx_timestamp ON score_history(timestamp);
```

**2. API caching**
```bash
# Enable Redis for production
export REDIS_URL=redis://localhost:6379
# Update backend to use Redis cache
```

**3. Frontend optimization**
```bash
# Enable static export for better performance
cd frontend && npm run build && npm run export
```

---

## 📊 Monitoring & Analytics

### Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Database status
sqlite3 data/chainyodha.db ".tables"

# Contract status (on Arbitrum Sepolia)
cast call $TRUST_ORACLE_CONTRACT "getTrustThreshold()" --rpc-url $ARB_SEPOLIA_RPC
```

### Performance Metrics

```bash
# API response times
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:3001/compute-score

# Database query performance
sqlite3 data/chainyodha.db "EXPLAIN QUERY PLAN SELECT * FROM trust_scores WHERE wallet_address = '0x...';"

# ML model inference time
cd ml && python -c "import time; from train import model; start=time.time(); model.predict([[1,2,3,4,5]]); print(f'Inference: {time.time()-start:.3f}s')"
```

---

## 🔐 Security Checklist

### Pre-Production

- [ ] Rotate oracle private keys
- [ ] Enable rate limiting (100 req/min)
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS properly
- [ ] Enable request logging
- [ ] Set up monitoring alerts
- [ ] Backup database regularly
- [ ] Test disaster recovery

### Smart Contract Security

- [ ] Audit signature verification logic
- [ ] Test replay attack protection
- [ ] Verify access controls
- [ ] Check for integer overflows
- [ ] Test edge cases (zero scores, etc.)

---

## 📞 Support & Contact

**Issues**: https://github.com/chainyodha-ai/issues
**Documentation**: https://docs.chainyodha.ai
**Discord**: https://discord.gg/chainyodha
**Email**: hello@chainyodha.ai

---

*Last updated: 2024-01-15*
*Version: 1.0.0*
