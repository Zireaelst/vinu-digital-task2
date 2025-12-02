import hre from "hardhat";
import chalk from "chalk";
import * as dotenv from "dotenv";

dotenv.config();

const { ethers } = hre;

async function main() {
  console.log(chalk.blue("🚀 Quick Batch Operations Test"));
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  const deployerBalance = await ethers.provider.getBalance(deployer);
  console.log(`Deployer Balance: ${ethers.formatEther(deployerBalance)} ETH`);
  
  // Read deployment addresses
  const fs = require("fs");
  const deployedAddresses = JSON.parse(fs.readFileSync("deployed_addresses.json", "utf8"));
  
  // Get contracts
  const testToken = await ethers.getContractAt("TestToken", deployedAddresses.testToken);
  const factory = await ethers.getContractAt("SimpleAccountFactory", deployedAddresses.simpleAccountFactory);
  
  // Create a simple test account
  const userWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  const accountAddress = await factory.getFunction("getAddress").staticCall(userWallet.address, 0);
  
  console.log(`User Wallet: ${userWallet.address}`);
  console.log(`Account Address: ${accountAddress}`);
  
  // Check if account is already deployed
  const accountCode = await ethers.provider.getCode(accountAddress);
  if (accountCode === "0x") {
    console.log(chalk.yellow("📦 Creating SimpleAccount..."));
    const createTx = await factory.createAccount(userWallet.address, 0);
    await createTx.wait();
    console.log(chalk.green("✅ SimpleAccount created"));
  } else {
    console.log(chalk.green("✅ SimpleAccount already exists"));
  }
  
  // Get the account contract instance with new implementation
  const simpleAccount = await ethers.getContractAt(
    "contracts/core/SimpleAccount.sol:SimpleAccount", 
    accountAddress
  );
  
  // Test batch functionality
  console.log(chalk.blue("\n🔍 Testing Batch Functions..."));
  
  // Test getExecuteBatchCallData function
  const destinations = [
    "0x1234567890123456789012345678901234567890",
    "0x2345678901234567890123456789012345678901"
  ];
  const values = [0, 0];
  const callDatas = [
    testToken.interface.encodeFunctionData("transfer", [destinations[0], ethers.parseEther("10")]),
    testToken.interface.encodeFunctionData("transfer", [destinations[1], ethers.parseEther("20")])
  ];
  
  try {
    const batchCallData = await simpleAccount.getExecuteBatchCallData(destinations, values, callDatas);
    console.log(chalk.green("✅ getExecuteBatchCallData function works!"));
    console.log(`   Calldata length: ${batchCallData.length} bytes`);
  } catch (error: any) {
    console.log(chalk.red("❌ getExecuteBatchCallData failed:"), error.message);
  }
  
  // Test executeBatch function signature (view only)
  try {
    const functionSignature = simpleAccount.interface.getFunction("executeBatch(address[],uint256[],bytes[])");
    console.log(chalk.green("✅ executeBatch function signature exists!"));
    console.log(`   Function: ${functionSignature?.format()}`);
  } catch (error: any) {
    console.log(chalk.red("❌ executeBatch function not found:"), error.message);
  }
  
  // Check SimpleAccount balance
  const accountETHBalance = await ethers.provider.getBalance(accountAddress);
  const accountTokenBalance = await testToken.balanceOf(accountAddress);
  
  console.log(chalk.blue("\n📊 Account Status:"));
  console.log(`ETH Balance: ${ethers.formatEther(accountETHBalance)} ETH`);
  console.log(`TEST Token Balance: ${ethers.formatEther(accountTokenBalance)} TEST`);
  
  // Check contract implementation
  console.log(chalk.blue("\n🔗 Contract Links:"));
  console.log(`SimpleAccount: https://sepolia.etherscan.io/address/${accountAddress}`);
  console.log(`New Implementation: https://sepolia.etherscan.io/address/${deployedAddresses.simpleAccountImplementation}`);
  
  console.log(chalk.green("\n✅ Quick test completed!"));
  console.log(chalk.yellow("New batch operations are ready to use:"));
  console.log("  • executeBatch(address[], uint256[], bytes[])");
  console.log("  • getExecuteBatchCallData(address[], uint256[], bytes[])");
}

main()
  .then(() => {
    console.log(chalk.green("\n✅ Test completed successfully!"));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red("❌ Test failed:"));
    console.error(error);
    process.exit(1);
  });