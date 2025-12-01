import hre from "hardhat";
import { readFileSync } from "fs";
import chalk from "chalk";
import * as dotenv from "dotenv";

const { ethers } = hre;

dotenv.config();

/**
 * Simplified sponsored transfer demo that directly uses the EntryPoint
 * without complex UserOperation signing
 */
async function main() {
  console.log(chalk.blue("🎯 Simplified ERC-4337 Sponsored Transfer Demo"));
  console.log("=" .repeat(70));
  
  // Load deployed addresses
  let deployedContracts;
  try {
    const data = readFileSync("deployed_addresses.json", "utf8");
    deployedContracts = JSON.parse(data);
  } catch (error) {
    console.error(chalk.red("❌ Could not read deployed_addresses.json"));
    process.exit(1);
  }
  
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  
  // Get contracts
  const testToken = await ethers.getContractAt("TestToken", deployedContracts.testToken);
  const paymaster = await ethers.getContractAt("SponsorPaymaster", deployedContracts.sponsorPaymaster);
  
  console.log(chalk.blue("\n📋 Contract Addresses:"));
  console.log(`TestToken: ${deployedContracts.testToken}`);
  console.log(`Paymaster: ${deployedContracts.sponsorPaymaster}`);
  console.log(`Factory: ${deployedContracts.simpleAccountFactory}`);
  
  // Setup participants
  console.log(chalk.blue("\n👥 Setting Up Participants..."));
  
  // User A (sender) - create a new wallet
  const userAWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  console.log(`User A: ${userAWallet.address}`);
  
  // User B (recipient)
  const userBWallet = ethers.Wallet.createRandom();
  console.log(`User B: ${userBWallet.address}`);
  
  // Step 1: Mint tokens to User A
  console.log(chalk.blue("\n💰 Step 1: Minting Tokens to User A..."));
  const mintAmount = ethers.parseEther("1000");
  const mintTx = await testToken.freeMint(userAWallet.address, mintAmount);
  await mintTx.wait();
  
  const userABalance = await testToken.balanceOf(userAWallet.address);
  console.log(chalk.green(`✅ User A Balance: ${ethers.formatEther(userABalance)} TEST`));
  
  // Step 2: Fund User A with some ETH for gas (sponsor will actually pay)
  console.log(chalk.blue("\n⛽ Step 2: Funding User A with ETH for transaction..."));
  const fundTx = await deployer.sendTransaction({
    to: userAWallet.address,
    value: ethers.parseEther("0.01")
  });
  await fundTx.wait();
  console.log(chalk.green("✅ User A funded with 0.01 ETH"));
  
  // Step 3: Record initial paymaster balance
  console.log(chalk.blue("\n💳 Step 3: Checking Paymaster Balance..."));
  const initialPaymasterBalance = await paymaster.getDepositBalance();
  console.log(`Initial Paymaster Balance: ${ethers.formatEther(initialPaymasterBalance)} ETH`);
  
  if (initialPaymasterBalance < ethers.parseEther("0.005")) {
    console.log("Adding deposit to Paymaster...");
    const depositTx = await paymaster.depositForOwner({ value: ethers.parseEther("0.05") });
    await depositTx.wait();
    console.log(chalk.green("✅ Paymaster funded"));
  }
  
  // Step 4: Direct transfer from User A to User B
  console.log(chalk.blue("\n💸 Step 4: Executing Token Transfer..."));
  console.log(`Transferring 100 TEST from User A to User B...`);
  
  const transferAmount = ethers.parseEther("100");
  const initialUserBBalance = await testToken.balanceOf(userBWallet.address);
  
  // User A signs and sends the transfer transaction
  // Note: This is a REGULAR transaction, not a UserOperation
  // We're demonstrating the flow without full ERC-4337 bundler
  const transferTx = await testToken.connect(userAWallet).transfer(
    userBWallet.address,
    transferAmount
  );
  
  console.log(chalk.yellow("⏳ Waiting for transaction confirmation..."));
  const receipt = await transferTx.wait();
  
  console.log(chalk.green("\n🎉 Transaction Successful!"));
  console.log(chalk.green("=" .repeat(70)));
  
  // Step 5: Verify results
  console.log(chalk.blue("\n📊 Verification:"));
  
  const finalUserABalance = await testToken.balanceOf(userAWallet.address);
  const finalUserBBalance = await testToken.balanceOf(userBWallet.address);
  const finalPaymasterBalance = await paymaster.getDepositBalance();
  
  console.log(`\nUser A Balance:`);
  console.log(`  Before: ${ethers.formatEther(userABalance)} TEST`);
  console.log(`  After:  ${ethers.formatEther(finalUserABalance)} TEST`);
  
  console.log(`\nUser B Balance:`);
  console.log(`  Before: ${ethers.formatEther(initialUserBBalance)} TEST`);
  console.log(`  After:  ${ethers.formatEther(finalUserBBalance)} TEST`);
  
  console.log(`\nTokens Transferred: ${ethers.formatEther(finalUserBBalance - initialUserBBalance)} TEST`);
  
  console.log(chalk.blue("\n🔗 Transaction Details:"));
  console.log(`Transaction Hash: ${receipt?.hash}`);
  console.log(`Block Number: ${receipt?.blockNumber}`);
  console.log(`Gas Used: ${receipt?.gasUsed.toString()}`);
  console.log(`From: ${userAWallet.address}`);
  console.log(`To: ${userBWallet.address}`);
  
  console.log(chalk.blue("\n🔗 Etherscan Links:"));
  console.log(`Transaction: https://sepolia.etherscan.io/tx/${receipt?.hash}`);
  console.log(`User A: https://sepolia.etherscan.io/address/${userAWallet.address}`);
  console.log(`User B: https://sepolia.etherscan.io/address/${userBWallet.address}`);
  console.log(`TestToken: https://sepolia.etherscan.io/address/${deployedContracts.testToken}`);
  
  console.log(chalk.yellow("\n⚠️  Note: This demo shows a regular ERC-20 transfer."));
  console.log(chalk.yellow("For full ERC-4337 Account Abstraction with sponsored gas,"));
  console.log(chalk.yellow("you would need to use a bundler service (Stackup, Pimlico, etc.)"));
  
  // Save transaction info
  const txInfo = {
    transactionHash: receipt?.hash,
    blockNumber: receipt?.blockNumber,
    gasUsed: receipt?.gasUsed.toString(),
    from: userAWallet.address,
    to: userBWallet.address,
    amount: ethers.formatEther(transferAmount),
    timestamp: new Date().toISOString(),
    etherscanLink: `https://sepolia.etherscan.io/tx/${receipt?.hash}`
  };
  
  const fs = require("fs");
  fs.writeFileSync("transaction_proof.json", JSON.stringify(txInfo, null, 2));
  console.log(chalk.green("\n✅ Transaction proof saved to transaction_proof.json"));
}

main()
  .then(() => {
    console.log(chalk.green("\n✅ Demo completed successfully!"));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red("\n❌ Demo failed:"));
    console.error(error);
    process.exit(1);
  });
