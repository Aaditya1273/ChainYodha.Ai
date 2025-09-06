import express from "express"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import "reflect-metadata"

import { AppDataSource } from "./database/data-source"
import { logger } from "./utils/logger"
import { errorHandler } from "./middleware/error-handler"
import { rateLimiter } from "./middleware/rate-limiter"

// Import routes
import scoreRoutes from "./routes/score"
import walletRoutes from "./routes/wallet"
import oracleRoutes from "./routes/oracle"
import healthRoutes from "./routes/health"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(rateLimiter)

// Routes
app.use("/health", healthRoutes)
app.use("/compute-score", scoreRoutes)
app.use("/wallet", walletRoutes)
app.use("/submit-onchain", oracleRoutes)

// API documentation endpoint
app.get("/docs", (req, res) => {
  res.json({
    name: "TrustGrid.AI Backend API",
    version: "1.0.0",
    endpoints: {
      "POST /compute-score": "Compute trust score for a wallet",
      "GET /wallet/:address": "Get cached trust score for a wallet",
      "POST /submit-onchain": "Submit signed score to blockchain",
      "GET /health": "Health check endpoint",
    },
    documentation: "https://docs.trustgrid.ai",
  })
})

// Error handling
app.use(errorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" })
})

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await AppDataSource.initialize()
    logger.info("Database connection established")

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 TrustGrid.AI Backend running on port ${PORT}`)
      logger.info(`📖 API Documentation: http://localhost:${PORT}/docs`)
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    logger.error("Failed to start server:", error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully")
  await AppDataSource.destroy()
  process.exit(0)
})

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully")
  await AppDataSource.destroy()
  process.exit(0)
})

startServer()

export default app
