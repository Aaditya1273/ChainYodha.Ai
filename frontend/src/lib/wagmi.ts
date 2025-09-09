import { http, fallback } from 'wagmi'
import { arbitrum, arbitrumSepolia, mainnet } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// Define supported chains for ChainYodha.Ai
// Primary chain for development and testing
export const supportedChains = [arbitrumSepolia, arbitrum, mainnet] as const

// Add custom chain configuration for Arbitrum Sepolia with proper RPC
const customArbitrumSepolia = {
  ...arbitrumSepolia,
  rpcUrls: {
    default: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
    public: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
  },
}

// Enhanced RPC configuration with fallbacks
const getRpcUrls = (chainId: number) => {
  const rpcUrls: Record<number, string[]> = {
    [arbitrumSepolia.id]: [
      process.env.NEXT_PUBLIC_ARB_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
      'https://arbitrum-sepolia.blockpi.network/v1/rpc/public',
      'https://arbitrum-sepolia-rpc.publicnode.com'
    ],
    [arbitrum.id]: [
      process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.blockpi.network/v1/rpc/public',
      'https://arbitrum-one-rpc.publicnode.com'
    ],
    [mainnet.id]: [
      process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'https://eth.llamarpc.com',
      'https://ethereum.blockpi.network/v1/rpc/public',
      'https://ethereum-rpc.publicnode.com'
    ]
  }
  return rpcUrls[chainId] || []
}

// RainbowKit configuration with comprehensive wallet support
export const config = getDefaultConfig({
  appName: 'ChainYodha.Ai',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: supportedChains,
  transports: {
    [arbitrumSepolia.id]: fallback(
      getRpcUrls(arbitrumSepolia.id).map(url => http(url))
    ),
    [arbitrum.id]: fallback(
      getRpcUrls(arbitrum.id).map(url => http(url))
    ),
    [mainnet.id]: fallback(
      getRpcUrls(mainnet.id).map(url => http(url))
    ),
  },
  ssr: true, // Enable server-side rendering support
})

// Export chains for external use
export const chains = supportedChains

// Chain-specific configuration
export const chainConfig = {
  [arbitrumSepolia.id]: {
    name: 'Arbitrum Sepolia',
    isTestnet: true,
    blockExplorer: 'https://sepolia.arbiscan.io',
    faucets: [
      'https://faucet.quicknode.com/arbitrum/sepolia',
      'https://www.alchemy.com/faucets/arbitrum-sepolia'
    ]
  },
  [arbitrum.id]: {
    name: 'Arbitrum One',
    isTestnet: false,
    blockExplorer: 'https://arbiscan.io',
    faucets: []
  },
  [mainnet.id]: {
    name: 'Ethereum Mainnet',
    isTestnet: false,
    blockExplorer: 'https://etherscan.io',
    faucets: []
  }
} as const

// Helper function to get chain configuration
export const getChainConfig = (chainId: number) => {
  return chainConfig[chainId as keyof typeof chainConfig]
}

// Helper function to check if chain is supported
export const isSupportedChain = (chainId: number) => {
  return supportedChains.some(chain => chain.id === chainId)
}

// Default chain for the application (Arbitrum Sepolia for development)
export const defaultChain = process.env.NODE_ENV === 'development' 
  ? arbitrumSepolia 
  : arbitrum
