import { Router, Request, Response } from "express"
const { body, validationResult } = require("express-validator")
import { simpleStorage } from "../database/simple-storage"
import { FeatureExtractor } from "../services/FeatureExtractor"
import { TrustScorer } from "../services/TrustScorer"
import { OracleService } from "../services/OracleService"
import { logger } from "../utils/logger"
import { ethers } from "ethers"

const router = Router()
const featureExtractor = new FeatureExtractor()
const trustScorer = new TrustScorer()
const oracleService = new OracleService()

// POST /compute-score
router.post(
  "/",
  [
    body("wallet").isEthereumAddress().withMessage("Invalid Ethereum address"),
    body("optionalSignals").optional().isObject().withMessage("Optional signals must be an object"),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate input
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        })
      }

      const { wallet, optionalSignals = {} } = req.body
      const walletAddress = wallet.toLowerCase()

      logger.info(`Computing trust score for wallet: ${walletAddress}`)

      // Skip cache for now to always compute fresh scores with full details
      // const existingScore = await simpleStorage.findTrustScoreByAddress(walletAddress)
      // const oneHourAgo = Date.now() - 60 * 60 * 1000
      // if (existingScore && existingScore.updatedAt && existingScore.updatedAt.getTime() > oneHourAgo) {
      //   logger.info(`Returning cached score for ${walletAddress}`)
      //   return res.json({
      //     score: existingScore.overallScore,
      //     breakdown: existingScore.breakdown || [],
      //     explanation: existingScore.explanation || "Cached trust score result",
      //     confidence: existingScore.confidence || 0,
      //     timestamp: Math.floor((existingScore.updatedAt?.getTime() || 0) / 1000),
      //     cached: true,
      //   })
      // }

      // Extract features
      const onchainFeatures = await featureExtractor.extractOnchainFeatures(walletAddress)
      const offchainFeatures = await featureExtractor.extractOffchainFeatures(walletAddress)

      // Merge with optional signals
      const enhancedOffchainFeatures = {
        ...offchainFeatures,
        ...optionalSignals,
      }

      // Compute trust score
      const scoreResult = await trustScorer.computeTrustScore(onchainFeatures, enhancedOffchainFeatures)

      // Create metadata hash
      const metadataHash = ethers.keccak256(
        ethers.toUtf8Bytes(
          JSON.stringify({
            explanation: scoreResult.explanation,
            breakdown: scoreResult.breakdown,
            confidence: scoreResult.confidence,
          }),
        ),
      )

      // Sign the score
      const timestamp = Math.floor(Date.now() / 1000)
      const source = ethers.keccak256(ethers.toUtf8Bytes("chainyodha-ai-v1"))
      const signature = await oracleService.signScore(walletAddress, scoreResult.score, timestamp, source, metadataHash)

      // Update wallet profile
      let walletProfile = await simpleStorage.findWalletProfileByAddress(walletAddress)
      if (walletProfile) {
        // Update existing profile
        await simpleStorage.updateWalletProfile(walletAddress, {
          totalTransactions: onchainFeatures.totalTransactions || 0,
          avgTransactionValue: onchainFeatures.averageTransactionValue || 0,
          uniqueContracts: onchainFeatures.uniqueContractsInteracted || 0,
          gasEfficiency: 0, // Not available in OnchainFeatures
          timeSpread: 0, // Not available in OnchainFeatures
          riskLevel: 'low', // Default risk level
          classification: 'fresh', // Default classification
        })
      } else {
        // Create new profile
        await simpleStorage.createWalletProfile({
          walletAddress,
          totalTransactions: onchainFeatures.totalTransactions || 0,
          avgTransactionValue: onchainFeatures.averageTransactionValue || 0,
          uniqueContracts: onchainFeatures.uniqueContractsInteracted || 0,
          gasEfficiency: 0, // Not available in OnchainFeatures
          timeSpread: 0, // Not available in OnchainFeatures
          riskLevel: 'low', // Default risk level
          classification: 'fresh', // Default classification
        })
      }

      // Save or update trust score
      // Extract breakdown values from the array
      const getBreakdownValue = (feature: string) => {
        const item = scoreResult.breakdown.find(b => b.feature === feature)
        return item ? item.normalizedValue * 100 : 0
      }

      await simpleStorage.createTrustScore({
        walletAddress,
        overallScore: scoreResult.score,
        transactionHistory: getBreakdownValue('transactionHistory'),
        contractInteraction: getBreakdownValue('contractInteractions'),
        riskAssessment: getBreakdownValue('portfolioStability'),
        networkActivity: getBreakdownValue('accountAge'),
      })

      // Save to history
      await simpleStorage.createScoreHistory({
        walletAddress,
        score: scoreResult.score,
      })

      logger.info(`Trust score computed successfully for ${walletAddress}: ${scoreResult.score}`)

      res.json({
        score: scoreResult.score,
        breakdown: scoreResult.breakdown,
        explanation: scoreResult.explanation,
        confidence: scoreResult.confidence,
        metadataHash,
        signature,
        timestamp,
        cached: false,
      })
    } catch (error) {
      logger.error("Error computing trust score:", error)
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to compute trust score",
      })
    }
  },
)

export default router
