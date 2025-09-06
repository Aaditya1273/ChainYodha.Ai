'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, ShareIcon, ClockIcon } from '@heroicons/react/24/outline'
import { TrustScoreCard } from '@/components/TrustScoreCard'

interface ScoreHistory {
  id: string
  score: number
  timestamp: number
  breakdown: any[]
}

export default function WalletScorePage() {
  const params = useParams()
  const wallet = params.wallet as string
  const [history, setHistory] = useState<ScoreHistory[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (wallet) {
      fetchHistory()
    }
  }, [wallet])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/wallet/${wallet}`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }

  const shareScore = () => {
    const url = `${window.location.origin}/score/${wallet}`
    navigator.clipboard.writeText(url)
    alert('Score URL copied to clipboard!')
  }

  const getRecommendationBadge = (score: number) => {
    if (score >= 80) return { text: 'PROCEED', color: 'bg-green-100 text-green-800' }
    if (score >= 50) return { text: 'CAUTION', color: 'bg-yellow-100 text-yellow-800' }
    return { text: 'BLOCK', color: 'bg-red-100 text-red-800' }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CY</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">ChainYodha.Ai</h1>
              </div>
            </div>
            
            <button
              onClick={shareScore}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ShareIcon className="w-4 h-4" />
              <span>Share Score</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Score Card */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Trust Analysis</h2>
              <p className="text-gray-600">
                Comprehensive trust score and risk assessment for wallet address
              </p>
              <p className="text-sm font-mono text-gray-500 mt-1">{wallet}</p>
            </div>
            
            <TrustScoreCard walletAddress={wallet} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  View on Etherscan
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Export Report
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Set Alerts
                </button>
              </div>
            </div>

            {/* Integration Example */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Example</h3>
              <div className="bg-gray-100 rounded p-3 text-sm font-mono">
                <div className="text-gray-600 mb-2">// Solidity</div>
                <div>bool trusted = trustOracle</div>
                <div className="ml-4">.isTrusted({wallet.slice(0, 10)}...);</div>
              </div>
              <Link 
                href="/integrations"
                className="inline-block mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View full integration guide →
              </Link>
            </div>

            {/* Score History */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-4">
                <ClockIcon className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Score History</h3>
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.slice(0, 5).map((entry, index) => {
                    const badge = getRecommendationBadge(entry.score)
                    return (
                      <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <div className="font-medium text-gray-900">{entry.score}/100</div>
                          <div className="text-xs text-gray-500">
                            {new Date(entry.timestamp * 1000).toLocaleDateString()}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
                          {badge.text}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No historical data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
