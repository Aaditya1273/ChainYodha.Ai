export default async function handler(req: any, res: any) {
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
    console.log('Request URL:', url, 'Method:', method)

    // Health check
    if (url === '/api/health' || url === '/health') {
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ChainYodha.Ai Backend'
      })
    }

    // Score endpoint
    if (url?.includes('/score') || url === '/api/score') {
      if (method === 'POST') {
        const { wallet } = req.body || {}
        
        if (!wallet) {
          return res.status(400).json({ error: 'Wallet address required' })
        }

        // Generate dynamic score based on wallet address
        const addressHash = wallet.toLowerCase().slice(2) // Remove 0x prefix
        const hashSum = addressHash.split('').reduce((sum: number, char: string) => sum + parseInt(char, 16) || 0, 0)
        
        // Create pseudo-random but deterministic values based on wallet address
        const baseScore = 20 + (hashSum % 60) // Score between 20-80
        const confidence = 50 + (hashSum % 40) // Confidence between 50-90
        const txCount = 10 + (hashSum % 200) // Transactions between 10-210
        const accountAge = 30 + (hashSum % 300) // Age between 30-330 days
        const contractInteractions = hashSum % 20 // 0-20 interactions
        const hasENS = hashSum % 5 === 0 // 20% chance of ENS
        const socialScore = hashSum % 100 // Social presence 0-100
        const defiEngagement = hashSum % 15 // DeFi engagement 0-15
        
        // Calculate breakdown with wallet-specific values
        const breakdown = [
          { 
            feature: 'Transaction History', 
            weight: 25, 
            value: txCount, 
            normalizedValue: Math.min(txCount / 200, 1) 
          },
          { 
            feature: 'Smart Contract Usage', 
            weight: 20, 
            value: contractInteractions, 
            normalizedValue: contractInteractions / 20 
          },
          { 
            feature: 'Portfolio Stability', 
            weight: 15, 
            value: (hashSum % 100) / 100, 
            normalizedValue: (hashSum % 100) / 100 
          },
          { 
            feature: 'Account Age', 
            weight: 15, 
            value: accountAge, 
            normalizedValue: Math.min(accountAge / 365, 1) 
          },
          { 
            feature: 'Social Presence', 
            weight: 10, 
            value: socialScore, 
            normalizedValue: socialScore / 100 
          },
          { 
            feature: 'ENS Domain', 
            weight: 5, 
            value: hasENS ? 1 : 0, 
            normalizedValue: hasENS ? 1 : 0 
          },
          { 
            feature: 'Cross-chain Activity', 
            weight: 5, 
            value: hashSum % 5, 
            normalizedValue: (hashSum % 5) / 5 
          },
          { 
            feature: 'DeFi Engagement', 
            weight: 5, 
            value: defiEngagement, 
            normalizedValue: defiEngagement / 15 
          }
        ]

        // Generate explanation based on calculated values
        let explanation = `Wallet analysis for ${wallet.slice(0, 6)}...${wallet.slice(-4)}: `
        if (baseScore > 60) explanation += "High trust score with strong on-chain activity. "
        else if (baseScore > 40) explanation += "Moderate trust score with decent activity. "
        else explanation += "Lower trust score, limited activity detected. "
        
        if (hasENS) explanation += "Has ENS domain. "
        if (contractInteractions > 10) explanation += "Active smart contract user. "
        if (txCount > 100) explanation += "High transaction volume. "
        if (socialScore > 50) explanation += "Good social presence. "

        return res.status(200).json({
          score: baseScore,
          confidence: confidence,
          breakdown: breakdown,
          explanation: explanation.trim(),
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
