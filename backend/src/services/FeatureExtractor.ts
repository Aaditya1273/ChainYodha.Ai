import { ethers } from "ethers"
import { logger } from "../utils/logger"

export interface OnchainFeatures {
  totalTransactions: number
  contractInteractions: number
  averageTransactionValue: number
  uniqueContractsInteracted: number
  swapFrequency: number
  bridgeTransactions: number
  topTokens: Array<{
    address: string
    symbol: string
    balance: string
    percentage: number
  }>
  portfolioVolatility: number
  accountAge: number
  hasENS: boolean
}

export interface OffchainFeatures {
  farcasterFollowers: number
  githubContributions: number
  ensName?: string
}

export class FeatureExtractor {
  private provider: ethers.JsonRpcProvider

  constructor() {
    const rpcUrl = process.env.ARB_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc"
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
  }

  async extractOnchainFeatures(walletAddress: string): Promise<OnchainFeatures> {
    try {
      logger.info(`Extracting onchain features for ${walletAddress}`)

      // Get basic account info
      const balance = await this.provider.getBalance(walletAddress)
      const transactionCount = await this.provider.getTransactionCount(walletAddress)

      // Get transaction history (last 100 transactions)
      const transactions = await this.getTransactionHistory(walletAddress, 100)

      // Analyze transactions
      const contractInteractions = transactions.filter((tx) => tx.to && tx.data !== "0x").length
      const uniqueContracts = new Set(
        transactions.filter((tx) => tx.to && tx.data !== "0x").map((tx) => tx.to?.toLowerCase()),
      ).size

      // Calculate average transaction value
      const totalValue = transactions.reduce(
        (sum, tx) => sum + Number.parseFloat(ethers.formatEther(tx.value || "0")),
        0,
      )
      const averageTransactionValue = transactions.length > 0 ? totalValue / transactions.length : 0

      // Estimate swap frequency (transactions with DEX-like patterns)
      const swapFrequency = this.estimateSwapFrequency(transactions)

      // Estimate bridge transactions
      const bridgeTransactions = this.estimateBridgeTransactions(transactions)

      // Get token balances (mock implementation for demo)
      const topTokens = await this.getTopTokenBalances(walletAddress)

      // Calculate portfolio volatility (simplified)
      const portfolioVolatility = this.calculatePortfolioVolatility(transactions)

      // Calculate account age
      const accountAge = await this.calculateAccountAge(walletAddress)

      // Check ENS
      const hasENS = await this.checkENS(walletAddress)

      return {
        totalTransactions: transactionCount,
        contractInteractions,
        averageTransactionValue,
        uniqueContractsInteracted: uniqueContracts,
        swapFrequency,
        bridgeTransactions,
        topTokens,
        portfolioVolatility,
        accountAge,
        hasENS,
      }
    } catch (error) {
      logger.error(`Error extracting onchain features for ${walletAddress}:`, error)
      throw error
    }
  }

  async extractOffchainFeatures(walletAddress: string): Promise<OffchainFeatures> {
    try {
      logger.info(`Extracting offchain features for ${walletAddress}`)

      // Mock implementations for demo (replace with real API calls)
      const farcasterFollowers = await this.getFarcasterFollowers(walletAddress)
      const githubContributions = await this.getGithubContributions(walletAddress)
      const ensName = await this.getENSName(walletAddress)

      return {
        farcasterFollowers,
        githubContributions,
        ensName,
      }
    } catch (error) {
      logger.error(`Error extracting offchain features for ${walletAddress}:`, error)
      // Return default values on error
      return {
        farcasterFollowers: 0,
        githubContributions: 0,
      }
    }
  }

  private async getTransactionHistory(walletAddress: string, limit: number): Promise<any[]> {
    try {
      // In a real implementation, you would use a service like Alchemy or Moralis
      // For demo purposes, we'll return mock data
      const mockTransactions = []
      const currentBlock = await this.provider.getBlockNumber()

      for (let i = 0; i < Math.min(limit, 50); i++) {
        mockTransactions.push({
          hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          from: walletAddress,
          to: `0x${Math.random().toString(16).substr(2, 40)}`,
          value: ethers.parseEther((Math.random() * 10).toFixed(4)),
          data: Math.random() > 0.7 ? `0x${Math.random().toString(16).substr(2, 8)}` : "0x",
          blockNumber: currentBlock - i,
        })
      }

      return mockTransactions
    } catch (error) {
      logger.error("Error fetching transaction history:", error)
      return []
    }
  }

  private estimateSwapFrequency(transactions: any[]): number {
    // Simple heuristic: transactions with data that might be swaps
    return transactions.filter(
      (tx) => tx.data && tx.data.length > 10 && (tx.data.includes("a9059cbb") || tx.data.includes("095ea7b3")), // transfer/approve signatures
    ).length
  }

  private estimateBridgeTransactions(transactions: any[]): number {
    // Simple heuristic: transactions to known bridge contracts (mock)
    const bridgeAddresses = [
      "0x8315177ab297ba92a06054ce80a67ed4dbd7ed3a", // Arbitrum Bridge
      "0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f", // Other bridge
    ]

    return transactions.filter((tx) => tx.to && bridgeAddresses.includes(tx.to.toLowerCase())).length
  }

  private async getTopTokenBalances(walletAddress: string): Promise<any[]> {
    // Mock implementation - in reality, use token balance APIs
    return [
      { address: "0xa0b86a33e6441e6c7d3e4081f7567f8b", symbol: "USDC", balance: "1000.0", percentage: 60 },
      { address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", symbol: "WETH", balance: "0.5", percentage: 30 },
      { address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", symbol: "USDT", balance: "200.0", percentage: 10 },
    ]
  }

  private calculatePortfolioVolatility(transactions: any[]): number {
    if (transactions.length < 2) return 0

    const values = transactions.map((tx) => Number.parseFloat(ethers.formatEther(tx.value || "0")))
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length

    return Math.sqrt(variance)
  }

  private async calculateAccountAge(walletAddress: string): Promise<number> {
    try {
      // In reality, find the first transaction block and calculate age
      // For demo, return a random age between 30-365 days
      return Math.floor(Math.random() * 335) + 30
    } catch (error) {
      return 0
    }
  }

  private async checkENS(walletAddress: string): Promise<boolean> {
    try {
      const ensName = await this.provider.lookupAddress(walletAddress)
      return !!ensName
    } catch (error) {
      return false
    }
  }

  private async getENSName(walletAddress: string): Promise<string | undefined> {
    try {
      return (await this.provider.lookupAddress(walletAddress)) || undefined
    } catch (error) {
      return undefined
    }
  }

  private async getFarcasterFollowers(walletAddress: string): Promise<number> {
    // Mock implementation - replace with real Farcaster API
    if (process.env.FARCASTER_API_KEY) {
      // Real API call would go here
      return Math.floor(Math.random() * 1000)
    }
    return Math.floor(Math.random() * 100)
  }

  private async getGithubContributions(walletAddress: string): Promise<number> {
    // Mock implementation - replace with real GitHub API
    if (process.env.GITHUB_TOKEN) {
      // Real API call would go here
      return Math.floor(Math.random() * 500)
    }
    return Math.floor(Math.random() * 50)
  }
}
