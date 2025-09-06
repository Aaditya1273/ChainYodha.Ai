import { ethers } from "hardhat"
import * as dotenv from "dotenv"
import hre from "hardhat"

dotenv.config()

async function main() {
  console.log("🚀 Deploying TrustGrid.AI Oracle Contract...")

  // Get the deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Deploying with account:", deployer.address)

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log("Account balance:", ethers.formatEther(balance), "ETH")

  // Get oracle address from environment
  const oraclePrivateKey = process.env.ORACLE_PRIVATE_KEY
  if (!oraclePrivateKey) {
    throw new Error("ORACLE_PRIVATE_KEY not set in environment")
  }

  const oracleWallet = new ethers.Wallet(oraclePrivateKey)
  const oracleAddress = oracleWallet.address
  console.log("Oracle address:", oracleAddress)

  // Deploy the TrustOracle contract
  const TrustOracle = await ethers.getContractFactory("TrustOracle")
  const trustThreshold = 60 // Default trust threshold of 60

  console.log("Deploying TrustOracle contract...")
  const trustOracle = await TrustOracle.deploy(oracleAddress, trustThreshold)

  await trustOracle.waitForDeployment()
  const contractAddress = await trustOracle.getAddress()

  console.log("✅ TrustOracle deployed to:", contractAddress)
  console.log("Oracle address:", oracleAddress)
  console.log("Trust threshold:", trustThreshold)

  // Verify contract on Arbiscan (if API key is provided)
  if (process.env.ARBISCAN_API_KEY) {
    console.log("⏳ Waiting for block confirmations...")
    await trustOracle.deploymentTransaction()?.wait(5)

    try {
      console.log("🔍 Verifying contract on Arbiscan...")
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [oracleAddress, trustThreshold],
      })
      console.log("✅ Contract verified on Arbiscan")
    } catch (error) {
      console.log("❌ Verification failed:", error)
    }
  }

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    oracleAddress,
    trustThreshold,
    deployer: deployer.address,
    network: "arbitrumSepolia",
    deployedAt: new Date().toISOString(),
  }

  console.log("\n📝 Deployment Summary:")
  console.log(JSON.stringify(deploymentInfo, null, 2))

  console.log("\n🔧 Next steps:")
  console.log("1. Update your .env file with:")
  console.log(`   TRUST_ORACLE_CONTRACT=${contractAddress}`)
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`)
  console.log("2. Start the backend service")
  console.log("3. Run the demo script")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
