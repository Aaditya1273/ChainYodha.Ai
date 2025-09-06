import { Router } from "express"
import { AppDataSource } from "../database/data-source"
import { OracleService } from "../services/OracleService"
import { logger } from "../utils/logger"

const router = Router()

// GET /health
router.get("/", async (req, res) => {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: "unknown",
        oracle: "unknown",
        blockchain: "unknown",
      },
    }

    // Check database connection
    try {
      await AppDataSource.query("SELECT 1")
      health.services.database = "healthy"
    } catch (error) {
      health.services.database = "unhealthy"
      health.status = "degraded"
    }

    // Check oracle service
    try {
      const oracleService = new OracleService()
      const balance = await oracleService.getBalance()
      health.services.oracle = "healthy"
      health.services.blockchain = Number.parseFloat(balance) > 0 ? "healthy" : "low_balance"
    } catch (error) {
      health.services.oracle = "unhealthy"
      health.services.blockchain = "unhealthy"
      health.status = "degraded"
    }

    const statusCode = health.status === "healthy" ? 200 : 503
    res.status(statusCode).json(health)
  } catch (error) {
    logger.error("Health check failed:", error)
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
    })
  }
})

// GET /health/detailed
router.get("/detailed", async (req, res) => {
  try {
    const oracleService = new OracleService()

    const detailed = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      oracle: {
        address: oracleService.getOracleAddress(),
        balance: await oracleService.getBalance(),
        contract: process.env.TRUST_ORACLE_CONTRACT,
      },
      database: {
        type: "sqlite",
        path: process.env.DATABASE_URL?.replace("sqlite:", "") || "./data/trustgrid.db",
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT || 3001,
      },
    }

    res.json(detailed)
  } catch (error) {
    logger.error("Detailed health check failed:", error)
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Detailed health check failed",
    })
  }
})

export default router
