/**
 * Centralized API service for ChainYodha.AI frontend
 * Handles all backend API communications with proper error handling and type safety
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// API Response Types
export interface TrustScoreResponse {
  score: number
  breakdown: Array<{
    feature: string
    weight: number
    value: number
    normalizedValue: number
    impact: number
  }>
  explanation: string
  confidence: number
  aiExplanation?: string
  riskFactors?: string[]
  recommendations?: string[]
  metadataHash: string
  signature: string
  timestamp: number
  cached: boolean
  riskLevel?: string
}

export interface WalletProfileResponse {
  id: string
  walletAddress: string
  totalTransactions: number
  topTokens: Array<{
    address: string
    symbol: string
    balance: string
    percentage: number
  }>
  riskLevel: string
  classification: string
  totalPortfolioValue: number
  riskScore: number
  createdAt: string
  updatedAt: string
}

export interface ScoreHistoryResponse {
  id: number
  walletAddress: string
  score: number
  timestamp: number
  source: string
  breakdown: any[]
  explanation?: string
  createdAt: string
}

export interface OnchainSubmissionResponse {
  success: boolean
  transactionHash: string
  blockNumber?: number
  gasUsed?: string
}

export interface PopularWalletsResponse {
  wallets: Array<{
    address: string
    label: string
    category: string
    trustScore?: number
    lastAnalyzed?: string
  }>
}

// API Error Class
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `API Error: ${response.status}`
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      
      throw new APIError(errorMessage, response.status, errorText)
    }

    const data = await response.json()
    return data as T
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    
    // Network or other errors
    throw new APIError(
      error instanceof Error ? error.message : 'Network error occurred',
      0,
      error
    )
  }
}

// API Service Methods
export const apiService = {
  /**
   * Compute trust score for a wallet address
   */
  async computeTrustScore(
    walletAddress: string,
    optionalSignals: Record<string, any> = {}
  ): Promise<TrustScoreResponse> {
    return apiRequest<TrustScoreResponse>('/api/score', {
      method: 'POST',
      body: JSON.stringify({
        wallet: walletAddress,
        optionalSignals,
      }),
    })
  },

  /**
   * Get trust score from blockchain (cached version)
   */
  async getTrustScore(walletAddress: string): Promise<TrustScoreResponse> {
    return apiRequest<TrustScoreResponse>(`/api/trust-score/${walletAddress}`)
  },

  /**
   * Submit trust score to blockchain
   */
  async submitToChain(
    walletAddress: string,
    score: number,
    timestamp: number
  ): Promise<OnchainSubmissionResponse> {
    return apiRequest<OnchainSubmissionResponse>('/api/oracle/submit-onchain', {
      method: 'POST',
      body: JSON.stringify({
        walletAddress,
        score,
        timestamp,
      }),
    })
  },

  /**
   * Get wallet profile data
   */
  async getWalletProfile(walletAddress: string): Promise<WalletProfileResponse> {
    return apiRequest<WalletProfileResponse>(`/api/wallet/${walletAddress}`)
  },

  /**
   * Get score history for a wallet
   */
  async getScoreHistory(walletAddress: string): Promise<ScoreHistoryResponse[]> {
    return apiRequest<ScoreHistoryResponse[]>(`/api/wallet/${walletAddress}/history`)
  },

  /**
   * Get popular/trending wallets for demo purposes
   */
  async getPopularWallets(): Promise<PopularWalletsResponse> {
    return apiRequest<PopularWalletsResponse>('/api/wallets/popular')
  },

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; timestamp: number }> {
    return apiRequest<{ status: string; timestamp: number }>('/api/health')
  },
}

// Utility functions for API responses
export const apiUtils = {
  /**
   * Format wallet address for display
   */
  formatAddress(address: string): string {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  },

  /**
   * Get score color based on value
   */
  getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  },

  /**
   * Get score background color
   */
  getScoreBg(score: number): string {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 50) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  },

  /**
   * Get recommendation based on score
   */
  getRecommendation(score: number): {
    action: string
    color: string
    bg: string
  } {
    if (score >= 80) return { action: 'PROCEED', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 50) return { action: 'CAUTION', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { action: 'BLOCK', color: 'text-red-600', bg: 'bg-red-100' }
  },

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString()
  },

  /**
   * Format date for display
   */
  formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString()
  },
}

export default apiService
