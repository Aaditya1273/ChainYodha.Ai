import { Router, Request, Response } from "express"
const { param, validationResult } = require("express-validator")
import { simpleStorage } from "../database/simple-storage"
import { logger } from "../utils/logger"

const router = Router()

// GET /wallet/:address
router.get(
  "/:address",
  [param("address").isEthereumAddress().withMessage("Invalid Ethereum address")],
  async (req: Request, res: Response) => {
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

      // Get current trust score
      const trustScore = await simpleStorage.findTrustScoreByAddress(walletAddress)

      // Get wallet profile
      const walletProfile = await simpleStorage.findWalletProfileByAddress(walletAddress)

      // Get score history (last 30 entries)
      const scoreHistory = await simpleStorage.findScoreHistoryByAddress(walletAddress)
      const recentHistory = scoreHistory.slice(0, 30)

      if (!trustScore) {
        return res.status(404).json({
          error: "Wallet not found",
          message: "No trust score found for this wallet",
        })
      }

      res.json({
        wallet: walletAddress,
        trustScore: {
          score: trustScore.overallScore,
          timestamp: Math.floor((trustScore.updatedAt?.getTime() || 0) / 1000),
          explanation: "Trust score computed from on-chain analysis",
          breakdown: {
            transactionHistory: trustScore.transactionHistory,
            contractInteraction: trustScore.contractInteraction,
            riskAssessment: trustScore.riskAssessment,
            networkActivity: trustScore.networkActivity,
          },
          submittedOnchain: false,
          transactionHash: null,
          lastUpdated: trustScore.updatedAt,
        },
        profile: walletProfile
          ? {
              totalTransactions: walletProfile.totalTransactions,
              averageTransactionValue: walletProfile.avgTransactionValue,
              uniqueContractsInteracted: walletProfile.uniqueContracts,
              gasEfficiency: walletProfile.gasEfficiency,
              timeSpread: walletProfile.timeSpread,
              riskLevel: walletProfile.riskLevel,
              classification: walletProfile.classification,
              lastAnalyzed: walletProfile.updatedAt,
            }
          : null,
        history: recentHistory.map((entry) => ({
          score: entry.score,
          timestamp: Math.floor((entry.timestamp?.getTime() || 0) / 1000),
          explanation: "Historical trust score",
          createdAt: entry.timestamp,
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
  async (req: Request, res: Response) => {
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

      const history = await simpleStorage.findScoreHistoryByAddress(walletAddress)
      const limitedHistory = history.slice(0, Math.min(limit, 100))

      res.json({
        wallet: walletAddress,
        history: limitedHistory.map((entry) => ({
          score: entry.score,
          timestamp: Math.floor((entry.timestamp?.getTime() || 0) / 1000),
          breakdown: null,
          explanation: "Historical trust score",
          createdAt: entry.timestamp,
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
