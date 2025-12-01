import hre from "hardhat";
const { ethers } = hre;

async function demonstrateMetaTx() {
  console.log("🚀 Starting ERC-4337 Meta Transaction Demonstration");
  console.log("=".repeat(60));

  // Contract addresses from deployment
  const ENTRY_POINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
  const FACTORY = "0x9C12C19B00cAA9c7c23383F399924d26A0E06fDc";
  const PAYMASTER = "0x61d222f1e0386a7Af71C865fF83Ad4CEd1131011";
  const TEST_TOKEN = "0xab230E033D846Add5367Eb48BdCC4928259239a8";
  const SIMPLE_ACCOUNT = "0xe6C10E95f8AEF841e766018Cd08944602Bc7EFC2";

  console.log("📋 Contract Addresses:");
  console.log("EntryPoint:", ENTRY_POINT);
  console.log("Factory:", FACTORY);
  console.log("Paymaster:", PAYMASTER);
  console.log("TestToken:", TEST_TOKEN);
  console.log("SimpleAccount:", SIMPLE_ACCOUNT);
  console.log();

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Accounts:");
  console.log("Deployer/Sponsor:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Create recipient address (B wallet)
  const recipientWallet = ethers.Wallet.createRandom();
  const recipient = recipientWallet.address;
  console.log("Recipient (B):", recipient);
  console.log();

  try {
    // 1. Verify SimpleAccount exists and is properly configured
    console.log("🧪 Step 1: Verify SimpleAccount");
    const accountCode = await ethers.provider.getCode(SIMPLE_ACCOUNT);
    if (accountCode === "0x") {
      throw new Error("SimpleAccount not deployed!");
    }
    console.log("✅ SimpleAccount deployed and has code");

    // Check account owner
    const accountInterface = new ethers.Interface([
      "function owner() view returns (address)",
      "function entryPoint() view returns (address)"
    ]);
    
    const ownerResult = await ethers.provider.call({
      to: SIMPLE_ACCOUNT,
      data: accountInterface.encodeFunctionData("owner")
    });
    const owner = accountInterface.decodeFunctionResult("owner", ownerResult)[0];
    console.log("Account Owner:", owner);

    const entryPointResult = await ethers.provider.call({
      to: SIMPLE_ACCOUNT,
      data: accountInterface.encodeFunctionData("entryPoint")
    });
    const entryPoint = accountInterface.decodeFunctionResult("entryPoint", entryPointResult)[0];
    console.log("Account EntryPoint:", entryPoint);
    console.log();

    // 2. Check TestToken and mint to SimpleAccount
    console.log("🧪 Step 2: Setup TestToken");
    const tokenInterface = new ethers.Interface([
      "function name() view returns (string)",
      "function symbol() view returns (string)", 
      "function decimals() view returns (uint8)",
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address, uint256) returns (bool)",
      "function totalSupply() view returns (uint256)"
    ]);
    
    // Get token info
    const nameResult = await ethers.provider.call({
      to: TEST_TOKEN,
      data: tokenInterface.encodeFunctionData("name")
    });
    const tokenName = tokenInterface.decodeFunctionResult("name", nameResult)[0];

    const symbolResult = await ethers.provider.call({
      to: TEST_TOKEN,
      data: tokenInterface.encodeFunctionData("symbol")
    });
    const tokenSymbol = tokenInterface.decodeFunctionResult("symbol", symbolResult)[0];

    const decimalsResult = await ethers.provider.call({
      to: TEST_TOKEN,
      data: tokenInterface.encodeFunctionData("decimals")
    });
    const decimals = tokenInterface.decodeFunctionResult("decimals", decimalsResult)[0];
    
    console.log(`Token: ${tokenName} (${tokenSymbol}), Decimals: ${decimals}`);

    // Check if SimpleAccount has tokens
    const balanceResult = await ethers.provider.call({
      to: TEST_TOKEN,
      data: tokenInterface.encodeFunctionData("balanceOf", [SIMPLE_ACCOUNT])
    });
    const accountBalance = tokenInterface.decodeFunctionResult("balanceOf", balanceResult)[0];
    console.log("SimpleAccount token balance:", ethers.formatUnits(accountBalance, decimals));

    if (accountBalance === 0n) {
      console.log("⏳ Transferring tokens to SimpleAccount...");
      const transferAmount = ethers.parseUnits("1000", decimals);
      const transferData = tokenInterface.encodeFunctionData("transfer", [SIMPLE_ACCOUNT, transferAmount]);
      
      const transferTx = await deployer.sendTransaction({
        to: TEST_TOKEN,
        data: transferData
      });
      await transferTx.wait();
      console.log("✅ Tokens transferred to SimpleAccount");
    }

    const newBalanceResult = await ethers.provider.call({
      to: TEST_TOKEN,
      data: tokenInterface.encodeFunctionData("balanceOf", [SIMPLE_ACCOUNT])
    });
    const newBalance = tokenInterface.decodeFunctionResult("balanceOf", newBalanceResult)[0];
    console.log("SimpleAccount updated balance:", ethers.formatUnits(newBalance, decimals));
    console.log();

    // 3. Check Paymaster funding
    console.log("🧪 Step 3: Verify Paymaster");
    const paymasterBalance = await ethers.provider.getBalance(PAYMASTER);
    console.log("Paymaster ETH balance:", ethers.formatEther(paymasterBalance), "ETH");
    
    if (paymasterBalance < ethers.parseEther("0.01")) {
      console.log("⏳ Funding paymaster...");
      const fundTx = await deployer.sendTransaction({
        to: PAYMASTER,
        value: ethers.parseEther("0.1")
      });
      await fundTx.wait();
      console.log("✅ Paymaster funded");
    }
    console.log();

    // 4. Prepare transfer transaction
    console.log("🧪 Step 4: Prepare Token Transfer");
    const transferAmount = ethers.parseUnits("10", decimals);
    console.log("Transfer amount:", ethers.formatUnits(transferAmount, decimals), tokenSymbol);
    console.log("From:", SIMPLE_ACCOUNT);
    console.log("To:", recipient);

    // Encode transfer call
    const transferCallData = tokenInterface.encodeFunctionData("transfer", [
      recipient,
      transferAmount
    ]);
    console.log("Transfer call data length:", transferCallData.length);

    // Encode execute call for SimpleAccount
    const executeCallData = ethers.concat([
      "0xb61d27f6", // execute(address,uint256,bytes) selector
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bytes"],
        [TEST_TOKEN, 0, transferCallData]
      )
    ]);
    console.log("Execute call data prepared");
    console.log();

    // 5. Create UserOperation (simplified version)
    console.log("🧪 Step 5: UserOperation Structure");
    const userOp = {
      sender: SIMPLE_ACCOUNT,
      nonce: "0x0", // Start with nonce 0
      initCode: "0x", // Account already deployed
      callData: executeCallData,
      callGasLimit: "0x186A0", // 100k gas
      verificationGasLimit: "0x186A0", // 100k gas
      preVerificationGas: "0x5208", // 21k gas
      maxFeePerGas: "0x59682F00", // 1.5 gwei
      maxPriorityFeePerGas: "0x3B9ACA00", // 1 gwei
      paymasterAndData: PAYMASTER, // Use paymaster for gas sponsorship
      signature: "0x" // Will be filled by wallet
    };

    console.log("UserOperation created:");
    console.log("- Sender:", userOp.sender);
    console.log("- Nonce:", userOp.nonce);
    console.log("- CallData length:", userOp.callData.length);
    console.log("- Paymaster:", userOp.paymasterAndData);
    console.log();

    // 6. Success summary
    console.log("🎉 Meta Transaction Demo Setup Complete!");
    console.log("=".repeat(60));
    console.log("✅ SimpleAccount deployed and configured");
    console.log("✅ TestToken ready with balance");
    console.log("✅ Paymaster funded for gas sponsorship");
    console.log("✅ UserOperation structure prepared");
    console.log();
    console.log("🔗 Next Steps:");
    console.log("1. Use bundler to estimate gas");
    console.log("2. Sign UserOperation with account owner");
    console.log("3. Submit to bundler for execution");
    console.log("4. Gas will be paid by sponsor:", deployer.address);
    console.log();

    return {
      success: true,
      accounts: {
        deployer: deployer.address,
        simpleAccount: SIMPLE_ACCOUNT,
        recipient: recipient,
        owner: owner
      },
      userOperation: userOp,
      contracts: {
        entryPoint: ENTRY_POINT,
        factory: FACTORY,
        paymaster: PAYMASTER,
        testToken: TEST_TOKEN,
        simpleAccount: SIMPLE_ACCOUNT
      }
    };

  } catch (error) {
    console.error("❌ Demo failed:", error);
    throw error;
  }
}

// Execute the demonstration
demonstrateMetaTx()
  .then((result) => {
    console.log("🎊 Demonstration completed successfully!");
    console.log("Result:", JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error("💥 Demonstration failed:", error);
    process.exit(1);
  });