import { ethers } from "ethers"
import { logger } from "../utils/logger"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

export class OracleService {
  private wallet: ethers.Wallet
  private provider: ethers.JsonRpcProvider
  private contract: ethers.Contract

  constructor() {
    // Debug: Log environment variable status
    logger.info(`Environment check - ORACLE_PRIVATE_KEY exists: ${!!process.env.ORACLE_PRIVATE_KEY}`)
    logger.info(`Environment check - TRUST_ORACLE_CONTRACT exists: ${!!process.env.TRUST_ORACLE_CONTRACT}`)

    // Initialize provider
    const rpcUrl = process.env.ARB_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc"
    this.provider = new ethers.JsonRpcProvider(rpcUrl)

    // Initialize wallet
    const privateKey = process.env.ORACLE_PRIVATE_KEY
    if (!privateKey) {
      logger.error("ORACLE_PRIVATE_KEY not found in environment variables")
      logger.error("Available env vars:", Object.keys(process.env).filter(key => key.includes('ORACLE')))
      throw new Error("ORACLE_PRIVATE_KEY not set in environment")
    }

    // Validate private key format
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      logger.error("Invalid ORACLE_PRIVATE_KEY format. Should be 64 hex characters with 0x prefix")
      throw new Error("Invalid ORACLE_PRIVATE_KEY format")
    }

    this.wallet = new ethers.Wallet(privateKey, this.provider)

    // Initialize contract
    const contractAddress = process.env.TRUST_ORACLE_CONTRACT
    if (!contractAddress) {
      logger.error("TRUST_ORACLE_CONTRACT not found in environment variables")
      throw new Error("TRUST_ORACLE_CONTRACT not set in environment")
    }

    // Validate contract address format
    if (!ethers.isAddress(contractAddress)) {
      logger.error("Invalid TRUST_ORACLE_CONTRACT address format")
      throw new Error("Invalid TRUST_ORACLE_CONTRACT address format")
    }

    // ABI for the TrustOracle contract
    const contractABI = [
      "function updateScore(address wallet, uint16 score, uint32 timestamp, bytes32 source, bytes32 metadataHash, bytes signature) external",
      "function getTrustScore(address wallet) external view returns (tuple(uint16 score, uint32 timestamp, bytes32 source, bytes32 metadataHash))",
      "function isTrusted(address wallet) external view returns (bool)",
      "function getMessageHash(address wallet, uint16 score, uint32 timestamp, bytes32 source, bytes32 metadataHash) external view returns (bytes32)",
      "function nonces(address wallet) external view returns (uint256)",
      "event ScoreUpdated(address indexed wallet, uint16 score, uint32 timestamp, bytes32 source, bytes32 metadataHash)",
    ]

    this.contract = new ethers.Contract(contractAddress, contractABI, this.wallet)
    
    logger.info(`OracleService initialized successfully`)
    logger.info(`Oracle wallet address: ${this.wallet.address}`)
    logger.info(`Contract address: ${contractAddress}`)
  }

  async signScore(
    walletAddress: string,
    score: number,
    timestamp: number,
    source: string,
    metadataHash: string,
  ): Promise<string> {
    try {
      logger.info(`Signing score for wallet ${walletAddress}`)

      // Get current nonce
      const nonce = await this.contract.nonces(walletAddress)

      // Create message hash
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint16", "uint32", "bytes32", "bytes32", "uint256"],
        [walletAddress, score, timestamp, source, metadataHash, nonce],
      )

      // Sign the message hash
      const signature = await this.wallet.signMessage(ethers.getBytes(messageHash))

      logger.info(`Score signed successfully for ${walletAddress}`)
      return signature
    } catch (error) {
      logger.error(`Error signing score for ${walletAddress}:`, error)
      throw error
    }
  }

  async submitScoreOnchain(
    walletAddress: string,
    score: number,
    timestamp: number,
    source: string,
    metadataHash: string,
    signature: string,
  ): Promise<string> {
    try {
      logger.info(`Submitting score onchain for wallet ${walletAddress}`)

      // Estimate gas
      const gasEstimate = await this.contract.updateScore.estimateGas(
        walletAddress,
        score,
        timestamp,
        source,
        metadataHash,
        signature,
      )

      // Submit transaction
      const tx = await this.contract.updateScore(walletAddress, score, timestamp, source, metadataHash, signature, {
        gasLimit: (gasEstimate * 120n) / 100n, // Add 20% buffer
      })

      logger.info(`Transaction submitted: ${tx.hash}`)

      // Wait for confirmation
      const receipt = await tx.wait()
      logger.info(`Score submitted onchain successfully. Transaction: ${receipt.hash}`)

      return receipt.hash
    } catch (error) {
      logger.error(`Error submitting score onchain for ${walletAddress}:`, error)
      throw error
    }
  }

  async getOnchainScore(walletAddress: string): Promise<{
    score: number
    timestamp: number
    source: string
    metadataHash: string
  } | null> {
    try {
      const result = await this.contract.getTrustScore(walletAddress)

      if (result.score === 0 && result.timestamp === 0) {
        return null // No score found
      }

      return {
        score: result.score,
        timestamp: result.timestamp,
        source: result.source,
        metadataHash: result.metadataHash,
      }
    } catch (error) {
      logger.error(`Error getting onchain score for ${walletAddress}:`, error)
      return null
    }
  }

  async isWalletTrusted(walletAddress: string): Promise<boolean> {
    try {
      return await this.contract.isTrusted(walletAddress)
    } catch (error) {
      logger.error(`Error checking if wallet is trusted ${walletAddress}:`, error)
      return false
    }
  }

  getOracleAddress(): string {
    return this.wallet.address
  }

  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address)
    return ethers.formatEther(balance)
  }

  // Utility method to check environment setup
  static checkEnvironment(): boolean {
    const required = ['ORACLE_PRIVATE_KEY', 'TRUST_ORACLE_CONTRACT']
    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      logger.error(`Missing required environment variables: ${missing.join(', ')}`)
      return false
    }
    
    return true
  }
}