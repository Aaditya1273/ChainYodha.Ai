'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import Link from 'next/link'
import { TrustScoreCard } from '@/components/TrustScoreCard'
import { WalletInput } from '@/components/WalletInput'
import { FeatureGrid } from '@/components/FeatureGrid'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  })
  const { disconnect } = useDisconnect()
  const [demoWallet, setDemoWallet] = useState('')

  const demoWallets = [
    { address: '0x1234567890123456789012345678901234567890', score: 92, label: 'High Trust' },
    { address: '0x5678901234567890123456789012345678901234', score: 65, label: 'Medium Trust' },
    { address: '0x9abcdef123456789012345678901234567890123', score: 23, label: 'Low Trust' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">CY</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ChainYodha.Ai</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                  <button
                    onClick={() => disconnect()}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => connect()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Onchain AI-Powered
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {' '}Trust Scoring
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transparent wallet and project trust scores derived from onchain activity and optional offchain signals. 
            Built for Web3 on Arbitrum with explainable AI.
          </p>
          
          {/* Demo Controls */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h3 className="text-2xl font-semibold mb-6">Try Live Demo</h3>
            
            <WalletInput 
              value={demoWallet}
              onChange={setDemoWallet}
              placeholder="Enter wallet address or select demo wallet"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {demoWallets.map((wallet, index) => (
                <button
                  key={index}
                  onClick={() => setDemoWallet(wallet.address)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">{wallet.label}</div>
                  <div className="text-sm text-gray-500 font-mono">
                    {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                  </div>
                  <div className={`inline-block px-2 py-1 rounded text-sm font-medium mt-2 ${
                    wallet.score >= 80 ? 'trust-score-high' :
                    wallet.score >= 50 ? 'trust-score-medium' : 'trust-score-low'
                  }`}>
                    Score: {wallet.score}
                  </div>
                </button>
              ))}
            </div>
            
            {demoWallet && (
              <div className="mt-8">
                <TrustScoreCard walletAddress={demoWallet} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Comprehensive Trust Analysis
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI analyzes multiple onchain and offchain signals to provide transparent, 
              explainable trust scores for any Ethereum wallet.
            </p>
          </div>
          
          <FeatureGrid />
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Easy Integration for dApps
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Integrate ChainYodha.Ai trust scores into your dApp with simple smart contract calls.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="text-xl font-semibold mb-4">Smart Contract Integration</h4>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`// Check if wallet is trusted
bool trusted = trustOracle.isTrusted(walletAddress);

// Get full trust score
TrustScore memory score = trustOracle.getTrustScore(walletAddress);

// Use in your DeFi logic
if (score.score >= 70) {
    // Proceed with transaction
    executeSwap(amount);
} else {
    // Require additional verification
    requireKYC(walletAddress);
}`}
              </pre>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="text-xl font-semibold mb-4">API Integration</h4>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`// Compute trust score
const response = await fetch('/compute-score', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet: '0x...',
    optionalSignals: {
      farcasterFollowers: 1500,
      githubContributions: 250
    }
  })
});

const { score, breakdown, explanation } = await response.json();`}
              </pre>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Link 
              href="/integrations"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Integration Guide
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">CY</span>
                </div>
                <span className="text-xl font-bold">ChainYodha.Ai</span>
              </div>
              <p className="text-gray-400">
                AI-powered trust and risk scoring infrastructure for Web3.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/score/demo" className="hover:text-white transition-colors">Demo</Link></li>
                <li><Link href="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://docs.chainyodha.ai" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="https://github.com/chainyodha-ai" className="hover:text-white transition-colors">GitHub</a></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:hello@chainyodha.ai" className="hover:text-white transition-colors">hello@chainyodha.ai</a></li>
                <li><a href="https://twitter.com/chainyodha_ai" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="https://discord.gg/chainyodha" className="hover:text-white transition-colors">Discord</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ChainYodha.Ai. All rights reserved. Built on Arbitrum.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
