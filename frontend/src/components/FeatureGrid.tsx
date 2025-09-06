'use client'

import { 
  ChartBarIcon, 
  ShieldCheckIcon, 
  CpuChipIcon, 
  GlobeAltIcon,
  BanknotesIcon,
  ClockIcon 
} from '@heroicons/react/24/outline'

const features = [
  {
    icon: ChartBarIcon,
    title: 'Onchain Analytics',
    description: 'Comprehensive analysis of transaction history, contract interactions, and wallet behavior patterns.',
    metrics: ['Transaction Volume', 'Contract Diversity', 'Activity Frequency']
  },
  {
    icon: CpuChipIcon,
    title: 'AI-Powered Scoring',
    description: 'Machine learning models trained on blockchain data to identify trust and risk indicators.',
    metrics: ['XGBoost Model', 'Feature Engineering', 'Confidence Scoring']
  },
  {
    icon: GlobeAltIcon,
    title: 'Multi-Signal Analysis',
    description: 'Optional integration with Farcaster, GitHub, ENS, and other Web3 identity signals.',
    metrics: ['Social Reputation', 'Code Contributions', 'Domain Ownership']
  },
  {
    icon: ShieldCheckIcon,
    title: 'Transparent & Explainable',
    description: 'Every score comes with detailed explanations and feature breakdowns for full transparency.',
    metrics: ['SHAP Values', 'Feature Weights', 'Decision Logic']
  },
  {
    icon: BanknotesIcon,
    title: 'DeFi Risk Assessment',
    description: 'Specialized scoring for DeFi protocols, liquidity provision, and yield farming activities.',
    metrics: ['Protocol Interactions', 'Liquidity Behavior', 'Yield Strategies']
  },
  {
    icon: ClockIcon,
    title: 'Real-time Updates',
    description: 'Scores are updated in real-time as new onchain activity occurs, with caching for performance.',
    metrics: ['Live Monitoring', 'Smart Caching', 'Event Triggers']
  }
]

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {features.map((feature, index) => (
        <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 card-hover">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <feature.icon className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">{feature.title}</h4>
          </div>
          
          <p className="text-gray-600 mb-4 leading-relaxed">
            {feature.description}
          </p>
          
          <div className="space-y-2">
            {feature.metrics.map((metric, metricIndex) => (
              <div key={metricIndex} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{metric}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
