import hre from "hardhat";
import { readFileSync } from "fs";
import chalk from "chalk";

const { ethers } = hre;

async function main() {
  console.log(chalk.blue("🔍 Debugging ERC-4337 UserOp..."));
  
  // Load deployed contracts
  const data = readFileSync("deployed_addresses.json", "utf8");
  const deployedContracts = JSON.parse(data);
  
  // Get contracts
  const [deployer] = await ethers.getSigners();
  const entryPoint = await ethers.getContractAt("IEntryPoint", deployedContracts.entryPoint);
  const factory = await ethers.getContractAt("SimpleAccountFactory", deployedContracts.simpleAccountFactory);
  const paymaster = await ethers.getContractAt("SponsorPaymaster", deployedContracts.sponsorPaymaster);
  const testToken = await ethers.getContractAt("TestToken", deployedContracts.testToken);
  
  console.log(chalk.yellow("📋 Contract Status:"));
  
  // Check EntryPoint
  try {
    const entryPointVersion = await entryPoint.getSenderAddress("0x");
  } catch (error: any) {
    if (error.message.includes("SenderAddressResult")) {
      console.log(chalk.green("✅ EntryPoint is working"));
    } else {
      console.log(chalk.red("❌ EntryPoint error:"), error.message);
    }
  }
  
  // Check Factory
  const factoryEntryPoint = await factory.getEntryPoint();
  console.log(`Factory EntryPoint: ${factoryEntryPoint}`);
  console.log(`Expected EntryPoint: ${deployedContracts.entryPoint}`);
  console.log(factoryEntryPoint === deployedContracts.entryPoint ? chalk.green("✅ Factory OK") : chalk.red("❌ Factory wrong EntryPoint"));
  
  // Check Paymaster
  const paymasterBalance = await paymaster.getDepositBalance();
  console.log(`Paymaster Balance: ${ethers.formatEther(paymasterBalance)} ETH`);
  console.log(paymasterBalance > 0 ? chalk.green("✅ Paymaster funded") : chalk.red("❌ Paymaster not funded"));
  
  // Create test user
  const userWallet = new ethers.Wallet("0x4a6255d3fe1a1e5b42541697f910fbf33b04c3b6f4e4212f1064fb0f917af757", ethers.provider);
  const userAccountAddress = await factory.getAddress(userWallet.address, 0);
  
  console.log(chalk.blue("\n🔍 Account Analysis:"));
  console.log(`User EOA: ${userWallet.address}`);
  console.log(`User Account: ${userAccountAddress}`);
  
  // Check if account is deployed and has code
  const accountCode = await ethers.provider.getCode(userAccountAddress);
  const isDeployed = accountCode !== "0x";
  console.log(`Account deployed: ${isDeployed ? chalk.green("✅ Yes") : chalk.red("❌ No")}`);
  
  if (isDeployed) {
    try {
      const account = await ethers.getContractAt("contracts/core/SimpleAccount.sol:SimpleAccount", userAccountAddress);
      const owner = await account.owner();
      console.log(`Account owner: ${owner}`);
      console.log(`Expected owner: ${userWallet.address}`);
      console.log(owner.toLowerCase() === userWallet.address.toLowerCase() ? chalk.green("✅ Owner correct") : chalk.red("❌ Owner mismatch"));
      
      const nonce = await account.getNonce();
      console.log(`Account nonce: ${nonce}`);
    } catch (error: any) {
      console.log(chalk.red("❌ Error reading account:"), error.message);
    }
  }
  
  // Check whitelist
  const isWhitelisted = await paymaster.isWhitelisted(userAccountAddress);
  console.log(`Whitelisted: ${isWhitelisted ? chalk.green("✅ Yes") : chalk.red("❌ No")}`);
  
  // Check token balance
  const tokenBalance = await testToken.balanceOf(userAccountAddress);
  console.log(`Token balance: ${ethers.formatEther(tokenBalance)} TEST`);
  
  console.log(chalk.blue("\n🧪 Testing UserOp Validation..."));
  
  // Simple UserOp for testing
  const transferAmount = ethers.parseEther("1");
  const recipientAddress = "0x742d35Cc6851C2c2C6adD8C495Fa3D2B1068E589";
  
  const transferCallData = testToken.interface.encodeFunctionData("transfer", [
    recipientAddress,
    transferAmount
  ]);
  
  if (isDeployed) {
    const account = await ethers.getContractAt("contracts/core/SimpleAccount.sol:SimpleAccount", userAccountAddress);
    const callData = account.interface.encodeFunctionData("execute", [
      await testToken.getAddress(),
      0,
      transferCallData
    ]);
    
    const nonce = await entryPoint.getNonce(userAccountAddress, 0);
    
    // Build minimal UserOp
    const userOp = {
      sender: userAccountAddress,
      nonce: "0x" + nonce.toString(16),
      initCode: "0x",
      callData: callData,
      callGasLimit: "0x" + (200000).toString(16),
      verificationGasLimit: "0x" + (400000).toString(16),
      preVerificationGas: "0x" + (50000).toString(16),
      maxFeePerGas: "0x" + ethers.parseUnits("20", "gwei").toString(16),
      maxPriorityFeePerGas: "0x" + ethers.parseUnits("2", "gwei").toString(16),
      paymasterAndData: await paymaster.getAddress(),
      signature: "0x"
    };
    
    console.log(`UserOp sender: ${userOp.sender}`);
    console.log(`UserOp nonce: ${userOp.nonce}`);
    console.log(`UserOp callData: ${callData.slice(0, 20)}...`);
    
    // Test signature
    const userOpHash = await entryPoint.getUserOpHash(userOp);
    const signature = await userWallet.signMessage(ethers.getBytes(userOpHash));
    userOp.signature = signature;
    
    console.log(`UserOp hash: ${userOpHash}`);
    console.log(`Signature: ${signature.slice(0, 20)}...`);
    
    // Try to simulate
    try {
      await entryPoint.simulateValidation(userOp);
      console.log(chalk.green("✅ UserOp validation passed"));
    } catch (error: any) {
      console.log(chalk.red("❌ UserOp validation failed:"));
      console.log(error.message);
      
      // Try to decode the error
      if (error.data) {
        try {
          // Common ERC-4337 errors
          if (error.data.includes("AA23")) {
            console.log(chalk.yellow("AA23: paymaster deposit too low"));
          } else if (error.data.includes("AA24")) {
            console.log(chalk.yellow("AA24: signature error"));
          } else if (error.data.includes("AA25")) {
            console.log(chalk.yellow("AA25: invalid account nonce"));
          } else if (error.data.includes("AA32")) {
            console.log(chalk.yellow("AA32: paymaster expired or not due"));
          } else if (error.data.includes("AA33")) {
            console.log(chalk.yellow("AA33: reverted (or OOG)"));
          } else if (error.data.includes("AA34")) {
            console.log(chalk.yellow("AA34: signature error"));
          }
        } catch (e) {
          console.log("Could not decode error");
        }
      }
    }
  } else {
    console.log(chalk.yellow("⚠️  Account not deployed, skipping UserOp test"));
  }
}

main()
  .then(() => {
    console.log(chalk.blue("\n🔍 Debug completed"));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red("❌ Debug failed:"));
    console.error(error);
    process.exit(1);
  });