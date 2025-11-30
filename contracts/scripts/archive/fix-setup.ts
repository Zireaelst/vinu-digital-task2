import { ethers } from "hardhat";
import { readFileSync } from "fs";
import chalk from "chalk";

async function main() {
  console.log(chalk.blue("🛠️  Fixing ERC-4337 Setup..."));
  
  // Load deployed contracts
  const data = readFileSync("deployed_addresses.json", "utf8");
  const deployedContracts = JSON.parse(data);
  
  const [deployer] = await ethers.getSigners();
  
  // Get contracts
  const factory = await ethers.getContractAt("SimpleAccountFactory", deployedContracts.simpleAccountFactory);
  const paymaster = await ethers.getContractAt("SponsorPaymaster", deployedContracts.sponsorPaymaster);
  
  console.log(chalk.yellow("📋 Current Setup:"));
  console.log(`Factory: ${deployedContracts.simpleAccountFactory}`);
  console.log(`Paymaster: ${deployedContracts.sponsorPaymaster}`);
  
  // Create test user
  const userWallet = new ethers.Wallet("0x4a6255d3fe1a1e5b42541697f910fbf33b04c3b6f4e4212f1064fb0f917af757", ethers.provider);
  console.log(`User EOA: ${userWallet.address}`);
  
  // Calculate CORRECT account address
  const salt = 0;
  const userAccountAddress = await factory.getAddress(userWallet.address, salt);
  console.log(`Calculated Account Address: ${userAccountAddress}`);
  
  // Check if this account is deployed
  const accountCode = await ethers.provider.getCode(userAccountAddress);
  const isDeployed = accountCode !== "0x";
  console.log(`Account deployed: ${isDeployed ? "✅ Yes" : "❌ No"}`);
  
  if (!isDeployed) {
    console.log(chalk.cyan("🏗️  Deploying Account..."));
    const createTx = await factory.createAccount(userWallet.address, salt);
    await createTx.wait();
    console.log(chalk.green("✅ Account deployed"));
    
    // Verify deployment
    const newCode = await ethers.provider.getCode(userAccountAddress);
    console.log(`New account deployed: ${newCode !== "0x" ? "✅ Yes" : "❌ No"}`);
  }
  
  // Check if account is whitelisted
  const isWhitelisted = await paymaster.isWhitelisted(userAccountAddress);
  console.log(`Account whitelisted: ${isWhitelisted ? "✅ Yes" : "❌ No"}`);
  
  if (!isWhitelisted) {
    console.log(chalk.cyan("🏷️  Whitelisting Account..."));
    const whitelistTx = await paymaster.setWhitelist(userAccountAddress, true);
    await whitelistTx.wait();
    console.log(chalk.green("✅ Account whitelisted"));
  }
  
  // Check paymaster balance and add more if needed
  const paymasterBalance = await paymaster.getDepositBalance();
  console.log(`Paymaster balance: ${ethers.formatEther(paymasterBalance)} ETH`);
  
  if (paymasterBalance < ethers.parseEther("0.01")) {
    console.log(chalk.cyan("💰 Adding more funds to paymaster..."));
    const depositTx = await paymaster.depositForOwner({ value: ethers.parseEther("0.02") });
    await depositTx.wait();
    console.log(chalk.green("✅ Paymaster funded"));
  }
  
  console.log(chalk.blue("\\n✅ Setup Fixed! Summary:"));
  console.log(`👤 User EOA: ${userWallet.address}`);
  console.log(`🏠 User Account: ${userAccountAddress}`);
  console.log(`💳 Paymaster: ${deployedContracts.sponsorPaymaster}`);
  console.log(`🪙 TestToken: ${deployedContracts.testToken}`);
  console.log(chalk.green("\\nReady to run demo!"));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });