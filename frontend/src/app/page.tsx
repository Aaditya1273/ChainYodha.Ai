'use client'

import { useState, useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { RainbowKitConnectButton } from '../components/RainbowKitConnectButton'
import { NetworkSwitcher } from '../components/NetworkSwitcher'
import { apiService, APIError } from '@/lib/api'

interface ScoreBreakdown {
  feature: string
  weight: number
  value: number
  normalizedValue: number
}

interface TrustScoreData {
  score: number
  riskLevel?: string
  confidence: number
  features?: any
  explanation?: string
  breakdown?: ScoreBreakdown[]
}

export default function Home() {
  const { isConnected, address } = useAccount()
  
  const [demoWallet, setDemoWallet] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [trustScore, setTrustScore] = useState<TrustScoreData | null>(null)
  const [error, setError] = useState('')
  const [showConnectPopup, setShowConnectPopup] = useState(false)
  const [popularWallets, setPopularWallets] = useState<any[]>([])
  const [loadingPopular, setLoadingPopular] = useState(false)
  const [mounted, setMounted] = useState(false)
  const walletInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    loadPopularWallets()
  }, [])

  // Handle Start Building button click
  const handleStartBuilding = () => {
    // Scroll to wallet input with smooth animation
    walletInputRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    })
    
    // Focus the input field after a short delay to ensure scroll completes
    setTimeout(() => {
      walletInputRef.current?.focus()
    }, 500)
  }

  // Load popular wallets from API
  const loadPopularWallets = async () => {
    setLoadingPopular(true)
    try {
      const data = await apiService.getPopularWallets()
      setPopularWallets(data.wallets || [])
    } catch (error) {
      console.error('Failed to load popular wallets:', error)
      // Fallback to static data if API fails
      setPopularWallets([
        { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', label: 'Vitalik Buterin', category: 'Ethereum Founder' },
        { address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', label: 'Uniswap Router', category: 'DeFi Protocol' },
        { address: '0x9883B6fC8A4e078278BF96A939BE1CCF4c67B0d4', label: 'Random Wallet', category: 'Demo Wallet' },
      ])
    } finally {
      setLoadingPopular(false)
    }
  }

  // Handle analysis attempt - check wallet connection first
  const handleAnalyzeAttempt = (walletAddress: string) => {
    // Check if wallet is connected
    if (!isConnected) {
      setShowConnectPopup(true)
      // Auto-hide popup after 3 seconds
      setTimeout(() => {
        setShowConnectPopup(false)
      }, 3000)
      return
    }
    
    // Proceed with analysis if wallet is connected
    fetchTrustScore(walletAddress)
  }

  // Fetch trust score using enhanced API service
  const fetchTrustScore = async (walletAddress: string) => {
    // Basic address validation
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setError('Invalid wallet address format')
      return
    }
    
    setIsAnalyzing(true)
    setError('')
    setTrustScore(null)

    try {
      // Try to get cached score first, then compute if needed
      let data
      try {
        data = await apiService.getTrustScore(walletAddress)
      } catch (error: unknown) {
        if (error instanceof APIError && error.status === 404) {
          // No cached score, compute new one
          data = await apiService.computeTrustScore(walletAddress, {})
        } else {
          throw error
        }
      }
      
      setTrustScore(data)
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Trust score fetch error:', error)
      setError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-fetch when wallet address changes - but require wallet connection
  useEffect(() => {
    if (demoWallet && demoWallet.startsWith('0x') && demoWallet.length === 42) {
      handleAnalyzeAttempt(demoWallet)
    }
  }, [demoWallet])

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="floating-orbs">
          <div className="orb"></div>
          <div className="orb"></div>
          <div className="orb"></div>
        </div>
        <div className="particle-bg">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 15}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 glassmorphism border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4 fade-in">
              <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center neon-glow">
                <span className="text-white font-bold text-xl">Y</span>
              </div>
              <h1 className="text-3xl font-bold text-white text-glow">ChainYodha.AI</h1>
            </div>
            
            <div className="flex items-center space-x-4 slide-up">
              {mounted && (
                <div className="flex items-center space-x-4">
                  <RainbowKitConnectButton />
                  {isConnected && address && (
                    <button
                      onClick={() => setDemoWallet(address)}
                      className="btn-primary px-6 py-3 text-sm rounded-xl font-semibold neon-glow"
                    >
                      Analyze My Wallet
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Network Switcher - Show after header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <NetworkSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="scale-in">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-tight text-glow">
              <span className="font-black">Onchain AI-Powered</span>
              <br />
              <span className="gradient-text font-black">Trust Scoring</span>
            </h2>
          </div>
          
          <div className="slide-up" style={{animationDelay: '0.2s'}}>
            <p className="text-2xl text-gray-300 mb-8 max-w-4xl mx-auto font-light">
              Analyze ANY wallet address for trust and risk assessment. 
              <br />
              Connect your wallet for personalized analysis powered by AI.
            </p>
          </div>

          <div className="flex justify-center space-x-12 text-lg text-gray-400 mb-16 fade-in" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center glassmorphism px-6 py-3 rounded-full">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-3 animate-pulse"></div>
              Direct Analysis: Enter any wallet address
            </div>
            <div className="flex items-center glassmorphism px-6 py-3 rounded-full">
              <div className="w-3 h-3 bg-purple-400 rounded-full mr-3 animate-pulse" style={{animationDelay: '0.5s'}}></div>
              Personal Analysis: Connect your wallet
            </div>
          </div>
          
          {/* Demo Controls */}
          <div className="glassmorphism rounded-3xl p-12 mb-16 neon-glow scale-in" style={{animationDelay: '0.6s'}}>
            <h3 className="text-4xl font-bold mb-8 text-white text-glow">Experience the Future</h3>
            
            {/* Futuristic wallet input */}
            <div className="w-full max-w-3xl mx-auto mb-12">
              <div className="relative">
                <input
                  ref={walletInputRef}
                  type="text"
                  value={demoWallet}
                  onChange={(e) => setDemoWallet(e.target.value)}
                  placeholder="Enter Ethereum wallet address (0x...)"
                  className="block w-full px-8 py-6 text-xl bg-black/20 text-white border-2 border-purple-500/30 rounded-2xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-300 backdrop-blur-xl neon-glow placeholder-gray-400"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 pointer-events-none"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {loadingPopular ? (
                // Futuristic Loading skeleton
                [...Array(3)].map((_, index) => (
                  <div key={index} className="glassmorphism p-8 rounded-2xl animate-pulse neon-glow">
                    <div className="h-6 bg-purple-500/30 rounded-xl w-3/4 mb-4"></div>
                    <div className="h-4 bg-purple-400/20 rounded-lg w-1/2 mb-4"></div>
                    <div className="h-8 bg-gradient-to-r from-purple-500/40 to-blue-500/40 rounded-xl w-32"></div>
                  </div>
                ))
              ) : (
                popularWallets.map((wallet: any, index: number) => (
                  <button
                    key={wallet.address || index}
                    onClick={() => setDemoWallet(wallet.address)}
                    className="glassmorphism p-8 rounded-2xl hover:neon-glow transition-all duration-500 text-left group transform hover:scale-105 hover:-translate-y-2"
                  >
                    <div className="font-bold text-white text-xl mb-2">{wallet.label}</div>
                    <div className="text-sm text-purple-300 font-mono mb-4">
                      {`${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">
                        Analyze Now
                      </div>
                      {wallet.trustScore && (
                        <div className={`text-xs px-2 py-1 rounded ${wallet.trustScore >= 80 ? 'bg-emerald-50 border-emerald-200' : wallet.trustScore >= 60 ? 'bg-blue-50 border-blue-200' : wallet.trustScore >= 40 ? 'bg-yellow-50 border-yellow-200' : wallet.trustScore >= 20 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
                          Score: {wallet.trustScore}
                        </div>
                      )}
                    </div>
                    {wallet.category && (
                      <div className="text-sm text-purple-400 mt-2 font-medium">{wallet.category}</div>
                    )}
                  </button>
                ))
              )}
            </div>
            
            {demoWallet && (
              <div className="glassmorphism rounded-3xl p-10 neon-glow scale-in">
                <h4 className="text-3xl font-bold mb-6 text-white text-glow">Trust Score Analysis</h4>
                <p className="text-xl text-purple-300 mb-8 font-mono">Wallet: {demoWallet}</p>
                
                {isAnalyzing && (
                  <div className="glassmorphism text-purple-300 px-8 py-6 rounded-2xl text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <div className="text-xl">Analyzing wallet... Please wait</div>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-8 py-6 rounded-2xl text-center">
                    <div className="text-xl">Error: {error}</div>
                  </div>
                )}
                
                {trustScore && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <div className="inline-block glassmorphism px-12 py-8 rounded-3xl neon-glow">
                        <div className="text-6xl font-black text-white mb-2">{trustScore.score}</div>
                        <div className="text-2xl text-purple-300">/ 100</div>
                        <div className="text-lg text-gray-400 mt-2">Trust Score</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8">
                      <div className="glassmorphism p-6 rounded-2xl text-center">
                        <div className="text-lg text-gray-400 mb-2">Risk Level</div>
                        <div className="text-2xl font-bold text-white">
                          {trustScore.score >= 80 ? 'Low Risk' : 
                           trustScore.score >= 50 ? 'Medium Risk' : 'High Risk'}
                        </div>
                      </div>
                      <div className="glassmorphism p-6 rounded-2xl text-center">
                        <div className="text-lg text-gray-400 mb-2">Confidence</div>
                        <div className="text-2xl font-bold text-white">
                          {trustScore.confidence ? Math.round(trustScore.confidence) : 0}%
                        </div>
                      </div>
                    </div>
                    
                    {trustScore.breakdown && Array.isArray(trustScore.breakdown) && trustScore.breakdown.length > 0 && (
                      <div className="glassmorphism p-6 rounded-2xl">
                        <h5 className="text-xl font-bold text-white mb-4">Score Breakdown:</h5>
                        <div className="space-y-3">
                          {trustScore.breakdown.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-gray-300 font-medium">{item.feature || 'Unknown Feature'}</span>
                              <span className="text-white font-semibold">
                                {typeof item.normalizedValue === 'number' ? item.normalizedValue.toFixed(1) : 'N/A'}/100 
                                (Weight: {typeof item.weight === 'number' ? item.weight.toFixed(1) : 'N/A'}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {trustScore.explanation && (
                      <div className="glassmorphism p-6 rounded-2xl">
                        <h5 className="text-xl font-bold text-white mb-4">AI Explanation:</h5>
                        <p className="text-gray-300 leading-relaxed">{trustScore.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {!isAnalyzing && !error && !trustScore && demoWallet.length === 42 && (
                  <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 px-8 py-6 rounded-2xl text-center">
                    <div className="text-xl">No data available for this wallet</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Wallet Connection Required Popup */}
      {showConnectPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
          
          {/* Popup */}
          <div className="relative glassmorphism rounded-3xl p-12 max-w-md w-full neon-glow scale-in">
            <div className="text-center">
              {/* Icon */}
              <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-6 neon-glow">
                <div className="w-10 h-10 bg-white rounded-lg"></div>
              </div>
              
              {/* Title */}
              <h3 className="text-3xl font-bold text-white mb-4 text-glow">
                Connect Wallet Required
              </h3>
              
              {/* Message */}
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                For secure analysis, please connect your wallet first. This ensures authentic verification of your identity.
              </p>
              
              {/* Connect Button */}
              <div className="mb-6">
                <RainbowKitConnectButton />
              </div>
              
              {/* Close hint */}
              <p className="text-sm text-gray-400">
                This popup will close automatically
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 fade-in">
            <h3 className="text-5xl font-black text-white mb-8 text-glow">
              Comprehensive Trust Analysis
            </h3>
            <p className="text-2xl text-gray-300 max-w-4xl mx-auto font-light">
              Our AI analyzes multiple onchain and offchain signals to provide transparent, 
              explainable trust scores for any Ethereum wallet.
            </p>
          </div>
          
          {/* Premium Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            
            {/* Onchain Analytics */}
            <div className="glassmorphism rounded-3xl p-10 hover:neon-glow transition-all duration-500 card-hover scale-in">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center neon-glow">
                  <div className="w-8 h-8 bg-white rounded-lg"></div>
                </div>
                <h4 className="text-2xl font-bold text-white">Onchain Analytics</h4>
              </div>
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                Comprehensive analysis of transaction history, contract interactions, and wallet behavior patterns.
              </p>
              <div className="space-y-4">
                {[
                  'Transaction Volume',
                  'Contract Diversity', 
                  'Activity Frequency'
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI-Powered Scoring */}
            <div className="glassmorphism rounded-3xl p-10 hover:neon-glow transition-all duration-500 card-hover scale-in" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center neon-glow">
                  <div className="w-8 h-8 bg-white rounded-lg transform rotate-45"></div>
                </div>
                <h4 className="text-2xl font-bold text-white">AI-Powered Scoring</h4>
              </div>
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                Machine learning models trained on blockchain data to identify trust and risk indicators.
              </p>
              <div className="space-y-4">
                {[
                  'XGBoost Model',
                  'Feature Engineering',
                  'Confidence Scoring'
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: `${index * 0.2}s`}}></div>
                    <span className="text-gray-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transparent & Explainable */}
            <div className="glassmorphism rounded-3xl p-10 hover:neon-glow transition-all duration-500 card-hover scale-in" style={{animationDelay: '0.4s'}}>
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center neon-glow">
                  <div className="w-8 h-8 bg-white rounded-full"></div>
                </div>
                <h4 className="text-2xl font-bold text-white">Transparent & Explainable</h4>
              </div>
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                Every score comes with detailed explanations and feature breakdowns for full transparency.
              </p>
              <div className="space-y-4">
                {[
                  'SHAP Values',
                  'Feature Weights',
                  'Decision Logic'
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-300 rounded-full animate-pulse" style={{animationDelay: `${index * 0.3}s`}}></div>
                    <span className="text-gray-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="relative z-10 mt-32">
        {/* Footer Background with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-gray-900/50 to-transparent"></div>
        
        {/* Main Footer Content */}
        <div className="relative glassmorphism border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            
            {/* Top Section - Brand & CTA */}
            <div className="text-center mb-16 fade-in">
              <div className="flex items-center justify-center space-x-4 mb-8">
                <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center neon-glow">
                  <span className="text-white font-black text-2xl">Y</span>
                </div>
                <h3 className="text-4xl font-black text-white text-glow">ChainYodha.AI</h3>
              </div>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto font-light">
                The future of Web3 trust scoring is here. Join thousands of developers building safer DeFi protocols.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleStartBuilding}
                  className="btn-primary px-8 py-4 rounded-xl font-semibold text-lg neon-glow hover:scale-105 transition-transform duration-200"
                >
                  Start Building
                </button>
                <a className="glassmorphism px-8 py-4 rounded-xl font-semibold text-lg text-white hover:neon-glow transition-all duration-300 inline-block text-center" href="https://gamma.app/docs/ChainYodhaAI-0qdp1nuielfd5yu" target="_blank" rel="noopener noreferrer">
                  View Documentation
                </a>
              </div>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
              
              {/* Product Column */}
              <div className="slide-up" style={{animationDelay: '0.1s'}}>
                <h4 className="text-xl font-bold text-white mb-6 gradient-text">Product</h4>
                <ul className="space-y-4">
                  {[
                    { name: 'Trust Scoring API', href: '/api' },
                    { name: 'Live Demo', href: '/demo' },
                    { name: 'Integrations', href: '/integrations' },
                    { name: 'Analytics Dashboard', href: '/dashboard' }
                  ].map((item, index) => (
                    <li key={index}>
                      <Link 
                        href={item.href} 
                        className="text-gray-400 hover:text-purple-400 transition-all duration-300 hover:translate-x-2 inline-block"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Developers Column */}
              <div className="slide-up" style={{animationDelay: '0.2s'}}>
                <h4 className="text-xl font-bold text-white mb-6 gradient-text">Developers</h4>
                <ul className="space-y-4">
                  {[
                    { name: 'API Documentation', href: 'https://docs.chainyodha.ai' },
                    { name: 'GitHub Repository', href: 'https://github.com/chainyodha-ai' },
                    { name: 'SDK & Libraries', href: '/sdk' },
                    { name: 'Code Examples', href: '/examples' }
                  ].map((item, index) => (
                    <li key={index}>
                      <a 
                        href={item.href} 
                        className="text-gray-400 hover:text-purple-400 transition-all duration-300 hover:translate-x-2 inline-block"
                        target={item.href.startsWith('http') ? '_blank' : '_self'}
                        rel={item.href.startsWith('http') ? 'noopener noreferrer' : ''}
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company Column */}
              <div className="slide-up" style={{animationDelay: '0.3s'}}>
                <h4 className="text-xl font-bold text-white mb-6 gradient-text">Company</h4>
                <ul className="space-y-4">
                  {[
                    { name: 'About Us', href: '/about' },
                    { name: 'Security', href: '/security' },
                    { name: 'Privacy Policy', href: '/privacy' },
                    { name: 'Terms of Service', href: '/terms' }
                  ].map((item, index) => (
                    <li key={index}>
                      <Link 
                        href={item.href} 
                        className="text-gray-400 hover:text-purple-400 transition-all duration-300 hover:translate-x-2 inline-block"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Community Column */}
              <div className="slide-up" style={{animationDelay: '0.4s'}}>
                <h4 className="text-xl font-bold text-white mb-6 gradient-text">Community</h4>
                <ul className="space-y-4">
                  {[
                    { name: 'Discord', href: 'https://discord.gg/chainyodha' },
                    { name: 'Twitter', href: 'https://twitter.com/chainyodha_ai' },
                    { name: 'Telegram', href: 'https://t.me/chainyodha' },
                    { name: 'Newsletter', href: '/newsletter' }
                  ].map((item, index) => (
                    <li key={index}>
                      <a 
                        href={item.href} 
                        className="text-gray-400 hover:text-purple-400 transition-all duration-300 hover:translate-x-2 inline-flex items-center space-x-3"
                        target={item.href.startsWith('http') ? '_blank' : '_self'}
                        rel={item.href.startsWith('http') ? 'noopener noreferrer' : ''}
                      >
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span>{item.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Stats Section */}
            <div className="glassmorphism rounded-3xl p-8 mb-16 scale-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl font-black text-white mb-2">10M+</div>
                  <div className="text-gray-400">Wallets Analyzed</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-white mb-2">99.9%</div>
                  <div className="text-gray-400">Uptime</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-white mb-2">500+</div>
                  <div className="text-gray-400">Integrations</div>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-white/10 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="text-gray-400 text-center md:text-left">
                  <p>&copy; 2025 ChainYodha.AI. All rights reserved.</p>
                  <p className="text-sm mt-1">Built on Arbitrum</p>
                </div>
                
                {/* Social Links */}
                <div className="flex space-x-6">
                  {[
                    { name: 'GitHub', href: 'https://github.com/chainyodha-ai' },
                    { name: 'Twitter', href: 'https://twitter.com/chainyodha_ai' },
                    { name: 'Discord', href: 'https://discord.gg/chainyodha' }
                  ].map((social, index) => (
                    <a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 glassmorphism rounded-xl flex items-center justify-center hover:neon-glow transition-all duration-300 hover:scale-110 group"
                    >
                      <div className="w-6 h-6 gradient-bg rounded-lg group-hover:rotate-12 transition-transform duration-300"></div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
