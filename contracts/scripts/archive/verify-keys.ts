import hre from "hardhat";
const { ethers } = hre;

async function verifyKeys() {
  console.log("🔑 Verifying private keys and addresses...");
  
  // Load environment variables
  const deployerKey = process.env.PRIVATE_KEY!;
  const sponsorKey = process.env.SPONSOR_PRIVATE_KEY!;
  
  // Create wallets from private keys
  const deployerWallet = new ethers.Wallet(deployerKey);
  const sponsorWallet = new ethers.Wallet(sponsorKey);
  
  console.log("Deployer private key:", deployerKey);
  console.log("Deployer address:", deployerWallet.address);
  console.log();
  console.log("Sponsor private key:", sponsorKey);
  console.log("Sponsor address:", sponsorWallet.address);
  console.log();
  
  // Check which one matches the account owner
  const expectedOwner = "0xc351AF3A6Db5ABbb400A449e0c438316f683322C";
  console.log("Expected SimpleAccount owner:", expectedOwner);
  
  if (deployerWallet.address.toLowerCase() === expectedOwner.toLowerCase()) {
    console.log("✅ Deployer key matches account owner!");
    console.log("Use PRIVATE_KEY for signing");
  } else if (sponsorWallet.address.toLowerCase() === expectedOwner.toLowerCase()) {
    console.log("✅ Sponsor key matches account owner!");
    console.log("Use SPONSOR_PRIVATE_KEY for signing");
  } else {
    console.log("❌ Neither key matches the account owner");
    console.log("Need to find the correct private key for:", expectedOwner);
  }
}

verifyKeys()
  .then(() => {
    console.log("🎉 Key verification completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });