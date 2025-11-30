import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import chalk from "chalk";
import * as dotenv from "dotenv";

dotenv.config();

// Known EntryPoint address on Sepolia
const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

interface DeployedContracts {
  entryPoint: string;
  simpleAccountFactory: string;
  sponsorPaymaster: string;
  testToken: string;
  deployedAt: string;
  network: string;
  deployer: string;
}

async function main() {
  console.log(chalk.blue("🚀 Starting ERC-4337 Account Abstraction Deployment..."));
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const network = await ethers.provider.getNetwork();
  
  console.log(chalk.yellow("📋 Deployment Configuration:"));
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployerAddress}`);
  console.log(`EntryPoint: ${ENTRYPOINT_ADDRESS}`);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log(`Deployer Balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther("0.1")) {
    console.log(chalk.red("⚠️  Warning: Low balance! You might need more ETH for deployment."));
  }
  
  console.log(chalk.blue("\n📦 Starting Contract Deployment..."));
  
  // 1. Deploy TestToken
  console.log(chalk.cyan("1️⃣  Deploying TestToken..."));
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy(
    "Test Token",
    "TEST",
    deployerAddress
  );
  await testToken.waitForDeployment();
  const testTokenAddress = await testToken.getAddress();
  console.log(chalk.green(`✅ TestToken deployed to: ${testTokenAddress}`));
  
  // 2. Deploy SimpleAccountFactory
  console.log(chalk.cyan("2️⃣  Deploying SimpleAccountFactory..."));
  const SimpleAccountFactory = await ethers.getContractFactory("SimpleAccountFactory");
  const simpleAccountFactory = await SimpleAccountFactory.deploy(ENTRYPOINT_ADDRESS);
  await simpleAccountFactory.waitForDeployment();
  const factoryAddress = await simpleAccountFactory.getAddress();
  console.log(chalk.green(`✅ SimpleAccountFactory deployed to: ${factoryAddress}`));
  
  // 3. Deploy SponsorPaymaster
  console.log(chalk.cyan("3️⃣  Deploying SponsorPaymaster..."));
  const SponsorPaymaster = await ethers.getContractFactory("SponsorPaymaster");
  const sponsorPaymaster = await SponsorPaymaster.deploy(
    ENTRYPOINT_ADDRESS,
    deployerAddress
  );
  await sponsorPaymaster.waitForDeployment();
  const paymasterAddress = await sponsorPaymaster.getAddress();
  console.log(chalk.green(`✅ SponsorPaymaster deployed to: ${paymasterAddress}`));
  
  // 4. Initial Configuration
  console.log(chalk.blue("\n⚙️  Initial Configuration..."));
  
  // Add initial ETH deposit to paymaster (0.01 ETH)
  console.log(chalk.cyan("💰 Adding initial deposit to Paymaster..."));
  const depositAmount = ethers.parseEther("0.01");
  const depositTx = await sponsorPaymaster.depositForOwner({ value: depositAmount });
  await depositTx.wait();
  console.log(chalk.green(`✅ Deposited ${ethers.formatEther(depositAmount)} ETH to Paymaster`));
  
  // Create a test account address for whitelisting
  const testUserWallet = ethers.Wallet.createRandom();
  const testAccountAddress = await simpleAccountFactory.getAddress(testUserWallet.address, 0);
  
  // Whitelist the test account
  console.log(chalk.cyan("🏷️  Whitelisting test account..."));
  const whitelistTx = await sponsorPaymaster.setWhitelist(testAccountAddress, true);
  await whitelistTx.wait();
  console.log(chalk.green(`✅ Whitelisted test account: ${testAccountAddress}`));
  
  // 5. Save deployment addresses
  const deployedContracts: DeployedContracts = {
    entryPoint: ENTRYPOINT_ADDRESS,
    simpleAccountFactory: factoryAddress,
    sponsorPaymaster: paymasterAddress,
    testToken: testTokenAddress,
    deployedAt: new Date().toISOString(),
    network: network.name,
    deployer: deployerAddress
  };
  
  const deploymentFile = "deployed_addresses.json";
  writeFileSync(deploymentFile, JSON.stringify(deployedContracts, null, 2));
  console.log(chalk.green(`✅ Deployment addresses saved to: ${deploymentFile}`));
  
  // 6. Generate .env updates
  console.log(chalk.blue("\n📝 Environment Variables:"));
  console.log(chalk.yellow("Add these to your .env file:"));
  console.log(`SIMPLE_ACCOUNT_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`SPONSOR_PAYMASTER_ADDRESS=${paymasterAddress}`);
  console.log(`TEST_TOKEN_ADDRESS=${testTokenAddress}`);
  console.log(`TEST_USER_PRIVATE_KEY=${testUserWallet.privateKey}`);
  console.log(`TEST_ACCOUNT_ADDRESS=${testAccountAddress}`);
  
  // 7. Summary
  console.log(chalk.blue("\n📊 Deployment Summary:"));
  console.log(chalk.green("✅ All contracts deployed successfully!"));
  console.log(`📄 TestToken: ${testTokenAddress}`);
  console.log(`🏭 SimpleAccountFactory: ${factoryAddress}`);
  console.log(`💳 SponsorPaymaster: ${paymasterAddress}`);
  console.log(`🎯 EntryPoint: ${ENTRYPOINT_ADDRESS}`);
  console.log(`👤 Test Account: ${testAccountAddress}`);
  
  // 8. Next steps
  console.log(chalk.blue("\n🎯 Next Steps:"));
  console.log("1. Update your .env file with the addresses above");
  console.log("2. Run verification: npm run verify");
  console.log("3. Run demo: npm run demo");
  
  // 9. Verification commands (for manual verification)
  console.log(chalk.blue("\n🔍 Manual Verification Commands:"));
  console.log(`npx hardhat verify --network sepolia ${testTokenAddress} "Test Token" "TEST" "${deployerAddress}"`);
  console.log(`npx hardhat verify --network sepolia ${factoryAddress} "${ENTRYPOINT_ADDRESS}"`);
  console.log(`npx hardhat verify --network sepolia ${paymasterAddress} "${ENTRYPOINT_ADDRESS}" "${deployerAddress}"`);
}

main()
  .then(() => {
    console.log(chalk.green("\n🎉 Deployment completed successfully!"));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red("❌ Deployment failed:"));
    console.error(error);
    process.exit(1);
  });