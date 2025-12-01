import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const factoryAddress = "0x9C12C19B00cAA9c7c23383F399924d26A0E06fDc";
  const walletAddress = "0xc351AF3A6Db5ABbb400A449e0c438316f683322C";
  const salt = 0; // Use salt 0
  
  console.log("🚀 Creating SimpleAccount...");
  console.log("Factory:", factoryAddress);
  console.log("Owner (wallet):", walletAddress);
  console.log("Salt:", salt);
  
  // Get signer (use the deployer account)
  const [signer] = await ethers.getSigners();
  console.log("Deployer:", signer.address);
  
  // Connect to factory using interface
  const factoryInterface = new ethers.Interface([
    "function getAddress(address owner, uint256 salt) view returns (address)",
    "function createAccount(address owner, uint256 salt) returns (address)"
  ]);
  
  // Predict the account address first
  const predictResult = await ethers.provider.call({
    to: factoryAddress,
    data: factoryInterface.encodeFunctionData("getAddress", [walletAddress, salt])
  });
  const predictedAddress = factoryInterface.decodeFunctionResult("getAddress", predictResult)[0];
  console.log("📍 Predicted account address:", predictedAddress);
  
  // Check if already deployed
  const code = await ethers.provider.getCode(predictedAddress);
  if (code !== "0x") {
    console.log("✅ Account already deployed at:", predictedAddress);
    return predictedAddress;
  }
  
  // Create the account
  console.log("⏳ Creating account...");
  const txData = factoryInterface.encodeFunctionData("createAccount", [walletAddress, salt]);
  const tx = await signer.sendTransaction({
    to: factoryAddress,
    data: txData
  });
  console.log("📤 Transaction sent:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed in block:", receipt?.blockNumber);
  
  // Verify deployment
  const newCode = await ethers.provider.getCode(predictedAddress);
  const isDeployed = newCode !== "0x";
  
  if (isDeployed) {
    console.log("🎉 SimpleAccount successfully deployed at:", predictedAddress);
    
    // Verify it's working by checking the owner
    const SimpleAccount = await ethers.getContractFactory("SimpleAccount");
    const account = SimpleAccount.attach(predictedAddress);
    
    try {
      // Use low-level call to get owner since direct method might have issues
      const accountInterface = new ethers.Interface([
        "function owner() view returns (address)"
      ]);
      
      const ownerResult = await ethers.provider.call({
        to: predictedAddress,
        data: accountInterface.encodeFunctionData("owner")
      });
      const ownerAddress = accountInterface.decodeFunctionResult("owner", ownerResult)[0];
      
      console.log("✅ Account owner:", ownerAddress);
      console.log("✅ Expected owner:", walletAddress);
      
      if (ownerAddress.toLowerCase() === walletAddress.toLowerCase()) {
        console.log("🎊 Account created successfully with correct owner!");
      } else {
        console.log("⚠️  Warning: Owner mismatch!");
      }
    } catch (error) {
      console.log("⚠️  Could not verify owner:", (error as any).message);
    }
    
    return predictedAddress;
  } else {
    throw new Error("Account deployment failed");
  }
}

main()
  .then((accountAddress) => {
    console.log("🎉 Account deployment completed:", accountAddress);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });