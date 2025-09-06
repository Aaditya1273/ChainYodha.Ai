import { expect } from "chai"
import { ethers } from "hardhat"
import type { TrustOracle } from "../typechain-types"
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"

describe("TrustOracle", () => {
  let trustOracle: TrustOracle
  let owner: SignerWithAddress
  let oracle: SignerWithAddress
  let user: SignerWithAddress
  let testWallet: SignerWithAddress

  const TRUST_THRESHOLD = 60
  const TEST_SCORE = 75
  const TEST_SOURCE = ethers.keccak256(ethers.toUtf8Bytes("test-source"))
  const TEST_METADATA_HASH = ethers.keccak256(ethers.toUtf8Bytes("test-metadata"))

  beforeEach(async () => {
    ;[owner, oracle, user, testWallet] = await ethers.getSigners()

    const TrustOracle = await ethers.getContractFactory("TrustOracle")
    trustOracle = await TrustOracle.deploy(oracle.address, TRUST_THRESHOLD)
    await trustOracle.waitForDeployment()
  })

  describe("Deployment", () => {
    it("Should set the correct oracle address", async () => {
      expect(await trustOracle.oracleAddress()).to.equal(oracle.address)
    })

    it("Should set the correct trust threshold", async () => {
      expect(await trustOracle.trustThreshold()).to.equal(TRUST_THRESHOLD)
    })

    it("Should set the correct owner", async () => {
      expect(await trustOracle.owner()).to.equal(owner.address)
    })
  })

  describe("Score Updates", () => {
    it("Should update score with valid signature", async () => {
      const timestamp = Math.floor(Date.now() / 1000)
      const nonce = await trustOracle.nonces(testWallet.address)

      // Create message hash
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint16", "uint32", "bytes32", "bytes32", "uint256"],
        [testWallet.address, TEST_SCORE, timestamp, TEST_SOURCE, TEST_METADATA_HASH, nonce],
      )

      // Sign with oracle private key
      const signature = await oracle.signMessage(ethers.getBytes(messageHash))

      // Update score
      await expect(
        trustOracle.updateScore(testWallet.address, TEST_SCORE, timestamp, TEST_SOURCE, TEST_METADATA_HASH, signature),
      )
        .to.emit(trustOracle, "ScoreUpdated")
        .withArgs(testWallet.address, TEST_SCORE, timestamp, TEST_SOURCE, TEST_METADATA_HASH)

      // Check score was updated
      const score = await trustOracle.getTrustScore(testWallet.address)
      expect(score.score).to.equal(TEST_SCORE)
      expect(score.timestamp).to.equal(timestamp)
      expect(score.source).to.equal(TEST_SOURCE)
      expect(score.metadataHash).to.equal(TEST_METADATA_HASH)
    })

    it("Should reject invalid signature", async () => {
      const timestamp = Math.floor(Date.now() / 1000)

      // Sign with wrong private key (user instead of oracle)
      const messageHash = await trustOracle.getMessageHash(
        testWallet.address,
        TEST_SCORE,
        timestamp,
        TEST_SOURCE,
        TEST_METADATA_HASH,
      )
      const signature = await user.signMessage(ethers.getBytes(messageHash))

      await expect(
        trustOracle.updateScore(testWallet.address, TEST_SCORE, timestamp, TEST_SOURCE, TEST_METADATA_HASH, signature),
      ).to.be.revertedWithCustomError(trustOracle, "InvalidSignature")
    })

    it("Should reject invalid score", async () => {
      const timestamp = Math.floor(Date.now() / 1000)
      const invalidScore = 101

      const messageHash = await trustOracle.getMessageHash(
        testWallet.address,
        invalidScore,
        timestamp,
        TEST_SOURCE,
        TEST_METADATA_HASH,
      )
      const signature = await oracle.signMessage(ethers.getBytes(messageHash))

      await expect(
        trustOracle.updateScore(
          testWallet.address,
          invalidScore,
          timestamp,
          TEST_SOURCE,
          TEST_METADATA_HASH,
          signature,
        ),
      ).to.be.revertedWithCustomError(trustOracle, "InvalidScore")
    })

    it("Should reject stale timestamp", async () => {
      const staleTimestamp = Math.floor(Date.now() / 1000) - 7200 // 2 hours ago

      const messageHash = await trustOracle.getMessageHash(
        testWallet.address,
        TEST_SCORE,
        staleTimestamp,
        TEST_SOURCE,
        TEST_METADATA_HASH,
      )
      const signature = await oracle.signMessage(ethers.getBytes(messageHash))

      await expect(
        trustOracle.updateScore(
          testWallet.address,
          TEST_SCORE,
          staleTimestamp,
          TEST_SOURCE,
          TEST_METADATA_HASH,
          signature,
        ),
      ).to.be.revertedWithCustomError(trustOracle, "StaleTimestamp")
    })
  })

  describe("Trust Queries", () => {
    beforeEach(async () => {
      // Set up a score for testing
      const timestamp = Math.floor(Date.now() / 1000)
      const messageHash = await trustOracle.getMessageHash(
        testWallet.address,
        TEST_SCORE,
        timestamp,
        TEST_SOURCE,
        TEST_METADATA_HASH,
      )
      const signature = await oracle.signMessage(ethers.getBytes(messageHash))

      await trustOracle.updateScore(
        testWallet.address,
        TEST_SCORE,
        timestamp,
        TEST_SOURCE,
        TEST_METADATA_HASH,
        signature,
      )
    })

    it("Should return correct trust score", async () => {
      const score = await trustOracle.getTrustScore(testWallet.address)
      expect(score.score).to.equal(TEST_SCORE)
    })

    it("Should return true for trusted wallet", async () => {
      expect(await trustOracle.isTrusted(testWallet.address)).to.be.true
    })

    it("Should return false for untrusted wallet", async () => {
      expect(await trustOracle.isTrusted(user.address)).to.be.false
    })
  })

  describe("Admin Functions", () => {
    it("Should allow owner to update oracle", async () => {
      await expect(trustOracle.updateOracle(user.address))
        .to.emit(trustOracle, "OracleUpdated")
        .withArgs(oracle.address, user.address)

      expect(await trustOracle.oracleAddress()).to.equal(user.address)
    })

    it("Should reject non-owner oracle update", async () => {
      await expect(trustOracle.connect(user).updateOracle(user.address)).to.be.revertedWithCustomError(
        trustOracle,
        "OwnableUnauthorizedAccount",
      )
    })

    it("Should allow owner to update trust threshold", async () => {
      const newThreshold = 80
      await expect(trustOracle.updateTrustThreshold(newThreshold))
        .to.emit(trustOracle, "TrustThresholdUpdated")
        .withArgs(TRUST_THRESHOLD, newThreshold)

      expect(await trustOracle.trustThreshold()).to.equal(newThreshold)
    })

    it("Should reject invalid trust threshold", async () => {
      await expect(trustOracle.updateTrustThreshold(101)).to.be.revertedWithCustomError(trustOracle, "InvalidThreshold")
    })
  })
})
