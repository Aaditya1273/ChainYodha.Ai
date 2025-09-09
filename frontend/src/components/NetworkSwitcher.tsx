'use client'

import { useEffect, useState } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'

export function NetworkSwitcher() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const addArbitrumSepolia = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Try to switch to Arbitrum Sepolia
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x66eee' }], // 421614 in hex
        })
      } catch (switchError: any) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x66eee',
                  chainName: 'Arbitrum Sepolia',
                  nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
                  blockExplorerUrls: ['https://sepolia.arbiscan.io'],
                },
              ],
            })
          } catch (addError) {
            console.error('Failed to add network:', addError)
          }
        }
      }
    }
  }

  useEffect(() => {
    if (mounted && isConnected && chainId !== arbitrumSepolia.id) {
      // Auto-add/switch to Arbitrum Sepolia when connected
      addArbitrumSepolia()
    }
  }, [mounted, isConnected, chainId])

  if (!mounted || !isConnected) return null

  if (chainId !== arbitrumSepolia.id) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Wrong Network</p>
            <p className="text-sm">Please switch to Arbitrum Sepolia to use ChainYodha.Ai</p>
          </div>
          <button
            onClick={addArbitrumSepolia}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm"
          >
            Switch Network
          </button>
        </div>
      </div>
    )
  }

  return null
}

// Extend window type for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}
