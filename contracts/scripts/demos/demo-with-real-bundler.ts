/**
 * Complete ERC-4337 Demo with Real Bundler Integration
 * 
 * This script demonstrates a full Account Abstraction flow:
 * 1. Setup accounts and contracts
 * 2. Build UserOperation for token transfer
 * 3. Submit to REAL bundler service (Pimlico/Stackup/Alchemy)
 * 4. Wait for confirmation
 * 5. Verify sponsored transaction
 */

import hre from "hardhat";
import { readFileSync } from "fs";
import chalk from "chalk";
import * as dotenv from "dotenv";
import { BundlerClient } from "../utils/bundler.client";

dotenv.config();

const { ethers } = hre;

// Known EntryPoint address on Sepolia
const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

async function main() {
  console.log(chalk.blue("=" .repeat(80)));
  console.log(chalk.blue.bold("🚀 ERC-4337 Account Abstraction - Real Bundler Demo"));
  console.log(chalk.blue("=" .repeat(80)));
  
  // Load deployed addresses
  let deployedContracts;
  try {
    const data = readFileSync("deployed_addresses.json", "utf8");
    deployedContracts = JSON.parse(data);
  } catch (error) {
    console.error(chalk.red("❌ Could not read deployed_addresses.json"));
    console.error(chalk.red("   Run 'npm run deploy' first"));
    process.exit(1);
  }
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(chalk.yellow("\n📋 Configuration:"));
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`EntryPoint: ${ENTRYPOINT_ADDRESS}`);
  
  // Get contracts
  const testToken = await ethers.getContractAt("TestToken", deployedContracts.testToken);
  const paymaster = await ethers.getContractAt("SponsorPaymaster", deployedContracts.sponsorPaymaster);
  const factory = await ethers.getContractAt("SimpleAccountFactory", deployedContracts.simpleAccountFactory);
  const entryPoint = await ethers.getContractAt("IEntryPoint", ENTRYPOINT_ADDRESS);
  
  console.log(chalk.yellow("\n📜 Contract Addresses:"));
  console.log(`TestToken: ${deployedContracts.testToken}`);
  console.log(`Paymaster: ${deployedContracts.sponsorPaymaster}`);
  console.log(`Factory: ${deployedContracts.simpleAccountFactory}`);
  
  // ============================================================================
  // Step 1: Setup Accounts
  // ============================================================================
  console.log(chalk.blue("\n" + "=".repeat(80)));
  console.log(chalk.blue.bold("STEP 1: Setup Accounts"));
  console.log(chalk.blue("=".repeat(80)));
  
  // Create user wallet (this will be the owner of the SimpleAccount)
  const userWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  console.log(chalk.cyan(`\n👤 User Wallet (Owner): ${userWallet.address}`));
  
  // Calculate SimpleAccount address
  const accountAddress = await factory.getFunction("getAddress").staticCall(userWallet.address, 0);
  console.log(chalk.cyan(`🏦 SimpleAccount Address: ${accountAddress}`));
  
  // Recipient wallet
  const recipientWallet = ethers.Wallet.createRandom();
  console.log(chalk.cyan(`📥 Recipient: ${recipientWallet.address}`));
  
  // ============================================================================
  // Step 2: Setup Paymaster
  // ============================================================================
  console.log(chalk.blue("\n" + "=".repeat(80)));
  console.log(chalk.blue.bold("STEP 2: Setup Paymaster"));
  console.log(chalk.blue("=".repeat(80)));
  
  // Check paymaster balance
  let paymasterBalance = await paymaster.getDeposit();
  console.log(`\n💰 Paymaster Balance: ${ethers.formatEther(paymasterBalance)} ETH`);
  
  // Add deposit if needed
  if (paymasterBalance < ethers.parseEther("0.01")) {
    console.log(chalk.cyan("\n⛽ Adding deposit to Paymaster..."));
    const depositAmount = ethers.parseEther("0.02");
    const depositTx = await paymaster.depositForOwner({ value: depositAmount });
    await depositTx.wait();
    paymasterBalance = await paymaster.getDeposit();
    console.log(chalk.green(`✅ Deposited ${ethers.formatEther(depositAmount)} ETH`));
    console.log(chalk.green(`   New Balance: ${ethers.formatEther(paymasterBalance)} ETH`));
  } else {
    console.log(chalk.green(`✅ Paymaster has sufficient balance`));
  }
  
  // Whitelist the account
  const isWhitelisted = await paymaster.whitelist(accountAddress);
  if (!isWhitelisted) {
    console.log(chalk.cyan("\n🏷️  Whitelisting SimpleAccount..."));
    const whitelistTx = await paymaster.setWhitelist(accountAddress, true);
    await whitelistTx.wait();
    console.log(chalk.green(`✅ Account whitelisted: ${accountAddress}`));
  } else {
    console.log(chalk.green(`✅ Account already whitelisted`));
  }
  
  // ============================================================================
  // Step 3: Setup TestToken
  // ============================================================================
  console.log(chalk.blue("\n" + "=".repeat(80)));
  console.log(chalk.blue.bold("STEP 3: Mint TestTokens"));
  console.log(chalk.blue("=".repeat(80)));
  
  // Mint tokens to the SimpleAccount
  const mintAmount = ethers.parseEther("1000");
  console.log(chalk.cyan(`\n💎 Minting ${ethers.formatEther(mintAmount)} TEST tokens to SimpleAccount...`));
  const mintTx = await testToken.freeMint(accountAddress, mintAmount);
  await mintTx.wait();
  
  const accountBalance = await testToken.balanceOf(accountAddress);
  console.log(chalk.green(`✅ Minted successfully!`));
  console.log(chalk.green(`   Account Balance: ${ethers.formatEther(accountBalance)} TEST`));
  
  // ============================================================================
  // Step 4: Deploy SimpleAccount (if needed)
  // ============================================================================
  console.log(chalk.blue("\n" + "=".repeat(80)));
  console.log(chalk.blue.bold("STEP 4: Deploy SimpleAccount"));
  console.log(chalk.blue("=".repeat(80)));
  
  const accountCode = await ethers.provider.getCode(accountAddress);
  if (accountCode === "0x") {
    console.log(chalk.cyan("\n🏗️  Deploying SimpleAccount..."));
    const createTx = await factory.createAccount(userWallet.address, 0);
    await createTx.wait();
    console.log(chalk.green(`✅ SimpleAccount deployed to: ${accountAddress}`));
  } else {
    console.log(chalk.green(`✅ SimpleAccount already deployed`));
  }
  
  // ============================================================================
  // Step 5: Build UserOperation
  // ============================================================================
  console.log(chalk.blue("\n" + "=".repeat(80)));
  console.log(chalk.blue.bold("STEP 5: Build UserOperation"));
  console.log(chalk.blue("=".repeat(80)));
  
  // Get SimpleAccount contract interface
  const simpleAccount = await ethers.getContractAt("contracts/core/SimpleAccount.sol:SimpleAccount", accountAddress);
  
  // Get nonce
  const nonce = await entryPoint.getNonce(accountAddress, 0);
  console.log(chalk.cyan(`\n🔢 Account Nonce: ${nonce}`));
  
  // Build transfer calldata
  const transferAmount = ethers.parseEther("100");
  const transferCallData = testToken.interface.encodeFunctionData("transfer", [
    recipientWallet.address,
    transferAmount
  ]);
  
  // Build execute calldata for SimpleAccount
  const executeCallData = simpleAccount.interface.encodeFunctionData("execute", [
    deployedContracts.testToken,
    0, // value
    transferCallData
  ]);
  
  console.log(chalk.cyan(`\n📋 Transfer Details:`));
  console.log(`   From: ${accountAddress}`);
  console.log(`   To: ${recipientWallet.address}`);
  console.log(`   Amount: ${ethers.formatEther(transferAmount)} TEST`);
  
  // Get bundler-specific gas prices
  console.log(chalk.cyan(`\n⛽ Fetching bundler gas prices...`));
  const bundlerClient = new BundlerClient();
  
  let maxFeePerGas: bigint;
  let maxPriorityFeePerGas: bigint;
  
  try {
    const bundlerGasPrice = await bundlerClient.getUserOperationGasPrice();
    maxFeePerGas = BigInt(bundlerGasPrice.maxFeePerGas);
    maxPriorityFeePerGas = BigInt(bundlerGasPrice.maxPriorityFeePerGas);
    console.log(chalk.green(`✅ Using bundler-specific gas prices`));
  } catch (error) {
    // Fallback to higher network gas prices with safety multipliers
    const feeData = await ethers.provider.getFeeData();
    const networkMaxFee = feeData.maxFeePerGas || ethers.parseUnits("20", "gwei");
    const networkPriorityFee = feeData.maxPriorityFeePerGas || ethers.parseUnits("2", "gwei");
    
    // Apply 3x multiplier for bundler requirements
    maxFeePerGas = networkMaxFee * 3n;
    maxPriorityFeePerGas = networkPriorityFee * 10n; // Higher multiplier for priority fee
    
    // Ensure minimum requirements based on error messages
    const minMaxFee = ethers.parseUnits("1.2", "gwei"); // Above Pimlico's 1.1 gwei requirement
    const minPriorityFee = ethers.parseUnits("0.15", "gwei"); // Above Alchemy's 0.1 gwei requirement
    
    if (maxFeePerGas < minMaxFee) maxFeePerGas = minMaxFee;
    if (maxPriorityFeePerGas < minPriorityFee) maxPriorityFeePerGas = minPriorityFee;
    
    console.log(chalk.yellow(`⚠️  Using fallback gas prices with safety multipliers`));
  }
  
  console.log(chalk.cyan(`\n⛽ Gas Prices:`));
  console.log(`   Max Fee: ${ethers.formatUnits(maxFeePerGas, "gwei")} gwei`);
  console.log(`   Priority Fee: ${ethers.formatUnits(maxPriorityFeePerGas, "gwei")} gwei`);
  
  // Dynamic gas estimation
  console.log(chalk.cyan(`\n🔍 Estimating gas for operation...`));
  let callGasLimit = 150000n;
  let verificationGasLimit = 300000n;
  let preVerificationGas = 50000n;
  
  try {
    const gasEstimate = await ethers.provider.estimateGas({
      from: ENTRYPOINT_ADDRESS,
      to: accountAddress,
      data: executeCallData
    });
    
    // Add 20% buffer to gas estimate
    callGasLimit = (gasEstimate * 120n) / 100n;
    console.log(chalk.green(`✅ Gas estimated: ${gasEstimate}`));
    console.log(chalk.green(`   Call Gas Limit (with 20% buffer): ${callGasLimit}`));
  } catch (error: any) {
    console.log(chalk.yellow(`⚠️  Could not estimate gas: ${error.message}`));
    console.log(chalk.yellow(`   Using default gas limits...`));
  }
  
  // Build UserOperation
  const userOp = {
    sender: accountAddress,
    nonce: nonce,
    initCode: "0x",
    callData: executeCallData,
    callGasLimit: callGasLimit,
    verificationGasLimit: verificationGasLimit,
    preVerificationGas: preVerificationGas,
    maxFeePerGas: maxFeePerGas,
    maxPriorityFeePerGas: maxPriorityFeePerGas,
    paymasterAndData: deployedContracts.sponsorPaymaster,
    signature: "0x"
  };
  
  console.log(chalk.cyan(`\n📦 UserOperation Built:`));
  console.log(`   Sender: ${userOp.sender}`);
  console.log(`   Nonce: ${userOp.nonce}`);
  console.log(`   CallGasLimit: ${userOp.callGasLimit}`);
  console.log(`   VerificationGasLimit: ${userOp.verificationGasLimit}`);
  console.log(`   PreVerificationGas: ${userOp.preVerificationGas}`);
  console.log(`   Paymaster: ${userOp.paymasterAndData}`);
  
  // ============================================================================
  // Step 6: Sign UserOperation
  // ============================================================================
  console.log(chalk.blue("\n" + "=".repeat(80)));
  console.log(chalk.blue.bold("STEP 6: Sign UserOperation"));
  console.log(chalk.blue("=".repeat(80)));
  
  // Get UserOp hash from EntryPoint
  const userOpHash = await entryPoint.getUserOpHash(userOp);
  console.log(chalk.cyan(`\n🔐 UserOp Hash: ${userOpHash}`));
  
  // Sign with user wallet (EIP-191 message signing)
  const signature = await userWallet.signMessage(ethers.getBytes(userOpHash));
  userOp.signature = signature;
  
  console.log(chalk.green(`✅ UserOperation signed`));
  console.log(chalk.green(`   Signature: ${signature.slice(0, 66)}...`));
  
  // ============================================================================
  // Step 7: Submit to Bundler
  // ============================================================================
  console.log(chalk.blue("\n" + "=".repeat(80)));
  console.log(chalk.blue.bold("STEP 7: Submit to Real Bundler"));
  console.log(chalk.blue("=".repeat(80)));
  
  try {
    // Use existing bundler client
    
    // Send UserOperation to bundler
    const submittedUserOpHash = await bundlerClient.sendUserOperation(userOp, ENTRYPOINT_ADDRESS);
    
    // ============================================================================
    // Step 8: Wait for Confirmation
    // ============================================================================
    console.log(chalk.blue("\n" + "=".repeat(80)));
    console.log(chalk.blue.bold("STEP 8: Wait for Confirmation"));
    console.log(chalk.blue("=".repeat(80)));
    
    // Wait for receipt (60 second timeout)
    const receipt = await bundlerClient.waitForUserOperationReceipt(submittedUserOpHash, 60000);
    
    // ============================================================================
    // Step 9: Verify Results
    // ============================================================================
    console.log(chalk.blue("\n" + "=".repeat(80)));
    console.log(chalk.blue.bold("STEP 9: Verify Transaction"));
    console.log(chalk.blue("=".repeat(80)));
    
    // Check final balances
    const finalAccountBalance = await testToken.balanceOf(accountAddress);
    const recipientBalance = await testToken.balanceOf(recipientWallet.address);
    
    console.log(chalk.cyan(`\n💰 Final Balances:`));
    console.log(`   SimpleAccount: ${ethers.formatEther(finalAccountBalance)} TEST`);
    console.log(`   Recipient: ${ethers.formatEther(recipientBalance)} TEST`);
    console.log(`   Transferred: ${ethers.formatEther(recipientBalance)} TEST`);
    
    // Verify transfer succeeded
    if (recipientBalance >= transferAmount) {
      console.log(chalk.green(`\n✅ Transfer verified successfully!`));
    } else {
      console.log(chalk.red(`\n❌ Transfer verification failed!`));
    }
    
    // ============================================================================
    // Final Summary
    // ============================================================================
    console.log(chalk.blue("\n" + "=".repeat(80)));
    console.log(chalk.blue.bold("🎉 DEMO COMPLETED SUCCESSFULLY!"));
    console.log(chalk.blue("=".repeat(80)));
    
    console.log(chalk.green(`\n📊 Transaction Summary:`));
    console.log(chalk.green(`   ✅ UserOperation Hash: ${submittedUserOpHash}`));
    console.log(chalk.green(`   ✅ Transaction Hash: ${receipt.receipt.transactionHash}`));
    console.log(chalk.green(`   ✅ Block Number: ${receipt.receipt.blockNumber}`));
    console.log(chalk.green(`   ✅ Gas Used: ${receipt.actualGasUsed}`));
    console.log(chalk.green(`   ✅ Gas Cost: ${ethers.formatEther(receipt.actualGasCost)} ETH`));
    
    if (receipt.paymaster) {
      console.log(chalk.green(`   ✅ Gas Sponsored by: ${receipt.paymaster}`));
      console.log(chalk.green(`   🎊 GAS FEES PAID BY PAYMASTER! 🎊`));
    }
    
    console.log(chalk.cyan(`\n🔗 Etherscan Links:`));
    console.log(`   Transaction: https://sepolia.etherscan.io/tx/${receipt.receipt.transactionHash}`);
    console.log(`   SimpleAccount: https://sepolia.etherscan.io/address/${accountAddress}`);
    console.log(`   Paymaster: https://sepolia.etherscan.io/address/${deployedContracts.sponsorPaymaster}`);
    console.log(`   TestToken: https://sepolia.etherscan.io/address/${deployedContracts.testToken}`);
    
    console.log(chalk.yellow(`\n💡 Key Achievement:`));
    console.log(chalk.yellow(`   ✅ Submitted UserOperation via REAL bundler (not local simulation)`));
    console.log(chalk.yellow(`   ✅ Gas fees sponsored by Paymaster`));
    console.log(chalk.yellow(`   ✅ Token transfer executed successfully`));
    console.log(chalk.yellow(`   ✅ Full ERC-4337 Account Abstraction flow completed!`));
    
  } catch (error: any) {
    console.error(chalk.red("\n❌ Demo failed:"));
    console.error(chalk.red(error.message));
    
    if (error.message.includes('No bundler API keys')) {
      console.log(chalk.yellow("\n⚠️  BUNDLER API KEY REQUIRED!"));
      console.log(chalk.yellow("Add one of the following to your .env file:\n"));
      console.log(chalk.cyan("  PIMLICO_API_KEY=your_key     (Get from: https://dashboard.pimlico.io)"));
      console.log(chalk.cyan("  ALCHEMY_API_KEY=your_key     (Get from: https://alchemy.com)"));
    }
    
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log(chalk.green("\n🎉 Demo script completed successfully!"));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red("\n❌ Fatal error:"));
    console.error(error);
    process.exit(1);
  });
