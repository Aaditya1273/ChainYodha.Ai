import { DataSource } from "typeorm"
import { TrustScore } from "./entities/TrustScore"
import { WalletProfile } from "./entities/WalletProfile"
import { ScoreHistory } from "./entities/ScoreHistory"

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DATABASE_URL?.replace("sqlite:", "") || "./data/trustgrid.db",
  synchronize: true, // Set to false in production
  logging: process.env.NODE_ENV === "development",
  entities: [TrustScore, WalletProfile, ScoreHistory],
  migrations: ["src/database/migrations/*.ts"],
  subscribers: ["src/database/subscribers/*.ts"],
})
