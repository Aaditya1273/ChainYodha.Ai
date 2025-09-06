import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

@Entity("wallet_profiles")
@Index(["walletAddress"], { unique: true })
export class WalletProfile {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: "varchar", length: 42 })
  @Index()
  walletAddress: string

  @Column({ type: "integer", default: 0 })
  totalTransactions: number

  @Column({ type: "integer", default: 0 })
  contractInteractions: number

  @Column({ type: "decimal", precision: 18, scale: 8, default: 0 })
  averageTransactionValue: number

  @Column({ type: "integer", default: 0 })
  uniqueContractsInteracted: number

  @Column({ type: "integer", default: 0 })
  swapFrequency: number

  @Column({ type: "integer", default: 0 })
  bridgeTransactions: number

  @Column({ type: "json", nullable: true })
  topTokens: {
    address: string
    symbol: string
    balance: string
    percentage: number
  }[]

  @Column({ type: "decimal", precision: 10, scale: 4, default: 0 })
  portfolioVolatility: number

  @Column({ type: "boolean", default: false })
  hasENS: boolean

  @Column({ type: "integer", default: 0 })
  farcasterFollowers: number

  @Column({ type: "integer", default: 0 })
  githubContributions: number

  @Column({ type: "integer", default: 0 })
  accountAge: number

  @Column({ type: "timestamp", nullable: true })
  lastAnalyzed: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
