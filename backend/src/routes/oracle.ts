import { Router } from "express"
import { body, validationResult } from "express-validator"
import { AppDataSource } from "../database/data-source"
import { TrustScore } from "../database/entities/TrustScore"
import { OracleService } from "../services/OracleService"
import { logger } from "../utils/logger"

const router = Router()
const oracleService = new OracleService()

// POST /submit-onchain
router.post("/", [body("wallet").isEthereumAddress().withMessage("Invalid Ethereum address")], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      })
    }

    const { wallet } = req.body
    const walletAddress = wallet.toLowerCase()

    logger.info(`Submitting score onchain for wallet: ${walletAddress}`)

    // Get the latest trust score from database
    const trustScoreRepo = AppDataSource.getRepository(TrustScore)
    const trustScore = await trustScoreRepo.findOne({
      where: { walletAddress },
      order: { updatedAt: "DESC" },
    })

    if (!trustScore) {
      return res.status(404).json({
        error: "Trust score not found",
        message: "No trust score found for this wallet. Compute a score first.",
      })
    }

    if (trustScore.submittedOnchain) {
      return res.status(400).json({
        error: "Already submitted",
        message: "This score has already been submitted onchain",
        transactionHash: trustScore.transactionHash,
      })
    }

    // Submit to blockchain
    const transactionHash = await oracleService.submitScoreOnchain(
      walletAddress,
      trustScore.score,
      trustScore.timestamp,
      trustScore.source,
      trustScore.metadataHash,
      trustScore.signature,
    )

    // Update database
    trustScore.submittedOnchain = true
    trustScore.transactionHash = transactionHash
    await trustScoreRepo.save(trustScore)

    logger.info(`Score submitted onchain successfully for ${walletAddress}. TX: ${transactionHash}`)

    res.json({
      success: true,
      transactionHash,
      wallet: walletAddress,
      score: trustScore.score,
      explorerUrl: `https://sepolia.arbiscan.io/tx/${transactionHash}`,
    })
  } catch (error) {
    logger.error("Error submitting score onchain:", error)
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to submit score onchain",
    })
  }
})

// GET /submit-onchain/status/:address
router.get("/status/:address", async (req, res) => {
  try {
    const walletAddress = req.params.address.toLowerCase()

    // Check database status
    const trustScoreRepo = AppDataSource.getRepository(TrustScore)
    const trustScore = await trustScoreRepo.findOne({
      where: { walletAddress },
      order: { updatedAt: "DESC" },
    })

    // Check onchain status
    const onchainScore = await oracleService.getOnchainScore(walletAddress)

    res.json({
      wallet: walletAddress,
      database: trustScore
        ? {
            score: trustScore.score,
            submittedOnchain: trustScore.submittedOnchain,
            transactionHash: trustScore.transactionHash,
            lastUpdated: trustScore.updatedAt,
          }
        : null,
      onchain: onchainScore,
      synced: trustScore?.submittedOnchain && onchainScore !== null,
    })
  } catch (error) {
    logger.error("Error checking submission status:", error)
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to check submission status",
    })
  }
})

export default router
