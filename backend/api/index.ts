import { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const { url, method } = req

    // Health check
    if (url === '/api/health' || url === '/health') {
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ChainYodha.Ai Backend'
      })
    }

    // Score endpoint
    if (url === '/api/score' || url === '/score') {
      if (method === 'POST') {
        const { wallet } = req.body || {}
        
        if (!wallet) {
          return res.status(400).json({ error: 'Wallet address required' })
        }

        // Mock response for now
        return res.status(200).json({
          score: 44,
          confidence: 70,
          breakdown: [
            { feature: 'Transaction History', weight: 25, value: 150, normalizedValue: 0.75 },
            { feature: 'Smart Contract Usage', weight: 20, value: 5, normalizedValue: 0.5 },
            { feature: 'Portfolio Stability', weight: 15, value: 0.8, normalizedValue: 0.8 },
            { feature: 'Account Age', weight: 15, value: 180, normalizedValue: 0.6 },
            { feature: 'Social Presence', weight: 10, value: 0, normalizedValue: 0 },
            { feature: 'ENS Domain', weight: 5, value: 0, normalizedValue: 0 },
            { feature: 'Cross-chain Activity', weight: 5, value: 2, normalizedValue: 0.4 },
            { feature: 'DeFi Engagement', weight: 5, value: 10, normalizedValue: 0.7 }
          ],
          explanation: 'This wallet shows moderate activity with regular transactions and some DeFi engagement. Limited social presence and no ENS domain.',
          timestamp: Math.floor(Date.now() / 1000),
          cached: false
        })
      }
    }

    // Root endpoint
    if (url === '/' || url === '/api') {
      return res.status(200).json({
        message: 'ChainYodha.Ai Backend API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: '/api/health',
          score: '/api/score'
        }
      })
    }

    // 404 for other routes
    return res.status(404).json({ error: 'Endpoint not found' })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
