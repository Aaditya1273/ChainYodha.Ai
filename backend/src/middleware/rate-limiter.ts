import type { Request, Response, NextFunction } from "express"

// Simple in-memory rate limiter
const requests = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = 100 // requests per window
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || "unknown"
  const now = Date.now()

  const userRequests = requests.get(key)

  if (!userRequests || now > userRequests.resetTime) {
    // Reset or initialize
    requests.set(key, {
      count: 1,
      resetTime: now + WINDOW_MS,
    })
    return next()
  }

  if (userRequests.count >= RATE_LIMIT) {
    return res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Try again later.",
      retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
    })
  }

  userRequests.count++
  next()
}
