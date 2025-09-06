'use client'

import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [arbitrumSepolia],
  [publicProvider()]
)

const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        {children}
      </WagmiConfig>
    </QueryClientProvider>
  )
}
