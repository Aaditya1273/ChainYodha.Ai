import express from "express"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import "reflect-metadata"

import { simpleStorage } from "../src/database/simple-storage"
import { logger } from "../src/utils/logger"
import { errorHandler } from "../src/middleware/error-handler"
import { rateLimiter } from "../src/middleware/rate-limiter"

// Import routes
import scoreRoutes from "../src/routes/score"
import walletRoutes from "../src/routes/wallet"
import oracleRoutes from "../src/routes/oracle"
import healthRoutes from "../src/routes/health"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://chainyodha-ai.netlify.app', 'https://your-frontend-domain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(rateLimiter)

// Routes
app.use('/api/health', healthRoutes)
app.use('/api/score', scoreRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/oracle', oracleRoutes)

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'ChainYodha.Ai Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      score: '/api/score',
      wallet: '/api/wallet',
      oracle: '/api/oracle'
    }
  })
})

// Error handling
app.use(errorHandler)

// Initialize database
async function initializeDatabase() {
  try {
    await simpleStorage.initialize()
    logger.info("Database initialized successfully")
  } catch (error) {
    logger.error("Failed to initialize database:", error)
  }
}

// For Vercel serverless function
export default async function handler(req: any, res: any) {
  await initializeDatabase()
  return app(req, res)
}

// For local development
if (process.env.NODE_ENV !== 'production') {
  initializeDatabase().then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV}`)
    })
  })
}
