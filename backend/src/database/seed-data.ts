import { Buffer } from "buffer"
import { AppDataSource } from "./data-source"
import { WalletProfile } from "./entities/WalletProfile"
import { TrustScore } from "./entities/TrustScore"
import { ScoreHistory } from "./entities/ScoreHistory"

// Node.js global declarations
declare const console: any
declare const process: any
declare const require: any
declare const module: any

export const DEMO_WALLETS = [
  {
    address: "0x1234567890123456789012345678901234567890",
    label: "High Trust Wallet",
    expectedScore: 92,
    profile: {
      totalTransactions: 2847,
      contractInteractions: 15,
      averageTransactionValue: 738.42,
      uniqueContractsInteracted: 28,
      swapFrequency: 156,
      bridgeTransactions: 23,
      topTokens: [
        { address: "0xA0b86a33E6441e6e80D0c4C6C7556C974856B975", symbol: "USDC", balance: "50000.00", percentage: 35.2 },
        { address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", symbol: "WETH", balance: "25.5", percentage: 28.7 },
        { address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", symbol: "USDT", balance: "30000.00", percentage: 21.1 }
      ],
      portfolioVolatility: 0.15,
      hasENS: true,
      farcasterFollowers: 1247,
      githubContributions: 487,
      accountAge: 842,
      lastAnalyzed: new Date()
    },
    score: {
      score: 92,
      breakdown: [
        { feature: "Account Age", weight: 0.15, value: 842, normalizedValue: 0.92, impact: 12.8 },
        { feature: "Transaction Volume", weight: 0.12, value: 2847, normalizedValue: 0.89, impact: 11.2 },
        { feature: "DeFi Diversity", weight: 0.10, value: 15, normalizedValue: 0.95, impact: 9.5 },
        { feature: "Social Reputation", weight: 0.08, value: 1247, normalizedValue: 0.87, impact: 7.8 },
        { feature: "Code Contributions", weight: 0.06, value: 487, normalizedValue: 0.82, impact: 5.9 },
        { feature: "ENS Ownership", weight: 0.05, value: 1, normalizedValue: 1.0, impact: 4.6 },
        { feature: "Portfolio Quality", weight: 0.04, value: 28, normalizedValue: 0.78, impact: 3.2 },
        { feature: "Bridge Usage", weight: 0.03, value: 23, normalizedValue: 0.85, impact: 2.7 }
      ],
      explanation: "This wallet demonstrates exceptional trustworthiness with consistent long-term activity spanning 2+ years. The user shows sophisticated DeFi engagement across 15 protocols, strong social presence with 1.2K Farcaster followers, and active code contributions on GitHub. The ENS ownership and diverse NFT collection further indicate a committed Web3 participant.",
      confidence: 0.94
    }
  },
  {
    address: "0x5678901234567890123456789012345678901234",
    label: "Medium Trust Wallet", 
    expectedScore: 65,
    profile: {
      totalTransactions: 892,
      contractInteractions: 8,
      averageTransactionValue: 50.45,
      uniqueContractsInteracted: 12,
      swapFrequency: 23,
      bridgeTransactions: 5,
      topTokens: [
        { address: "0xA0b86a33E6441e6e80D0c4C6C7556C974856B975", symbol: "USDC", balance: "15000.00", percentage: 55.6 },
        { address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", symbol: "WETH", balance: "8.2", percentage: 30.1 },
        { address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", symbol: "USDT", balance: "3850.00", percentage: 14.3 }
      ],
      portfolioVolatility: 0.28,
      hasENS: false,
      farcasterFollowers: 89,
      githubContributions: 0,
      accountAge: 287,
      lastAnalyzed: new Date()
    },
    score: {
      score: 65,
      breakdown: [
        { feature: "Account Age", weight: 0.15, value: 287, normalizedValue: 0.58, impact: 6.8 },
        { feature: "Transaction Volume", weight: 0.12, value: 892, normalizedValue: 0.45, impact: 5.4 },
        { feature: "DeFi Diversity", weight: 0.10, value: 6, normalizedValue: 0.60, impact: 6.0 },
        { feature: "Social Reputation", weight: 0.08, value: 89, normalizedValue: 0.32, impact: 2.1 },
        { feature: "Code Contributions", weight: 0.06, value: 0, normalizedValue: 0.0, impact: 0.0 },
        { feature: "ENS Ownership", weight: 0.05, value: 0, normalizedValue: 0.0, impact: 0.0 },
        { feature: "Portfolio Quality", weight: 0.04, value: 12, normalizedValue: 0.35, impact: 1.2 },
        { feature: "Bridge Usage", weight: 0.03, value: 5, normalizedValue: 0.25, impact: 0.6 }
      ],
      explanation: "This wallet shows moderate trustworthiness with regular activity over 9+ months. The user has engaged with multiple DeFi protocols and maintains some social presence, but lacks strong reputation signals like ENS ownership or code contributions. The transaction patterns suggest a genuine user but with limited Web3 ecosystem engagement.",
      confidence: 0.78
    }
  },
  {
    address: "0x9abcdef123456789012345678901234567890123",
    label: "Low Trust Wallet",
    expectedScore: 23,
    profile: {
      totalTransactions: 47,
      contractInteractions: 2,
      averageTransactionValue: 26.61,
      uniqueContractsInteracted: 3,
      swapFrequency: 0,
      bridgeTransactions: 0,
      topTokens: [
        { address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", symbol: "WETH", balance: "0.5", percentage: 78.2 },
        { address: "0xA0b86a33E6441e6e80D0c4C6C7556C974856B975", symbol: "USDC", balance: "275.00", percentage: 21.8 }
      ],
      portfolioVolatility: 0.65,
      hasENS: false,
      farcasterFollowers: 0,
      githubContributions: 0,
      accountAge: 12,
      lastAnalyzed: new Date()
    },
    score: {
      score: 23,
      breakdown: [
        { feature: "Account Age", weight: 0.15, value: 12, normalizedValue: 0.05, impact: -8.2 },
        { feature: "Transaction Volume", weight: 0.12, value: 47, normalizedValue: 0.08, impact: -5.8 },
        { feature: "DeFi Diversity", weight: 0.10, value: 1, normalizedValue: 0.10, impact: -7.0 },
        { feature: "Social Reputation", weight: 0.08, value: 0, normalizedValue: 0.0, impact: -6.4 },
        { feature: "Code Contributions", weight: 0.06, value: 0, normalizedValue: 0.0, impact: -4.8 },
        { feature: "ENS Ownership", weight: 0.05, value: 0, normalizedValue: 0.0, impact: -4.0 },
        { feature: "Portfolio Quality", weight: 0.04, value: 3, normalizedValue: 0.12, impact: -3.2 },
        { feature: "Bridge Usage", weight: 0.03, value: 0, normalizedValue: 0.0, impact: -2.4 }
      ],
      explanation: "This wallet shows high risk characteristics with very recent creation (12 days) and minimal activity. The limited transaction history, lack of DeFi engagement, and absence of any social or reputation signals suggest either a new user or potentially suspicious activity. Recommend additional verification before high-value interactions.",
      confidence: 0.89
    }
  }
]

export async function seedDemoData() {
  try {
    console.log("🌱 Seeding demo data...")
    
    const walletProfileRepo = AppDataSource.getRepository(WalletProfile)
    const trustScoreRepo = AppDataSource.getRepository(TrustScore)
    const scoreHistoryRepo = AppDataSource.getRepository(ScoreHistory)
    
    for (const demoWallet of DEMO_WALLETS) {
      console.log(`  Seeding ${demoWallet.label} (${demoWallet.address.slice(0, 10)}...)`)
      
      // Create wallet profile
      const profile = new WalletProfile()
      Object.assign(profile, {
        walletAddress: demoWallet.address,
        ...demoWallet.profile
      })
      await walletProfileRepo.save(profile)
      
      // Create current trust score
      const trustScore = new TrustScore()
      Object.assign(trustScore, {
        walletAddress: demoWallet.address,
        score: demoWallet.score.score,
        timestamp: Math.floor(Date.now() / 1000),
        source: "0x" + Buffer.from("chainyodha-ai-v1").toString('hex').padEnd(64, '0'),
        metadataHash: "0x" + Buffer.from(JSON.stringify({
          explanation: demoWallet.score.explanation,
          breakdown: demoWallet.score.breakdown,
          confidence: demoWallet.score.confidence
        })).toString('hex').slice(0, 64).padEnd(64, '0'),
        signature: "0x" + "0".repeat(130), // Mock signature for demo
        breakdown: demoWallet.score.breakdown,
        explanation: demoWallet.score.explanation,
        submittedOnchain: false
      })
      await trustScoreRepo.save(trustScore)
      
      // Create score history (simulate past scores)
      const historyEntries = generateScoreHistory(demoWallet.address, demoWallet.score.score)
      for (const entry of historyEntries) {
        await scoreHistoryRepo.save(entry)
      }
    }
    
    console.log("✅ Demo data seeded successfully!")
    
  } catch (error) {
    console.error("❌ Error seeding demo data:", error)
    throw error
  }
}

function generateScoreHistory(walletAddress: string, currentScore: number): ScoreHistory[] {
  const history: ScoreHistory[] = []
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  
  // Generate 30 days of history with realistic score evolution
  for (let i = 30; i >= 0; i--) {
    const timestamp = Math.floor((now - (i * dayMs)) / 1000)
    
    // Simulate score evolution (generally improving over time for high trust wallets)
    let score = currentScore
    if (currentScore >= 80) {
      // High trust wallets: gradual improvement
      score = Math.max(40, currentScore - (i * 1.5) + Math.random() * 10 - 5)
    } else if (currentScore >= 50) {
      // Medium trust wallets: some volatility
      score = Math.max(30, currentScore - (i * 0.8) + Math.random() * 15 - 7.5)
    } else {
      // Low trust wallets: consistently low with some noise
      score = Math.max(10, currentScore + Math.random() * 20 - 10)
    }
    
    score = Math.min(100, Math.max(0, Math.round(score)))
    
    const entry = new ScoreHistory()
    entry.walletAddress = walletAddress
    entry.score = score
    entry.timestamp = timestamp
    entry.source = "0x" + Buffer.from("chainyodha-ai-v1").toString('hex').padEnd(64, '0')
    entry.breakdown = generateMockBreakdown(score)
    entry.explanation = generateMockExplanation(score)
    
    history.push(entry)
  }
  
  return history
}

function generateMockBreakdown(score: number) {
  const baseFeatures = [
    "Account Age", "Transaction Volume", "DeFi Diversity", 
    "Social Reputation", "Code Contributions", "ENS Ownership"
  ]
  
  return baseFeatures.map(feature => ({
    feature,
    weight: 0.1 + Math.random() * 0.1,
    value: Math.random() * 1000,
    normalizedValue: Math.random(),
    impact: (score / 100) * (Math.random() * 20 - 10)
  }))
}

function generateMockExplanation(score: number): string {
  if (score >= 80) {
    return "High trust score based on consistent activity and strong reputation signals."
  } else if (score >= 50) {
    return "Moderate trust score with regular activity but limited reputation indicators."
  } else {
    return "Low trust score due to limited activity and lack of reputation signals."
  }
}

// CLI command to seed data
if (typeof require !== 'undefined' && require.main === module) {
  AppDataSource.initialize().then(async () => {
    await seedDemoData()
    await AppDataSource.destroy()
    if (typeof process !== 'undefined') process.exit(0)
  }).catch((error: Error) => {
    if (typeof console !== 'undefined') console.error("Error:", error)
    if (typeof process !== 'undefined') process.exit(1)
  })
}
