import { Router } from "express"
import { param, validationResult } from "express-validator"
import { AppDataSource } from "../database/data-source"
import { TrustScore } from "../database/entities/TrustScore"
import { WalletProfile } from "../database/entities/WalletProfile"
import { ScoreHistory } from "../database/entities/ScoreHistory"
import { logger } from "../utils/logger"

const router = Router()

// GET /wallet/:address
router.get(
  "/:address",
  [param("address").isEthereumAddress().withMessage("Invalid Ethereum address")],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        })
      }

      const walletAddress = req.params.address.toLowerCase()
      logger.info(`Fetching wallet data for: ${walletAddress}`)

      const trustScoreRepo = AppDataSource.getRepository(TrustScore)
      const walletProfileRepo = AppDataSource.getRepository(WalletProfile)
      const scoreHistoryRepo = AppDataSource.getRepository(ScoreHistory)

      // Get current trust score
      const trustScore = await trustScoreRepo.findOne({
        where: { walletAddress },
        order: { updatedAt: "DESC" },
      })

      // Get wallet profile
      const walletProfile = await walletProfileRepo.findOne({
        where: { walletAddress },
      })

      // Get score history (last 30 entries)
      const scoreHistory = await scoreHistoryRepo.find({
        where: { walletAddress },
        order: { createdAt: "DESC" },
        take: 30,
      })

      if (!trustScore) {
        return res.status(404).json({
          error: "Wallet not found",
          message: "No trust score found for this wallet",
        })
      }

      res.json({
        wallet: walletAddress,
        trustScore: {
          score: trustScore.score,
          timestamp: trustScore.timestamp,
          explanation: trustScore.explanation,
          breakdown: trustScore.breakdown,
          submittedOnchain: trustScore.submittedOnchain,
          transactionHash: trustScore.transactionHash,
          lastUpdated: trustScore.updatedAt,
        },
        profile: walletProfile
          ? {
              totalTransactions: walletProfile.totalTransactions,
              contractInteractions: walletProfile.contractInteractions,
              averageTransactionValue: walletProfile.averageTransactionValue,
              uniqueContractsInteracted: walletProfile.uniqueContractsInteracted,
              swapFrequency: walletProfile.swapFrequency,
              bridgeTransactions: walletProfile.bridgeTransactions,
              topTokens: walletProfile.topTokens,
              portfolioVolatility: walletProfile.portfolioVolatility,
              hasENS: walletProfile.hasENS,
              farcasterFollowers: walletProfile.farcasterFollowers,
              githubContributions: walletProfile.githubContributions,
              accountAge: walletProfile.accountAge,
              lastAnalyzed: walletProfile.lastAnalyzed,
            }
          : null,
        history: scoreHistory.map((entry) => ({
          score: entry.score,
          timestamp: entry.timestamp,
          explanation: entry.explanation,
          createdAt: entry.createdAt,
        })),
      })
    } catch (error) {
      logger.error("Error fetching wallet data:", error)
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to fetch wallet data",
      })
    }
  },
)

// GET /wallet/:address/history
router.get(
  "/:address/history",
  [param("address").isEthereumAddress().withMessage("Invalid Ethereum address")],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        })
      }

      const walletAddress = req.params.address.toLowerCase()
      const limit = Number.parseInt(req.query.limit as string) || 50

      const scoreHistoryRepo = AppDataSource.getRepository(ScoreHistory)
      const history = await scoreHistoryRepo.find({
        where: { walletAddress },
        order: { createdAt: "DESC" },
        take: Math.min(limit, 100),
      })

      res.json({
        wallet: walletAddress,
        history: history.map((entry) => ({
          score: entry.score,
          timestamp: entry.timestamp,
          breakdown: entry.breakdown,
          explanation: entry.explanation,
          createdAt: entry.createdAt,
        })),
      })
    } catch (error) {
      logger.error("Error fetching wallet history:", error)
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to fetch wallet history",
      })
    }
  },
)

export default router
