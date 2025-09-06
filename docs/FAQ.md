# ChainYodha.Ai - Frequently Asked Questions

## 🤔 General Questions

### What is ChainYodha.Ai?
ChainYodha.Ai is an AI-powered trust and risk scoring infrastructure for Web3. We provide transparent, explainable trust scores for Ethereum wallets based on onchain activity and optional offchain signals.

### How is this different from existing solutions?
- **Explainable AI**: Every score comes with detailed explanations using SHAP values
- **Onchain Oracle**: Decentralized verification via smart contracts on Arbitrum
- **Multi-Signal Analysis**: Combines 15+ onchain metrics with social reputation data
- **Developer-Friendly**: Simple integration via smart contracts and APIs

### Who can use ChainYodha.Ai?
- **DeFi Protocols**: Risk-based lending, trading limits, collateral requirements
- **NFT Marketplaces**: Seller verification and trust badges
- **DAOs**: Reputation-weighted governance and participation
- **Developers**: Building trust-aware dApps and services

## 🔬 Technical Questions

### How accurate are the trust scores?
Our ML models achieve 85%+ accuracy on synthetic datasets. We continuously improve accuracy by:
- Training on larger datasets as we collect more data
- Incorporating user feedback and real-world outcomes
- Regular model retraining and validation

### What data sources do you use?
**Onchain Data (Always Used)**:
- Transaction history and patterns
- Smart contract interactions
- Token holdings and transfers
- DeFi protocol usage
- NFT ownership and trading
- Bridge transactions

**Offchain Data (Optional)**:
- Farcaster social activity and followers
- GitHub contributions and repositories
- ENS domain ownership
- Other Web3 identity signals

### How do you prevent gaming the system?
- **Multi-Signal Analysis**: Difficult to fake across all dimensions
- **Historical Weighting**: Recent activity weighted more heavily
- **Anomaly Detection**: ML models identify suspicious patterns
- **Cost of Attack**: Expensive to maintain fake reputation across multiple platforms
- **Continuous Monitoring**: Scores updated as new data becomes available

### What about privacy?
- All onchain analysis uses publicly available blockchain data
- Offchain signals require explicit user consent
- We don't store private keys or sensitive personal information
- Users can opt out of offchain analysis at any time

## 🏗️ Integration Questions

### How do I integrate ChainYodha.Ai into my dApp?

**Smart Contract Integration**:
```solidity
import "./ITrustOracle.sol";

contract MyDApp {
    ITrustOracle trustOracle = ITrustOracle(0x...);
    
    function checkUser(address user) external view returns (bool) {
        return trustOracle.isTrusted(user);
    }
}
```

**API Integration**:
```javascript
const response = await fetch('/compute-score', {
  method: 'POST',
  body: JSON.stringify({ wallet: '0x...' })
});
const { score, explanation } = await response.json();
```

### What are the gas costs?
- **Query existing score**: ~47k gas
- **Submit new score**: ~65k gas
- **Check if trusted**: ~25k gas

Our Rust/Stylus implementation is significantly more gas-efficient than pure Solidity alternatives.

### What networks are supported?
- **Currently**: Arbitrum Sepolia (testnet)
- **Coming Soon**: Arbitrum One (mainnet)
- **Roadmap**: Ethereum, Polygon, Base, Optimism

### Are there rate limits?
- **Free Tier**: 100 API calls per day
- **Developer Tier**: 10,000 API calls per month ($50/month)
- **Enterprise**: Custom limits and pricing

## 💰 Business Questions

### How much does it cost?
**API Pricing**:
- Free: 100 queries/day
- Developer: $50/month for 10K queries
- Enterprise: Custom pricing for high volume

**Smart Contract Queries**:
- Only gas costs (no additional fees)
- Approximately $2-5 per query at current gas prices

### What's your business model?
- **API Subscriptions**: Tiered pricing for different usage levels
- **Enterprise Licenses**: Custom models and dedicated infrastructure
- **Protocol Partnerships**: Revenue sharing with integrated dApps
- **Premium Features**: Advanced analytics and custom scoring models

### Do you have partnerships?
We're in discussions with several major DeFi protocols and are actively seeking integration partners. Contact us at partnerships@chainyodha.ai for collaboration opportunities.

## 🔒 Security Questions

### How secure is the oracle system?
- **ECDSA Signatures**: All scores cryptographically signed by our oracle
- **Replay Protection**: Nonces prevent signature reuse
- **Access Controls**: Only authorized oracle can update scores
- **Audit Ready**: Smart contracts designed for security audits

### What if the oracle goes down?
- **Cached Scores**: Recent scores remain available onchain
- **Fallback Mechanisms**: Protocols can implement backup scoring logic
- **Decentralization Roadmap**: Moving toward multi-oracle network

### How do you handle key management?
- **Production**: Hardware security modules (HSMs) and multi-sig
- **Development**: Secure key generation and rotation procedures
- **Backup**: Multiple secure key storage locations
- **Monitoring**: Real-time alerts for suspicious oracle activity

## 🚀 Roadmap Questions

### What's coming next?
**Phase 1 (Q1 2024)**:
- Mainnet deployment on Arbitrum One
- Advanced ML models with transformer architecture
- Real-time score updates via The Graph

**Phase 2 (Q2 2024)**:
- Multi-chain expansion (Ethereum, Polygon, Base)
- Governance token launch and DAO formation
- Institutional partnerships and enterprise features

**Phase 3 (Q3 2024)**:
- Cross-chain trust aggregation
- Privacy-preserving scoring with ZK proofs
- Decentralized oracle network

### Will you support other blockchains?
Yes! Our architecture is designed to be chain-agnostic. We're starting with Arbitrum for gas efficiency but plan to expand to all major EVM chains and eventually non-EVM chains like Solana.

### Can I contribute to the project?
Absolutely! We're open source and welcome contributions:
- **Code**: Submit PRs to our GitHub repository
- **Data**: Help us improve ML models with feedback
- **Testing**: Try our APIs and report bugs
- **Documentation**: Improve guides and examples

## 🛠️ Troubleshooting

### My wallet shows a low score. Why?
Low scores typically result from:
- **New Account**: Recently created wallets lack history
- **Limited Activity**: Few transactions or DeFi interactions
- **No Social Signals**: Missing Farcaster, GitHub, or ENS presence
- **Suspicious Patterns**: Unusual transaction behavior

To improve your score:
- Engage with multiple DeFi protocols
- Build social reputation on Farcaster
- Contribute to open source projects
- Register an ENS domain
- Maintain consistent activity over time

### The API is returning errors. What should I check?
Common issues:
- **Invalid Address**: Ensure wallet address is properly formatted
- **Rate Limiting**: Check if you've exceeded API limits
- **Network Issues**: Verify RPC endpoints are accessible
- **Authentication**: Ensure API keys are valid (for paid tiers)

### Smart contract calls are failing. Help?
Check these common issues:
- **Contract Address**: Verify you're using the correct deployed address
- **Network**: Ensure you're connected to Arbitrum Sepolia
- **Gas Limit**: Set sufficient gas for the transaction
- **ABI**: Use the latest contract ABI from our documentation

## 📞 Support

### How can I get help?
- **Documentation**: https://docs.chainyodha.ai
- **GitHub Issues**: https://github.com/chainyodha-ai/issues
- **Discord**: https://discord.gg/chainyodha
- **Email**: support@chainyodha.ai

### Response times?
- **Community Support**: Best effort via Discord/GitHub
- **Developer Tier**: 48-hour email response
- **Enterprise**: Dedicated support with SLA

### Can I request new features?
Yes! We actively consider user feedback:
- Submit feature requests on GitHub
- Join our Discord for community discussions
- Contact us directly for enterprise feature requests

---

## 🔗 Quick Links

- **Live Demo**: https://chainyodha-ai.vercel.app
- **Documentation**: https://docs.chainyodha.ai
- **GitHub**: https://github.com/chainyodha-ai
- **API Reference**: https://api.chainyodha.ai/docs
- **Discord**: https://discord.gg/chainyodha
- **Twitter**: https://twitter.com/chainyodha_ai

---

*Last updated: January 15, 2024*
*Version: 1.0.0*
