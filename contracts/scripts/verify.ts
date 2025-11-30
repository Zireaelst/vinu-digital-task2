import { run } from "hardhat";
import { readFileSync } from "fs";
import chalk from "chalk";

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
  console.log(chalk.blue("🔍 Starting Contract Verification..."));
  
  // Read deployed addresses
  let deployedContracts: DeployedContracts;
  try {
    const data = readFileSync("deployed_addresses.json", "utf8");
    deployedContracts = JSON.parse(data);
  } catch (error) {
    console.error(chalk.red("❌ Could not read deployed_addresses.json"));
    console.error("Run deployment first: npm run deploy");
    process.exit(1);
  }
  
  console.log(chalk.yellow("📋 Verifying contracts on network:"), deployedContracts.network);
  
  // 1. Verify TestToken
  try {
    console.log(chalk.cyan("1️⃣  Verifying TestToken..."));
    await run("verify:verify", {
      address: deployedContracts.testToken,
      constructorArguments: [
        "Test Token",
        "TEST", 
        deployedContracts.deployer
      ]
    });
    console.log(chalk.green("✅ TestToken verified"));
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(chalk.yellow("⚠️  TestToken already verified"));
    } else {
      console.error(chalk.red("❌ TestToken verification failed:"), error.message);
    }
  }
  
  // 2. Verify SimpleAccountFactory
  try {
    console.log(chalk.cyan("2️⃣  Verifying SimpleAccountFactory..."));
    await run("verify:verify", {
      address: deployedContracts.simpleAccountFactory,
      constructorArguments: [
        deployedContracts.entryPoint
      ]
    });
    console.log(chalk.green("✅ SimpleAccountFactory verified"));
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(chalk.yellow("⚠️  SimpleAccountFactory already verified"));
    } else {
      console.error(chalk.red("❌ SimpleAccountFactory verification failed:"), error.message);
    }
  }
  
  // 3. Verify SponsorPaymaster
  try {
    console.log(chalk.cyan("3️⃣  Verifying SponsorPaymaster..."));
    await run("verify:verify", {
      address: deployedContracts.sponsorPaymaster,
      constructorArguments: [
        deployedContracts.entryPoint,
        deployedContracts.deployer
      ]
    });
    console.log(chalk.green("✅ SponsorPaymaster verified"));
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(chalk.yellow("⚠️  SponsorPaymaster already verified"));
    } else {
      console.error(chalk.red("❌ SponsorPaymaster verification failed:"), error.message);
    }
  }
  
  console.log(chalk.blue("\n📊 Verification Summary:"));
  console.log(`📄 TestToken: https://sepolia.etherscan.io/address/${deployedContracts.testToken}`);
  console.log(`🏭 SimpleAccountFactory: https://sepolia.etherscan.io/address/${deployedContracts.simpleAccountFactory}`);
  console.log(`💳 SponsorPaymaster: https://sepolia.etherscan.io/address/${deployedContracts.sponsorPaymaster}`);
  console.log(`🎯 EntryPoint: https://sepolia.etherscan.io/address/${deployedContracts.entryPoint}`);
}

main()
  .then(() => {
    console.log(chalk.green("\n🎉 Contract verification completed!"));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red("❌ Verification failed:"));
    console.error(error);
    process.exit(1);
  });