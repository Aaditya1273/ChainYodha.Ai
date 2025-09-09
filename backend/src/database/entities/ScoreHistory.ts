import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

@Entity("score_history")
@Index(["walletAddress", "createdAt"])
export class ScoreHistory {
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

  @Column({ type: "json" })
  breakdown!: {
    feature: string
    weight: number
    value: number
    normalizedValue: number
  }[]

  @Column({ type: "text", nullable: true })
  explanation!: string

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date
}
