import { Router, Request, Response } from "express"
const { body, validationResult } = require("express-validator")
import { simpleStorage } from "../database/simple-storage"
import { OracleService } from "../services/OracleService"
import { logger } from "../utils/logger"

const router = Router()
const oracleService = new OracleService()

// POST /submit-onchain
router.post("/", [body("wallet").isEthereumAddress().withMessage("Invalid Ethereum address")], async (req: Request, res: Response) => {
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
    const trustScore = await simpleStorage.findTrustScoreByAddress(walletAddress)

    if (!trustScore) {
      return res.status(404).json({
        error: "Trust score not found",
        message: "No trust score found for this wallet. Compute a score first.",
      })
    }

    // For now, we'll skip the blockchain submission since the simple storage doesn't track submission status
    // This is a simplified implementation for the hackathon
    logger.info(`Score submission simulated for ${walletAddress}`)

    res.json({
      success: true,
      transactionHash: "0x" + Math.random().toString(16).substring(2, 66), // Mock transaction hash
      wallet: walletAddress,
      score: trustScore.overallScore,
      explorerUrl: `https://sepolia.arbiscan.io/tx/0x${Math.random().toString(16).substring(2, 66)}`,
      note: "Blockchain submission simulated for hackathon demo"
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
router.get("/status/:address", async (req: Request, res: Response) => {
  try {
    const walletAddress = req.params.address.toLowerCase()

    // Check database status
    const trustScore = await simpleStorage.findTrustScoreByAddress(walletAddress)

    // For hackathon demo, simulate onchain status
    const onchainScore = trustScore ? trustScore.overallScore : null

    res.json({
      wallet: walletAddress,
      database: trustScore
        ? {
            score: trustScore.overallScore,
            submittedOnchain: true, // Simulated for demo
            transactionHash: "0x" + Math.random().toString(16).substring(2, 66),
            lastUpdated: trustScore.updatedAt,
          }
        : null,
      onchain: onchainScore,
      synced: trustScore !== null,
      note: "Status simulated for hackathon demo"
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
