import { ethers } from "hardhat";
import { readFileSync } from "fs";
import chalk from "chalk";
import * as dotenv from "dotenv";

dotenv.config();

interface DeployedContracts {
  entryPoint: string;
  simpleAccountFactory: string;
  sponsorPaymaster: string;
  testToken: string;
  deployedAt: string;
  network: string;
  deployer: string;
}

interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

async function main() {
  console.log(chalk.blue("🎯 Starting ERC-4337 Sponsored Transfer Demo..."));
  
  // 1. Load deployed addresses
  let deployedContracts: DeployedContracts;
  try {
    const data = readFileSync("deployed_addresses.json", "utf8");
    deployedContracts = JSON.parse(data);
  } catch (error) {
    console.error(chalk.red("❌ Could not read deployed_addresses.json"));
    console.error("Run deployment first: npm run deploy");
    process.exit(1);
  }
  
  console.log(chalk.yellow("📋 Demo Configuration:"));
  console.log(`Network: ${deployedContracts.network}`);
  console.log(`EntryPoint: ${deployedContracts.entryPoint}`);
  console.log(`Factory: ${deployedContracts.simpleAccountFactory}`);
  console.log(`Paymaster: ${deployedContracts.sponsorPaymaster}`);
  console.log(`TestToken: ${deployedContracts.testToken}`);
  
  // Get contracts
  const [deployer] = await ethers.getSigners();
  
  const entryPoint = await ethers.getContractAt("IEntryPoint", deployedContracts.entryPoint);
  const factory = await ethers.getContractAt("SimpleAccountFactory", deployedContracts.simpleAccountFactory);
  const paymaster = await ethers.getContractAt("SponsorPaymaster", deployedContracts.sponsorPaymaster);
  const testToken = await ethers.getContractAt("TestToken", deployedContracts.testToken);
  
  console.log(chalk.blue("\\n👤 Setting up User A (Wallet Owner)..."));
  
  // 2. Create User A wallet (or load from env)
  const userAPrivateKey = process.env.TEST_USER_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey;
  const userAWallet = new ethers.Wallet(userAPrivateKey, ethers.provider);
  const userAAddress = userAWallet.address;
  
  console.log(`User A EOA: ${userAAddress}`);
  
  // 3. Calculate User A's Account (Smart Contract Wallet) address
  const salt = 0; // Simple salt for deterministic address
  const userAAccountAddress = await factory.getAddress(userAAddress, salt);
  console.log(`User A Account (AA): ${userAAccountAddress}`);
  
  // Check if account is already deployed
  const accountCode = await ethers.provider.getCode(userAAccountAddress);
  const isAccountDeployed = accountCode !== "0x";
  console.log(`Account deployed: ${isAccountDeployed ? "✅ Yes" : "❌ No (will be deployed in UserOp)"}`);
  
  // 4. Setup User B (Recipient)
  const userBWallet = ethers.Wallet.createRandom();
  const userBAddress = userBWallet.address;
  console.log(`User B (Recipient): ${userBAddress}`);
  
  console.log(chalk.blue("\\n💰 Funding and Token Setup..."));
  
  // 5. Mint tokens to User A's Account
  const mintAmount = ethers.parseEther("1000"); // 1000 TEST tokens
  console.log(`Minting ${ethers.formatEther(mintAmount)} TEST tokens to User A's Account...`);
  
  const mintTx = await testToken.freeMint(userAAccountAddress, mintAmount);
  await mintTx.wait();
  console.log(chalk.green("✅ Tokens minted successfully"));
  
  // Check balances
  const accountBalance = await testToken.balanceOf(userAAccountAddress);
  console.log(`User A Account Balance: ${ethers.formatEther(accountBalance)} TEST`);
  
  // 6. Ensure User A Account is whitelisted in Paymaster
  console.log(chalk.blue("\\n🏷️  Paymaster Setup..."));
  
  const isWhitelisted = await paymaster.isWhitelisted(userAAccountAddress);
  if (!isWhitelisted) {
    console.log("Adding User A Account to whitelist...");
    const whitelistTx = await paymaster.setWhitelist(userAAccountAddress, true);
    await whitelistTx.wait();
    console.log(chalk.green("✅ User A Account whitelisted"));
  } else {
    console.log(chalk.green("✅ User A Account already whitelisted"));
  }
  
  // Check paymaster deposit
  const paymasterBalance = await paymaster.getDepositBalance();
  console.log(`Paymaster Balance: ${ethers.formatEther(paymasterBalance)} ETH`);
  
  if (paymasterBalance < ethers.parseEther("0.01")) {
    console.log("Adding deposit to Paymaster...");
    const depositTx = await paymaster.depositForOwner({ value: ethers.parseEther("0.05") });
    await depositTx.wait();
    console.log(chalk.green("✅ Paymaster funded"));
  }
  
  console.log(chalk.blue("\\n🔨 Constructing UserOperation..."));
  
  // 7. Build UserOperation
  const transferAmount = ethers.parseEther("100"); // Transfer 100 TEST tokens
  console.log(`Transfer Amount: ${ethers.formatEther(transferAmount)} TEST`);
  
  // Encode the transfer call
  const transferCallData = testToken.interface.encodeFunctionData("transfer", [
    userBAddress,
    transferAmount
  ]);
  
  // Get current nonce
  const nonce = await entryPoint.getNonce(userAAccountAddress, 0);
  console.log(`Account Nonce: ${nonce}`);
  
  // Build initCode (only if account not deployed)
  let initCode = "0x";
  if (!isAccountDeployed) {
    const createAccountCall = factory.interface.encodeFunctionData("createAccount", [
      userAAddress,
      salt
    ]);
    initCode = ethers.concat([
      deployedContracts.simpleAccountFactory,
      createAccountCall
    ]);
  }
  console.log(`InitCode: ${initCode === "0x" ? "Empty (account exists)" : "Deployment code"}`);
  
  // Build callData for the account
  let callData: string;
  if (isAccountDeployed) {
    // Account exists, call execute directly
    const account = await ethers.getContractAt("contracts/core/SimpleAccount.sol:SimpleAccount", userAAccountAddress);
    callData = account.interface.encodeFunctionData("execute", [
      await testToken.getAddress(),
      0, // value
      transferCallData
    ]);
  } else {
    // Account will be deployed, but we still need execute callData for after deployment
    // The SimpleAccount contract will be created and then we call execute on it
    // For now, we'll use a placeholder and update after deployment
    const simpleAccountInterface = await ethers.getContractFactory("contracts/core/SimpleAccount.sol:SimpleAccount");
    callData = simpleAccountInterface.interface.encodeFunctionData("execute", [
      await testToken.getAddress(),
      0,
      transferCallData
    ]);
  }
  
  // Gas estimation (using realistic values for Sepolia)
  const gasPrice = await ethers.provider.getFeeData();
  const maxFeePerGas = gasPrice.maxFeePerGas || ethers.parseUnits("20", "gwei");
  const maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas || ethers.parseUnits("2", "gwei");
  
  // Build UserOperation
  const userOp: UserOperation = {
    sender: userAAccountAddress,
    nonce: "0x" + nonce.toString(16),
    initCode: initCode,
    callData: callData,
    callGasLimit: "0x" + (200000).toString(16), // 200k gas for execution
    verificationGasLimit: "0x" + (400000).toString(16), // 400k gas for verification
    preVerificationGas: "0x" + (50000).toString(16), // 50k gas for pre-verification
    maxFeePerGas: "0x" + maxFeePerGas.toString(16),
    maxPriorityFeePerGas: "0x" + maxPriorityFeePerGas.toString(16),
    paymasterAndData: await paymaster.getAddress(), // Just paymaster address for now
    signature: "0x" // Will be filled after signing
  };
  
  console.log(chalk.blue("\\n✍️  Signing UserOperation..."));
  
  // 8. Sign UserOperation
  const userOpHash = await entryPoint.getUserOpHash(userOp);
  console.log(`UserOp Hash: ${userOpHash}`);
  
  // Sign the hash with User A's private key
  const signature = await userAWallet.signMessage(ethers.getBytes(userOpHash));
  userOp.signature = signature;
  
  console.log(`Signature: ${signature.slice(0, 20)}...${signature.slice(-20)}`);
  
  console.log(chalk.blue("\\n🚀 Executing Sponsored Transaction..."));
  
  // 9. Submit UserOperation to EntryPoint
  console.log("Submitting UserOp to EntryPoint...");
  
  // Get initial balances for verification
  const initialUserBBalance = await testToken.balanceOf(userBAddress);
  const initialPaymasterBalance = await paymaster.getDepositBalance();
  
  console.log(`Initial User B Balance: ${ethers.formatEther(initialUserBBalance)} TEST`);
  console.log(`Initial Paymaster Balance: ${ethers.formatEther(initialPaymasterBalance)} ETH`);
  
  try {
    // Execute through EntryPoint
    const handleOpsTx = await entryPoint.handleOps([userOp], await deployer.getAddress());
    const receipt = await handleOpsTx.wait();
    
    console.log(chalk.green("\\n🎉 Transaction executed successfully!"));
    console.log(`Transaction Hash: ${receipt?.hash}`);
    console.log(`Gas Used: ${receipt?.gasUsed}`);
    
    // Verify results
    console.log(chalk.blue("\\n📊 Verifying Results..."));
    
    const finalUserBBalance = await testToken.balanceOf(userBAddress);
    const finalPaymasterBalance = await paymaster.getDepositBalance();
    const finalAccountBalance = await testToken.balanceOf(userAAccountAddress);
    
    console.log(`Final User B Balance: ${ethers.formatEther(finalUserBBalance)} TEST`);
    console.log(`Final User A Account Balance: ${ethers.formatEther(finalAccountBalance)} TEST`);
    console.log(`Final Paymaster Balance: ${ethers.formatEther(finalPaymasterBalance)} ETH`);
    
    const tokensTransferred = finalUserBBalance - initialUserBBalance;
    const gasSponsoredByPaymaster = initialPaymasterBalance - finalPaymasterBalance;
    
    console.log(chalk.green("\\n✅ DEMO RESULTS:"));
    console.log(`💸 Tokens Transferred: ${ethers.formatEther(tokensTransferred)} TEST`);
    console.log(`⛽ Gas Sponsored by Paymaster: ${ethers.formatEther(gasSponsoredByPaymaster)} ETH`);
    console.log(`🎯 Account Deployment: ${!isAccountDeployed ? "✅ Success" : "N/A (already deployed)"}`);
    console.log(`💳 Paymaster Sponsorship: ✅ Success`);
    
    console.log(chalk.blue("\\n🔗 Etherscan Links:"));
    console.log(`Transaction: https://sepolia.etherscan.io/tx/${receipt?.hash}`);
    console.log(`User A Account: https://sepolia.etherscan.io/address/${userAAccountAddress}`);
    console.log(`User B Address: https://sepolia.etherscan.io/address/${userBAddress}`);
    
  } catch (error: any) {
    console.error(chalk.red("❌ Transaction failed:"));
    console.error(error);
    
    // Try to decode error
    if (error.data) {
      try {
        const decodedError = entryPoint.interface.parseError(error.data);
        console.error(`Decoded Error: ${decodedError?.name}`);
      } catch (decodeErr) {
        console.error("Could not decode error");
      }
    }
    
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log(chalk.green("\\n🎊 ERC-4337 Demo completed successfully!"));
    console.log(chalk.yellow("\\nKey Achievement: Gas fees sponsored by Paymaster! 🎯"));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red("❌ Demo failed:"));
    console.error(error);
    process.exit(1);
  });