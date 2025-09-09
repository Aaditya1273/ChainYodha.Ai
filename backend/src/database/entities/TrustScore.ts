import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

@Entity("trust_scores")
@Index(["walletAddress"], { unique: true })
export class TrustScore {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: "varchar", length: 42 })
  @Index()
  walletAddress!: string

  @Column({ type: "integer", width: 3 })
  score!: number

  @Column({ type: "integer" })
  timestamp!: number

  @Column({ type: "varchar", length: 66 })
  source!: string

  @Column({ type: "varchar", length: 66 })
  metadataHash!: string

  @Column({ type: "text" })
  signature!: string

  @Column({ type: "json", nullable: true })
  breakdown!: {
    feature: string
    weight: number
    value: number
    normalizedValue: number
  }[]

  @Column({ type: "text", nullable: true })
  explanation!: string

  @Column({ type: "boolean", default: false })
  submittedOnchain!: boolean

  @Column({ type: "varchar", length: 66, nullable: true })
  transactionHash!: string

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date
}
