import { logger } from "../utils/logger"
import type { OnchainFeatures, OffchainFeatures } from "./FeatureExtractor"

export interface ScoreBreakdown {
  feature: string
  weight: number
  value: number
  normalizedValue: number
}

export interface TrustScoreResult {
  score: number
  breakdown: ScoreBreakdown[]
  explanation: string
  confidence: number
}

export interface ScoringWeights {
  transactionHistory: number
  contractInteractions: number
  portfolioStability: number
  accountAge: number
  socialSignals: number
  ensPresence: number
  bridgeActivity: number
  defiActivity: number
}

export class TrustScorer {
  private weights: ScoringWeights

  constructor() {
    // Load weights from config or use defaults
    this.weights = {
      transactionHistory: 25,
      contractInteractions: 20,
      portfolioStability: 15,
      accountAge: 15,
      socialSignals: 10,
      ensPresence: 5,
      bridgeActivity: 5,
      defiActivity: 5,
    }
  }

  async computeTrustScore(
    onchainFeatures: OnchainFeatures,
    offchainFeatures: OffchainFeatures,
  ): Promise<TrustScoreResult> {
    try {
      logger.info("Computing trust score with features")

      const breakdown: ScoreBreakdown[] = []

      // 1. Transaction History Score (0-100)
      const txHistoryScore = this.scoreTransactionHistory(onchainFeatures)
      breakdown.push({
        feature: "Transaction History",
        weight: this.weights.transactionHistory,
        value: onchainFeatures.totalTransactions,
        normalizedValue: txHistoryScore,
      })

      // 2. Contract Interactions Score (0-100)
      const contractScore = this.scoreContractInteractions(onchainFeatures)
      breakdown.push({
        feature: "Smart Contract Usage",
        weight: this.weights.contractInteractions,
        value: onchainFeatures.contractInteractions,
        normalizedValue: contractScore,
      })

      // 3. Portfolio Stability Score (0-100)
      const stabilityScore = this.scorePortfolioStability(onchainFeatures)
      breakdown.push({
        feature: "Portfolio Stability",
        weight: this.weights.portfolioStability,
        value: onchainFeatures.portfolioVolatility,
        normalizedValue: stabilityScore,
      })

      // 4. Account Age Score (0-100)
      const ageScore = this.scoreAccountAge(onchainFeatures)
      breakdown.push({
        feature: "Account Age",
        weight: this.weights.accountAge,
        value: onchainFeatures.accountAge,
        normalizedValue: ageScore,
      })

      // 5. Social Signals Score (0-100)
      const socialScore = this.scoreSocialSignals(offchainFeatures)
      breakdown.push({
        feature: "Social Presence",
        weight: this.weights.socialSignals,
        value: offchainFeatures.farcasterFollowers + offchainFeatures.githubContributions,
        normalizedValue: socialScore,
      })

      // 6. ENS Presence Score (0-100)
      const ensScore = onchainFeatures.hasENS ? 100 : 0
      breakdown.push({
        feature: "ENS Domain",
        weight: this.weights.ensPresence,
        value: onchainFeatures.hasENS ? 1 : 0,
        normalizedValue: ensScore,
      })

      // 7. Bridge Activity Score (0-100)
      const bridgeScore = this.scoreBridgeActivity(onchainFeatures)
      breakdown.push({
        feature: "Cross-chain Activity",
        weight: this.weights.bridgeActivity,
        value: onchainFeatures.bridgeTransactions,
        normalizedValue: bridgeScore,
      })

      // 8. DeFi Activity Score (0-100)
      const defiScore = this.scoreDefiActivity(onchainFeatures)
      breakdown.push({
        feature: "DeFi Engagement",
        weight: this.weights.defiActivity,
        value: onchainFeatures.swapFrequency,
        normalizedValue: defiScore,
      })

      // Calculate weighted average
      const totalWeightedScore = breakdown.reduce((sum, item) => sum + (item.normalizedValue * item.weight) / 100, 0)

      const finalScore = Math.round(Math.min(100, Math.max(0, totalWeightedScore)))

      // Generate explanation
      const explanation = this.generateExplanation(finalScore, breakdown)

      // Calculate confidence based on data availability
      const confidence = this.calculateConfidence(onchainFeatures, offchainFeatures)

      return {
        score: finalScore,
        breakdown,
        explanation,
        confidence,
      }
    } catch (error) {
      logger.error("Error computing trust score:", error)
      throw error
    }
  }

  private scoreTransactionHistory(features: OnchainFeatures): number {
    // Score based on transaction count (logarithmic scale)
    const txCount = features.totalTransactions
    if (txCount === 0) return 0
    if (txCount < 10) return 20
    if (txCount < 50) return 40
    if (txCount < 100) return 60
    if (txCount < 500) return 80
    return 100
  }

  private scoreContractInteractions(features: OnchainFeatures): number {
    // Score based on smart contract usage
    const interactions = features.contractInteractions
    const uniqueContracts = features.uniqueContractsInteracted

    if (interactions === 0) return 10

    // Bonus for interacting with multiple unique contracts
    const diversityBonus = Math.min(uniqueContracts * 5, 30)
    const baseScore = Math.min(interactions * 2, 70)

    return Math.min(baseScore + diversityBonus, 100)
  }

  private scorePortfolioStability(features: OnchainFeatures): number {
    // Lower volatility = higher score
    const volatility = features.portfolioVolatility
    if (volatility === 0) return 50 // No activity
    if (volatility < 0.1) return 100
    if (volatility < 0.5) return 80
    if (volatility < 1.0) return 60
    if (volatility < 2.0) return 40
    return 20
  }

  private scoreAccountAge(features: OnchainFeatures): number {
    // Score based on account age in days
    const age = features.accountAge
    if (age < 7) return 10
    if (age < 30) return 30
    if (age < 90) return 50
    if (age < 180) return 70
    if (age < 365) return 85
    return 100
  }

  private scoreSocialSignals(features: OffchainFeatures): number {
    const farcaster = Math.min(features.farcasterFollowers / 10, 50)
    const github = Math.min(features.githubContributions / 5, 50)
    return Math.min(farcaster + github, 100)
  }

  private scoreBridgeActivity(features: OnchainFeatures): number {
    // Score based on cross-chain activity
    const bridges = features.bridgeTransactions
    if (bridges === 0) return 30 // Neutral for no bridge activity
    if (bridges < 3) return 60
    if (bridges < 10) return 80
    return 100
  }

  private scoreDefiActivity(features: OnchainFeatures): number {
    // Score based on DeFi engagement
    const swaps = features.swapFrequency
    if (swaps === 0) return 20
    if (swaps < 5) return 50
    if (swaps < 20) return 75
    return 100
  }

  private generateExplanation(score: number, breakdown: ScoreBreakdown[]): string {
    const topFactors = breakdown.sort((a, b) => b.normalizedValue * b.weight - a.normalizedValue * a.weight).slice(0, 3)

    let explanation = `Trust Score: ${score}/100. `

    if (score >= 80) {
      explanation += "This wallet demonstrates excellent trustworthiness with "
    } else if (score >= 60) {
      explanation += "This wallet shows good trust indicators with "
    } else if (score >= 40) {
      explanation += "This wallet has moderate trust signals with "
    } else {
      explanation += "This wallet shows limited trust indicators with "
    }

    const factors = topFactors.map((factor) => {
      if (factor.normalizedValue >= 80) return `strong ${factor.feature.toLowerCase()}`
      if (factor.normalizedValue >= 60) return `good ${factor.feature.toLowerCase()}`
      if (factor.normalizedValue >= 40) return `moderate ${factor.feature.toLowerCase()}`
      return `limited ${factor.feature.toLowerCase()}`
    })

    explanation += factors.join(", ") + "."

    return explanation
  }

  private calculateConfidence(onchain: OnchainFeatures, offchain: OffchainFeatures): number {
    let confidence = 0

    // Base confidence from onchain data availability
    if (onchain.totalTransactions > 0) confidence += 30
    if (onchain.contractInteractions > 0) confidence += 20
    if (onchain.accountAge > 7) confidence += 20

    // Bonus for additional signals
    if (onchain.hasENS) confidence += 10
    if (offchain.farcasterFollowers > 0) confidence += 10
    if (offchain.githubContributions > 0) confidence += 10

    return Math.min(confidence, 100)
  }

  updateWeights(newWeights: Partial<ScoringWeights>): void {
    this.weights = { ...this.weights, ...newWeights }
    logger.info("Updated scoring weights:", this.weights)
  }

  getWeights(): ScoringWeights {
    return { ...this.weights }
  }
}
