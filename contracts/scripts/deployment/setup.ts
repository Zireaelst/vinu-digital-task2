import hre from "hardhat";
import { writeFileSync } from "fs";
import chalk from "chalk";

const { ethers } = hre;

// Manually set the deployed addresses from the console output
const deployedAddresses = {
  entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  simpleAccountFactory: "0x6E532B9e22A8F31105C741658989Ca79da3Fb11A",
  sponsorPaymaster: "0x61d222f1e0386a7Af71C865fF83Ad4CEd1131011",
  testToken: "0xab230E033D846Add5367Eb48BdCC4928259239a8"
};

async function main() {
  console.log(chalk.blue("🔧 Setting up deployed contracts..."));
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`Deployer: ${await deployer.getAddress()}`);
  console.log(`Network: ${network.name}`);
  
  // Get contracts
  const paymaster = await ethers.getContractAt("SponsorPaymaster", deployedAddresses.sponsorPaymaster);
  const factory = await ethers.getContractAt("SimpleAccountFactory", deployedAddresses.simpleAccountFactory);
  
  console.log(chalk.blue("\n💰 Funding Paymaster with smaller amount..."));
  
  // Add smaller deposit (0.005 ETH)
  const depositAmount = ethers.parseEther("0.005");
  console.log(`Depositing ${ethers.formatEther(depositAmount)} ETH...`);
  
  try {
    const depositTx = await paymaster.depositForOwner({ value: depositAmount });
    await depositTx.wait();
    console.log(chalk.green(`✅ Deposited ${ethers.formatEther(depositAmount)} ETH to Paymaster`));
  } catch (error) {
    console.log(chalk.yellow("⚠️  Could not fund paymaster, continuing without initial deposit"));
  }
  
  console.log(chalk.blue("\n🏷️  Setting up test account..."));
  
  // Create test user
  const testUserWallet = ethers.Wallet.createRandom();
  const testAccountAddress = await factory.getAddress(testUserWallet.address, 0);
  
  try {
    // Whitelist test account
    const whitelistTx = await paymaster.setWhitelist(testAccountAddress, true);
    await whitelistTx.wait();
    console.log(chalk.green(`✅ Whitelisted test account: ${testAccountAddress}`));
  } catch (error) {
    console.log(chalk.yellow("⚠️  Could not whitelist account, will handle in demo"));
  }
  
  // Save deployment info
  const deployedContracts = {
    ...deployedAddresses,
    deployedAt: new Date().toISOString(),
    network: network.name,
    deployer: await deployer.getAddress()
  };
  
  writeFileSync("deployed_addresses.json", JSON.stringify(deployedContracts, null, 2));
  console.log(chalk.green("✅ Deployment addresses saved to deployed_addresses.json"));
  
  // Update .env
  console.log(chalk.blue("\n📝 Environment Variables:"));
  console.log(`TEST_USER_PRIVATE_KEY=${testUserWallet.privateKey}`);
  console.log(`TEST_ACCOUNT_ADDRESS=${testAccountAddress}`);
  
  console.log(chalk.blue("\n📊 Deployment Summary:"));
  console.log(`📄 TestToken: ${deployedAddresses.testToken}`);
  console.log(`🏭 SimpleAccountFactory: ${deployedAddresses.simpleAccountFactory}`);
  console.log(`💳 SponsorPaymaster: ${deployedAddresses.sponsorPaymaster}`);
  console.log(`🎯 EntryPoint: ${deployedAddresses.entryPoint}`);
  console.log(`👤 Test Account: ${testAccountAddress}`);
  
  console.log(chalk.green("\n✅ Setup completed! Ready for demo."));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });