'use client'

import { useState, useEffect } from 'react'
import { ChartBarIcon, ShieldCheckIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface TrustScore {
  score: number
  breakdown: Array<{
    feature: string
    weight: number
    value: number
    impact: number
  }>
  explanation: string
  confidence: number
  timestamp: number
  cached: boolean
}

interface TrustScoreCardProps {
  walletAddress: string
}

export function TrustScoreCard({ walletAddress }: TrustScoreCardProps) {
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (walletAddress) {
      fetchTrustScore()
    }
  }, [walletAddress])

  const fetchTrustScore = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/compute-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: walletAddress,
          optionalSignals: {}
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch trust score')
      }

      const data = await response.json()
      setTrustScore(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const submitToChain = async () => {
    if (!trustScore) return
    
    setSubmitting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/submit-onchain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          score: trustScore.score,
          timestamp: trustScore.timestamp
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit to chain')
      }

      alert('Trust score successfully submitted to blockchain!')
    } catch (err) {
      alert(`Error submitting to chain: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 50) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <ShieldCheckIcon className="w-8 h-8 text-green-600" />
    if (score >= 50) return <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
    return <XCircleIcon className="w-8 h-8 text-red-600" />
  }

  const getRecommendation = (score: number) => {
    if (score >= 80) return { action: 'PROCEED', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 50) return { action: 'CAUTION', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { action: 'BLOCK', color: 'text-red-600', bg: 'bg-red-100' }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
            <div className="h-6 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="h-20 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-red-600 mb-2">
          <XCircleIcon className="w-5 h-5" />
          <span className="font-medium">Error</span>
        </div>
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchTrustScore}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!trustScore) {
    return null
  }

  const recommendation = getRecommendation(trustScore.score)

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className={`p-6 ${getScoreBg(trustScore.score)} border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getScoreIcon(trustScore.score)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Trust Score</h3>
              <p className="text-sm text-gray-600 font-mono">
                {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(trustScore.score)}`}>
              {trustScore.score}
            </div>
            <div className="text-sm text-gray-500">/ 100</div>
          </div>
        </div>
      </div>

      {/* Score Details */}
      <div className="p-6">
        {/* Recommendation Badge */}
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${recommendation.bg} ${recommendation.color}`}>
          {recommendation.action}
        </div>

        {/* Confidence & Timestamp */}
        <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
          <span>Confidence: {Math.round(trustScore.confidence * 100)}%</span>
          <span>
            {trustScore.cached ? 'Cached' : 'Fresh'} • {new Date(trustScore.timestamp * 1000).toLocaleString()}
          </span>
        </div>

        {/* Explanation */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Explanation</h4>
          <p className="text-gray-700 text-sm leading-relaxed">{trustScore.explanation}</p>
        </div>

        {/* Feature Breakdown */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <ChartBarIcon className="w-5 h-5 text-gray-600" />
            <h4 className="font-medium text-gray-900">Feature Breakdown</h4>
          </div>
          
          <div className="space-y-3">
            {trustScore.breakdown.map((feature, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{feature.feature}</span>
                    <span className="text-sm text-gray-500">
                      {feature.impact > 0 ? '+' : ''}{feature.impact.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        feature.impact > 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.abs(feature.impact) * 10}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={fetchTrustScore}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Refresh Score
          </button>
          <button
            onClick={submitToChain}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit to Chain'}
          </button>
        </div>
      </div>
    </div>
  )
}
