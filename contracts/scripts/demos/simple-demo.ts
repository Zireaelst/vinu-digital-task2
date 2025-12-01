import hre from "hardhat";
import { readFileSync } from "fs";
import chalk from "chalk";

const { ethers } = hre;

async function main() {
  console.log(chalk.blue("🎯 ERC-4337 Sponsored Transfer Demo (Simplified)"));
  
  // Load deployed contracts
  const data = readFileSync("deployed_addresses.json", "utf8");
  const deployedContracts = JSON.parse(data);
  
  const [deployer] = await ethers.getSigners();
  
  // Get contracts
  const entryPoint = await ethers.getContractAt("IEntryPoint", deployedContracts.entryPoint);
  const factory = await ethers.getContractAt("SimpleAccountFactory", deployedContracts.simpleAccountFactory);
  const paymaster = await ethers.getContractAt("SponsorPaymaster", deployedContracts.sponsorPaymaster);
  const testToken = await ethers.getContractAt("TestToken", deployedContracts.testToken);
  
  console.log(chalk.yellow("📋 Demo Configuration:"));
  console.log(`Network: sepolia`);
  console.log(`EntryPoint: ${deployedContracts.entryPoint}`);
  console.log(`Factory: ${deployedContracts.simpleAccountFactory}`);
  console.log(`Paymaster: ${deployedContracts.sponsorPaymaster}`);
  console.log(`TestToken: ${deployedContracts.testToken}`);
  
  // Create User A wallet
  const userAWallet = new ethers.Wallet("0x4a6255d3fe1a1e5b42541697f910fbf33b04c3b6f4e4212f1064fb0f917af757", ethers.provider);
  console.log(chalk.blue("\\n👤 User Setup:"));
  console.log(`User A EOA: ${userAWallet.address}`);
  
  // Create a new salt to avoid address collision
  const salt = Math.floor(Math.random() * 1000000);
  console.log(`Using salt: ${salt}`);
  
  // Calculate new account address
  const userAccountAddress = await factory.getAddress(userAWallet.address, salt);
  console.log(`User A Account: ${userAccountAddress}`);
  
  // Check if this account exists
  const accountCode = await ethers.provider.getCode(userAccountAddress);
  const isDeployed = accountCode !== "0x";
  
  if (isDeployed) {
    console.log(chalk.yellow("⚠️  Account already exists, using different salt"));
    const newSalt = salt + 1;
    const newAccountAddress = await factory.getAddress(userAWallet.address, newSalt);
    console.log(`New Account Address: ${newAccountAddress}`);
  }
  
  // Create User B (recipient)
  const userBWallet = ethers.Wallet.createRandom();
  console.log(`User B (Recipient): ${userBWallet.address}`);
  
  console.log(chalk.blue("\\n🏗️  Creating Account via Factory..."));
  
  // Deploy account using factory
  const createAccountTx = await factory.createAccount(userAWallet.address, salt);
  const createReceipt = await createAccountTx.wait();
  console.log(chalk.green("✅ Account created via factory"));
  console.log(`Transaction: ${createReceipt?.hash}`);
  
  // Verify account is deployed
  const finalAccountCode = await ethers.provider.getCode(userAccountAddress);
  const isAccountDeployed = finalAccountCode !== "0x";
  console.log(`Account deployed: ${isAccountDeployed ? chalk.green("✅ Yes") : chalk.red("❌ No")}`);
  
  if (!isAccountDeployed) {
    console.error(chalk.red("❌ Account deployment failed"));
    process.exit(1);
  }
  
  // Get the account contract
  const account = await ethers.getContractAt("contracts/core/SimpleAccount.sol:SimpleAccount", userAccountAddress);
  
  // Verify ownership
  try {
    const owner = await account.owner();
    console.log(`Account owner: ${owner}`);
    console.log(`Expected owner: ${userAWallet.address}`);
    
    if (owner.toLowerCase() !== userAWallet.address.toLowerCase()) {
      console.error(chalk.red("❌ Owner mismatch"));
      process.exit(1);
    }
    console.log(chalk.green("✅ Ownership verified"));
  } catch (error) {
    console.error(chalk.red("❌ Could not verify ownership:"), error);
    process.exit(1);
  }
  
  console.log(chalk.blue("\\n💰 Funding Setup..."));
  
  // Mint tokens to the account
  const mintAmount = ethers.parseEther("1000");
  const mintTx = await testToken.freeMint(userAccountAddress, mintAmount);
  await mintTx.wait();
  console.log(chalk.green(`✅ Minted ${ethers.formatEther(mintAmount)} TEST tokens to account`));
  
  // Whitelist the account
  const whitelistTx = await paymaster.setWhitelist(userAccountAddress, true);
  await whitelistTx.wait();
  console.log(chalk.green("✅ Account whitelisted in paymaster"));
  
  // Ensure paymaster has funds
  const paymasterBalance = await paymaster.getDepositBalance();
  console.log(`Paymaster balance: ${ethers.formatEther(paymasterBalance)} ETH`);
  
  if (paymasterBalance < ethers.parseEther("0.005")) {
    const depositTx = await paymaster.depositForOwner({ value: ethers.parseEther("0.01") });
    await depositTx.wait();
    console.log(chalk.green("✅ Paymaster funded"));
  }
  
  console.log(chalk.blue("\\n🎯 Executing Simple Transfer (Non-AA)..."));
  
  // First, let's test a simple direct transfer to make sure everything works
  const transferAmount = ethers.parseEther("100");
  const directTransferTx = await account.execute(
    await testToken.getAddress(),
    0,
    testToken.interface.encodeFunctionData("transfer", [userBWallet.address, transferAmount])
  );
  await directTransferTx.wait();
  
  const userBBalance = await testToken.balanceOf(userBWallet.address);
  console.log(chalk.green(`✅ Direct transfer successful: ${ethers.formatEther(userBBalance)} TEST to User B`));
  
  console.log(chalk.blue("\\n🚀 Now Testing ERC-4337 UserOp..."));
  
  // Build UserOp for another transfer
  const transferAmount2 = ethers.parseEther("50");
  const nonce = await entryPoint.getNonce(userAccountAddress, 0);
  
  const callData = account.interface.encodeFunctionData("execute", [
    await testToken.getAddress(),
    0,
    testToken.interface.encodeFunctionData("transfer", [userBWallet.address, transferAmount2])
  ]);
  
  const gasPrice = await ethers.provider.getFeeData();
  const maxFeePerGas = gasPrice.maxFeePerGas || ethers.parseUnits("20", "gwei");
  const maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas || ethers.parseUnits("2", "gwei");
  
  const userOp = {
    sender: userAccountAddress,
    nonce: "0x" + nonce.toString(16),
    initCode: "0x",
    callData: callData,
    callGasLimit: "0x" + (150000).toString(16),
    verificationGasLimit: "0x" + (300000).toString(16),
    preVerificationGas: "0x" + (50000).toString(16),
    maxFeePerGas: "0x" + maxFeePerGas.toString(16),
    maxPriorityFeePerGas: "0x" + maxPriorityFeePerGas.toString(16),
    paymasterAndData: await paymaster.getAddress(),
    signature: "0x"
  };
  
  // Sign UserOp
  const userOpHash = await entryPoint.getUserOpHash(userOp);
  const signature = await userAWallet.signMessage(ethers.getBytes(userOpHash));
  userOp.signature = signature;
  
  console.log(`UserOp hash: ${userOpHash}`);
  console.log(`Signature length: ${signature.length}`);
  
  // Get initial balances
  const initialUserBBalance = await testToken.balanceOf(userBWallet.address);
  const initialPaymasterBalance = await paymaster.getDepositBalance();
  
  console.log(`Initial User B balance: ${ethers.formatEther(initialUserBBalance)} TEST`);
  console.log(`Initial Paymaster balance: ${ethers.formatEther(initialPaymasterBalance)} ETH`);
  
  try {
    // Submit UserOp
    const handleOpsTx = await entryPoint.handleOps([userOp], await deployer.getAddress());
    const receipt = await handleOpsTx.wait();
    
    console.log(chalk.green("\\n🎉 ERC-4337 UserOp executed successfully!"));
    console.log(`Transaction hash: ${receipt?.hash}`);
    console.log(`Gas used: ${receipt?.gasUsed}`);
    
    // Check final balances
    const finalUserBBalance = await testToken.balanceOf(userBWallet.address);
    const finalPaymasterBalance = await paymaster.getDepositBalance();
    
    console.log(chalk.blue("\\n📊 Final Results:"));
    console.log(`Final User B balance: ${ethers.formatEther(finalUserBBalance)} TEST`);
    console.log(`Final Paymaster balance: ${ethers.formatEther(finalPaymasterBalance)} ETH`);
    
    const tokensTransferred = finalUserBBalance - initialUserBBalance;
    const gasPaid = initialPaymasterBalance - finalPaymasterBalance;
    
    console.log(chalk.green("\\n✅ SUCCESS SUMMARY:"));
    console.log(`💸 Tokens transferred via AA: ${ethers.formatEther(tokensTransferred)} TEST`);
    console.log(`⛽ Gas paid by paymaster: ${ethers.formatEther(gasPaid)} ETH`);
    console.log(`🎯 User paid: 0 ETH (Sponsored!)`);
    
    console.log(chalk.blue("\\n🔗 Etherscan Links:"));
    console.log(`Transaction: https://sepolia.etherscan.io/tx/${receipt?.hash}`);
    console.log(`User Account: https://sepolia.etherscan.io/address/${userAccountAddress}`);
    
  } catch (error: any) {
    console.error(chalk.red("❌ UserOp execution failed:"));
    console.error(error.message);
    
    if (error.data) {
      console.log("Error data:", error.data);
    }
  }
}

main()
  .then(() => {
    console.log(chalk.green("\\n🎊 Demo completed!"));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red("❌ Demo failed:"));
    console.error(error);
    process.exit(1);
  });