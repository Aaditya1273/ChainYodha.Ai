import { Router } from "express"
import { body, validationResult } from "express-validator"
import { AppDataSource } from "../database/data-source"
import { TrustScore } from "../database/entities/TrustScore"
import { WalletProfile } from "../database/entities/WalletProfile"
import { ScoreHistory } from "../database/entities/ScoreHistory"
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
  async (req, res) => {
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

      // Check if we have a recent score (within 1 hour)
      const trustScoreRepo = AppDataSource.getRepository(TrustScore)
      const existingScore = await trustScoreRepo.findOne({
        where: { walletAddress },
        order: { updatedAt: "DESC" },
      })

      const oneHourAgo = Date.now() - 60 * 60 * 1000
      if (existingScore && existingScore.updatedAt.getTime() > oneHourAgo) {
        logger.info(`Returning cached score for ${walletAddress}`)
        return res.json({
          score: existingScore.score,
          breakdown: existingScore.breakdown,
          explanation: existingScore.explanation,
          metadataHash: existingScore.metadataHash,
          signature: existingScore.signature,
          timestamp: existingScore.timestamp,
          cached: true,
        })
      }

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
      const source = ethers.keccak256(ethers.toUtf8Bytes("trustgrid-ai-v1"))
      const signature = await oracleService.signScore(walletAddress, scoreResult.score, timestamp, source, metadataHash)

      // Save to database
      const walletProfileRepo = AppDataSource.getRepository(WalletProfile)
      const scoreHistoryRepo = AppDataSource.getRepository(ScoreHistory)

      // Update wallet profile
      let walletProfile = await walletProfileRepo.findOne({ where: { walletAddress } })
      if (!walletProfile) {
        walletProfile = new WalletProfile()
        walletProfile.walletAddress = walletAddress
      }

      // Update profile with extracted features
      Object.assign(walletProfile, onchainFeatures, enhancedOffchainFeatures)
      walletProfile.lastAnalyzed = new Date()
      await walletProfileRepo.save(walletProfile)

      // Save or update trust score
      if (existingScore) {
        existingScore.score = scoreResult.score
        existingScore.timestamp = timestamp
        existingScore.source = source
        existingScore.metadataHash = metadataHash
        existingScore.signature = signature
        existingScore.breakdown = scoreResult.breakdown
        existingScore.explanation = scoreResult.explanation
        existingScore.submittedOnchain = false
        await trustScoreRepo.save(existingScore)
      } else {
        const newScore = new TrustScore()
        newScore.walletAddress = walletAddress
        newScore.score = scoreResult.score
        newScore.timestamp = timestamp
        newScore.source = source
        newScore.metadataHash = metadataHash
        newScore.signature = signature
        newScore.breakdown = scoreResult.breakdown
        newScore.explanation = scoreResult.explanation
        newScore.submittedOnchain = false
        await trustScoreRepo.save(newScore)
      }

      // Save to history
      const historyEntry = new ScoreHistory()
      historyEntry.walletAddress = walletAddress
      historyEntry.score = scoreResult.score
      historyEntry.timestamp = timestamp
      historyEntry.source = source
      historyEntry.breakdown = scoreResult.breakdown
      historyEntry.explanation = scoreResult.explanation
      await scoreHistoryRepo.save(historyEntry)

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
