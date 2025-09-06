'use client'

import Link from 'next/link'
import { ArrowLeftIcon, CodeBracketIcon, DocumentTextIcon, CubeIcon } from '@heroicons/react/24/outline'

export default function IntegrationsPage() {
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
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Integration Guide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Integrate ChainYodha.Ai trust scores into your dApp with simple smart contract calls or API endpoints.
          </p>
        </div>

        {/* Integration Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-blue-200">
            <div className="flex items-center space-x-3 mb-4">
              <CubeIcon className="w-8 h-8 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Smart Contract</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Direct onchain integration with our TrustOracle contract on Arbitrum Sepolia.
            </p>
            <div className="bg-blue-50 p-3 rounded text-sm">
              <strong>Best for:</strong> DeFi protocols, onchain verification, gas-efficient queries
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-green-200">
            <div className="flex items-center space-x-3 mb-4">
              <CodeBracketIcon className="w-8 h-8 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900">REST API</h3>
            </div>
            <p className="text-gray-600 mb-4">
              HTTP API for real-time score computation with detailed explanations.
            </p>
            <div className="bg-green-50 p-3 rounded text-sm">
              <strong>Best for:</strong> Web apps, mobile apps, detailed analytics, custom UIs
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-purple-200">
            <div className="flex items-center space-x-3 mb-4">
              <DocumentTextIcon className="w-8 h-8 text-purple-600" />
              <h3 className="text-xl font-semibold text-gray-900">SDK & Libraries</h3>
            </div>
            <p className="text-gray-600 mb-4">
              TypeScript/JavaScript libraries for easy integration in any framework.
            </p>
            <div className="bg-purple-50 p-3 rounded text-sm">
              <strong>Best for:</strong> React apps, Node.js backends, rapid prototyping
            </div>
          </div>
        </div>

        {/* Smart Contract Integration */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Smart Contract Integration</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Usage</h4>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ITrustOracle.sol";

contract MyDeFiProtocol {
    ITrustOracle public trustOracle;
    uint16 public constant MIN_TRUST_SCORE = 70;
    
    constructor(address _trustOracle) {
        trustOracle = ITrustOracle(_trustOracle);
    }
    
    function executeSwap(
        address user,
        uint256 amount
    ) external {
        // Check trust score before execution
        require(
            trustOracle.isTrusted(user),
            "User trust score too low"
        );
        
        // Execute swap logic
        _performSwap(user, amount);
    }
    
    function getDetailedTrustInfo(address user) 
        external view returns (
            uint16 score,
            uint32 timestamp,
            bytes32 source
        ) 
    {
        TrustScore memory trustData = 
            trustOracle.getTrustScore(user);
        
        return (
            trustData.score,
            trustData.timestamp,
            trustData.source
        );
    }
}`}
              </pre>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Advanced Risk Management</h4>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`contract RiskManagedLending {
    ITrustOracle public trustOracle;
    
    mapping(uint16 => uint256) public riskTiers;
    
    constructor(address _trustOracle) {
        trustOracle = ITrustOracle(_trustOracle);
        
        // Set risk-based interest rates
        riskTiers[90] = 300; // 3% for high trust
        riskTiers[70] = 500; // 5% for medium trust
        riskTiers[50] = 800; // 8% for low trust
    }
    
    function calculateInterestRate(address borrower) 
        external view returns (uint256) 
    {
        uint16 score = trustOracle
            .getTrustScore(borrower).score;
        
        if (score >= 90) return riskTiers[90];
        if (score >= 70) return riskTiers[70];
        if (score >= 50) return riskTiers[50];
        
        revert("Trust score too low for lending");
    }
    
    function adjustCollateralRatio(address borrower)
        external view returns (uint256) 
    {
        uint16 score = trustOracle
            .getTrustScore(borrower).score;
        
        // Higher trust = lower collateral required
        if (score >= 90) return 120; // 120%
        if (score >= 70) return 150; // 150%
        return 200; // 200% for lower trust
    }
}`}
              </pre>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-semibold text-blue-900 mb-2">Contract Address (Arbitrum Sepolia)</h5>
            <p className="font-mono text-sm text-blue-800">0x... (deployed after setup)</p>
            <p className="text-blue-700 text-sm mt-2">
              Use this address to interact with the TrustOracle contract in your dApp.
            </p>
          </div>
        </div>

        {/* API Integration */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">REST API Integration</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Compute Trust Score</h4>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// POST /compute-score
const response = await fetch('/compute-score', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    wallet: '0x742d35Cc6634C0532925a3b8D',
    optionalSignals: {
      farcasterFollowers: 1500,
      githubContributions: 250,
      ensName: 'alice.eth'
    }
  })
});

const data = await response.json();
console.log({
  score: data.score,           // 0-100
  breakdown: data.breakdown,   // Feature analysis
  explanation: data.explanation, // AI explanation
  confidence: data.confidence, // Model confidence
  metadataHash: data.metadataHash,
  signature: data.signature    // Oracle signature
});`}
              </pre>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Get Cached Score</h4>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// GET /wallet/:address
const walletAddress = '0x742d35Cc6634C0532925a3b8D';
const response = await fetch(\`/wallet/\${walletAddress}\`);

const data = await response.json();
console.log({
  currentScore: data.score,
  lastUpdated: data.timestamp,
  history: data.history,       // Historical scores
  profile: data.profile        // Wallet profile data
});

// Submit score to blockchain
await fetch('/submit-onchain', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress,
    score: data.score,
    timestamp: data.timestamp
  })
});`}
              </pre>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h5 className="font-semibold text-green-900 mb-2">API Endpoint</h5>
            <p className="font-mono text-sm text-green-800">https://api.chainyodha-ai.com</p>
            <p className="text-green-700 text-sm mt-2">
              Rate limited to 100 requests per minute. Contact us for higher limits.
            </p>
          </div>
        </div>

        {/* SDK Integration */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">SDK Integration</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">TypeScript/JavaScript</h4>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { ChainYodhaClient } from '@chainyodha/sdk';

const client = new ChainYodhaClient({
  apiKey: process.env.CHAINYODHA_API_KEY,
  network: 'arbitrum-sepolia'
});

// Compute trust score
const result = await client.computeTrustScore({
  wallet: '0x742d35Cc6634C0532925a3b8D',
  includeExplanation: true,
  optionalSignals: {
    farcaster: { username: 'alice' },
    github: { username: 'alice-dev' }
  }
});

console.log(\`Trust Score: \${result.score}/100\`);
console.log(\`Recommendation: \${result.recommendation}\`);

// Get contract instance
const contract = client.getContract();
const isUserTrusted = await contract.isTrusted(
  '0x742d35Cc6634C0532925a3b8D'
);`}
              </pre>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">React Hook</h4>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { useTrustScore } from '@chainyodha/react';

function WalletTrustBadge({ address }) {
  const { 
    score, 
    loading, 
    error, 
    refresh 
  } = useTrustScore(address);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const getBadgeColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className={\`px-3 py-1 rounded-full text-sm font-medium \${getBadgeColor(score)}\`}>
      Trust Score: {score}/100
      <button onClick={refresh} className="ml-2">
        🔄
      </button>
    </div>
  );
}`}
              </pre>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <h5 className="font-semibold text-purple-900 mb-2">Installation</h5>
            <pre className="font-mono text-sm text-purple-800">npm install @chainyodha/sdk @chainyodha/react</pre>
            <p className="text-purple-700 text-sm mt-2">
              Full TypeScript support with comprehensive type definitions.
            </p>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Common Use Cases</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">DeFi Lending</h4>
              <p className="text-gray-600 text-sm mb-3">
                Adjust interest rates and collateral requirements based on wallet trust scores.
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Risk-based pricing</li>
                <li>• Dynamic collateral ratios</li>
                <li>• Automated underwriting</li>
              </ul>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">DEX Trading</h4>
              <p className="text-gray-600 text-sm mb-3">
                Implement trust-based trading limits and MEV protection.
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Trading limits</li>
                <li>• Slippage protection</li>
                <li>• Priority access</li>
              </ul>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">NFT Marketplaces</h4>
              <p className="text-gray-600 text-sm mb-3">
                Display trust badges and implement seller verification.
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Seller verification</li>
                <li>• Trust badges</li>
                <li>• Fraud prevention</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
