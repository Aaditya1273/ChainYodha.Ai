import request from "supertest"
import app from "../index"
import { AppDataSource } from "../database/data-source"

describe("Score API", () => {
  beforeAll(async () => {
    await AppDataSource.initialize()
  })

  afterAll(async () => {
    await AppDataSource.destroy()
  })

  describe("POST /compute-score", () => {
    it("should compute trust score for valid wallet", async () => {
      const response = await request(app).post("/compute-score").send({
        wallet: "0x1234567890123456789012345678901234567890",
      })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty("score")
      expect(response.body).toHaveProperty("breakdown")
      expect(response.body).toHaveProperty("explanation")
      expect(response.body).toHaveProperty("signature")
      expect(response.body.score).toBeGreaterThanOrEqual(0)
      expect(response.body.score).toBeLessThanOrEqual(100)
    })

    it("should reject invalid wallet address", async () => {
      const response = await request(app).post("/compute-score").send({
        wallet: "invalid-address",
      })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty("error")
    })
  })
})
