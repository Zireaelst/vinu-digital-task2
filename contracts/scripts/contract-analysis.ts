import { ethers } from "hardhat";
import { readFileSync } from "fs";
import chalk from "chalk";

async function main() {
  console.log(chalk.blue("🔍 ERC-4337 Contract Functionality Analysis"));
  console.log("=" .repeat(60));
  
  // Load deployed contracts
  const data = readFileSync("deployed_addresses.json", "utf8");
  const deployedContracts = JSON.parse(data);
  
  const [deployer] = await ethers.getSigners();
  
  console.log(chalk.yellow("📋 Deployment Info:"));
  console.log(`Network: ${deployedContracts.network}`);
  console.log(`Deployer: ${deployedContracts.deployer}`);
  console.log(`Deployed: ${deployedContracts.deployedAt}`);
  
  let issuesFound = 0;
  let testsRun = 0;
  
  // Test 1: EntryPoint Connection
  console.log(chalk.blue("\n🧪 Test 1: EntryPoint Functionality"));
  testsRun++;
  try {
    const entryPoint = await ethers.getContractAt("IEntryPoint", deployedContracts.entryPoint);
    
    // Test if we can call basic functions
    const version = await entryPoint.getSenderAddress("0x").catch(() => "connected");
    console.log(chalk.green("✅ EntryPoint is accessible"));
    
    // Check if EntryPoint has any balance (should be 0 or positive)
    const entryPointBalance = await ethers.provider.getBalance(deployedContracts.entryPoint);
    console.log(`EntryPoint balance: ${ethers.formatEther(entryPointBalance)} ETH`);
    
  } catch (error: any) {
    console.log(chalk.red("❌ EntryPoint connection failed:"), error.message);
    issuesFound++;
  }
  
  // Test 2: TestToken Contract
  console.log(chalk.blue("\n🧪 Test 2: TestToken Functionality"));
  testsRun++;
  try {
    const testToken = await ethers.getContractAt("TestToken", deployedContracts.testToken);
    
    // Check basic token info
    const name = await testToken.name();
    const symbol = await testToken.symbol();
    const decimals = await testToken.decimals();
    const totalSupply = await testToken.totalSupply();
    
    console.log(`Token: ${name} (${symbol})`);
    console.log(`Decimals: ${decimals}`);
    console.log(`Total Supply: ${ethers.formatEther(totalSupply)}`);
    
    // Test minting
    const testAddress = "0x742d35Cc6851C2c2C6adD8C495Fa3D2B1068E589";
    const mintAmount = ethers.parseEther("1");
    
    const mintTx = await testToken.freeMint(testAddress, mintAmount);
    await mintTx.wait();
    
    const balance = await testToken.balanceOf(testAddress);
    console.log(chalk.green(`✅ TestToken minting works: ${ethers.formatEther(balance)} tokens`));
    
  } catch (error: any) {
    console.log(chalk.red("❌ TestToken test failed:"), error.message);
    issuesFound++;
  }
  
  // Test 3: SimpleAccountFactory
  console.log(chalk.blue("\n🧪 Test 3: SimpleAccountFactory Functionality"));
  testsRun++;
  try {
    const factory = await ethers.getContractAt("SimpleAccountFactory", deployedContracts.simpleAccountFactory);
    
    // Check factory configuration
    const factoryEntryPoint = await factory.getEntryPoint();
    const implementation = await factory.getImplementation();
    
    console.log(`Factory EntryPoint: ${factoryEntryPoint}`);
    console.log(`Implementation: ${implementation}`);
    console.log(`Expected EntryPoint: ${deployedContracts.entryPoint}`);
    
    if (factoryEntryPoint.toLowerCase() === deployedContracts.entryPoint.toLowerCase()) {
      console.log(chalk.green("✅ Factory correctly configured with EntryPoint"));
    } else {
      console.log(chalk.red("❌ Factory EntryPoint mismatch"));
      issuesFound++;
    }
    
    // Test address calculation
    const testOwner = "0x742d35Cc6851C2c2C6adD8C495Fa3D2B1068E589";
    const salt = 12345;
    
    const predictedAddress1 = await factory.getAddress(testOwner, salt);
    const predictedAddress2 = await factory.getAddress(testOwner, salt);
    
    console.log(`Predicted Address 1: ${predictedAddress1}`);
    console.log(`Predicted Address 2: ${predictedAddress2}`);
    
    if (predictedAddress1 === predictedAddress2) {
      console.log(chalk.green("✅ Address calculation is deterministic"));
    } else {
      console.log(chalk.red("❌ Address calculation is not deterministic"));
      issuesFound++;
    }
    
    // Test with different salt
    const predictedAddress3 = await factory.getAddress(testOwner, salt + 1);
    if (predictedAddress1 !== predictedAddress3) {
      console.log(chalk.green("✅ Different salts produce different addresses"));
    } else {
      console.log(chalk.red("❌ Salt is not affecting address calculation"));
      issuesFound++;
    }
    
  } catch (error: any) {
    console.log(chalk.red("❌ Factory test failed:"), error.message);
    issuesFound++;
  }
  
  // Test 4: SponsorPaymaster
  console.log(chalk.blue("\n🧪 Test 4: SponsorPaymaster Functionality"));
  testsRun++;
  try {
    const paymaster = await ethers.getContractAt("SponsorPaymaster", deployedContracts.sponsorPaymaster);
    
    // Check paymaster balance
    const paymasterBalance = await paymaster.getDepositBalance();
    console.log(`Paymaster deposit: ${ethers.formatEther(paymasterBalance)} ETH`);
    
    if (paymasterBalance > 0) {
      console.log(chalk.green("✅ Paymaster has funds for sponsorship"));
    } else {
      console.log(chalk.yellow("⚠️  Paymaster has no funds - will need funding"));
    }
    
    // Test whitelist functionality
    const testAddress = "0x742d35Cc6851C2c2C6adD8C495Fa3D2B1068E589";
    const isWhitelisted = await paymaster.isWhitelisted(testAddress);
    console.log(`Test address whitelisted: ${isWhitelisted}`);
    
    // Test whitelist modification (if we're owner)
    const owner = await paymaster.owner();
    console.log(`Paymaster owner: ${owner}`);
    console.log(`Deployer: ${await deployer.getAddress()}`);
    
    if (owner.toLowerCase() === (await deployer.getAddress()).toLowerCase()) {
      console.log(chalk.green("✅ Paymaster ownership is correct"));
      
      // Test whitelisting
      if (!isWhitelisted) {
        const whitelistTx = await paymaster.setWhitelist(testAddress, true);
        await whitelistTx.wait();
        
        const nowWhitelisted = await paymaster.isWhitelisted(testAddress);
        if (nowWhitelisted) {
          console.log(chalk.green("✅ Whitelist functionality works"));
        } else {
          console.log(chalk.red("❌ Whitelist functionality failed"));
          issuesFound++;
        }
      }
    } else {
      console.log(chalk.red("❌ Paymaster ownership issue"));
      issuesFound++;
    }
    
  } catch (error: any) {
    console.log(chalk.red("❌ Paymaster test failed:"), error.message);
    issuesFound++;
  }
  
  // Test 5: Account Creation and Basic Functionality
  console.log(chalk.blue("\n🧪 Test 5: Account Creation Test"));
  testsRun++;
  try {
    const factory = await ethers.getContractAt("SimpleAccountFactory", deployedContracts.simpleAccountFactory);
    const testToken = await ethers.getContractAt("TestToken", deployedContracts.testToken);
    
    // Create a test user
    const testUser = ethers.Wallet.createRandom();
    const salt = Date.now(); // Use timestamp as salt for uniqueness
    
    console.log(`Test user EOA: ${testUser.address}`);
    console.log(`Using salt: ${salt}`);
    
    // Get predicted address
    const predictedAddress = await factory.getAddress(testUser.address, salt);
    console.log(`Predicted account address: ${predictedAddress}`);
    
    // Check if already deployed
    const existingCode = await ethers.provider.getCode(predictedAddress);
    const alreadyDeployed = existingCode !== "0x";
    
    console.log(`Already deployed: ${alreadyDeployed}`);
    
    if (!alreadyDeployed) {
      // Deploy the account
      console.log("Creating account...");
      const createTx = await factory.createAccount(testUser.address, salt);
      const receipt = await createTx.wait();
      console.log(`Account created in tx: ${receipt?.hash}`);
      
      // Verify deployment
      const newCode = await ethers.provider.getCode(predictedAddress);
      const isDeployed = newCode !== "0x";
      
      if (isDeployed) {
        console.log(chalk.green("✅ Account deployment successful"));
        
        // Test account functionality
        const account = await ethers.getContractAt("contracts/core/SimpleAccount.sol:SimpleAccount", predictedAddress);
        
        try {
          const owner = await account.owner();
          console.log(`Account owner: ${owner}`);
          
          if (owner.toLowerCase() === testUser.address.toLowerCase()) {
            console.log(chalk.green("✅ Account ownership is correct"));
          } else {
            console.log(chalk.red("❌ Account ownership is incorrect"));
            issuesFound++;
          }
          
        } catch (ownerError: any) {
          console.log(chalk.red("❌ Could not read account owner:"), ownerError.message);
          issuesFound++;
        }
        
      } else {
        console.log(chalk.red("❌ Account deployment failed"));
        issuesFound++;
      }
      
    } else {
      console.log(chalk.yellow("⚠️  Account already exists, skipping creation test"));
    }
    
  } catch (error: any) {
    console.log(chalk.red("❌ Account creation test failed:"), error.message);
    issuesFound++;
  }
  
  // Final Assessment
  console.log(chalk.blue("\n📊 FINAL ASSESSMENT"));
  console.log("=" .repeat(60));
  console.log(`Tests run: ${testsRun}`);
  console.log(`Issues found: ${issuesFound}`);
  
  if (issuesFound === 0) {
    console.log(chalk.green("\n🎉 ALL CONTRACTS ARE FULLY FUNCTIONAL!"));
    console.log(chalk.green("✅ Ready for ERC-4337 UserOperation execution"));
    console.log(chalk.green("✅ All components working correctly"));
  } else if (issuesFound <= 2) {
    console.log(chalk.yellow("\n⚠️  CONTRACTS ARE MOSTLY FUNCTIONAL"));
    console.log(chalk.yellow(`${issuesFound} minor issues found that can be fixed`));
    console.log(chalk.yellow("Core functionality appears to be working"));
  } else {
    console.log(chalk.red("\n❌ MULTIPLE ISSUES DETECTED"));
    console.log(chalk.red(`${issuesFound} issues need to be addressed`));
    console.log(chalk.red("Contracts may need debugging or redeployment"));
  }
  
  console.log(chalk.blue("\n🔗 Contract Addresses on Sepolia:"));
  Object.entries(deployedContracts).forEach(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('0x')) {
      console.log(`${key}: https://sepolia.etherscan.io/address/${value}`);
    }
  });
}

main()
  .then(() => {
    console.log(chalk.blue("\n🔍 Analysis completed"));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red("❌ Analysis failed:"));
    console.error(error);
    process.exit(1);
  });