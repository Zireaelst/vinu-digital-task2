import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const factoryAddress = "0x9C12C19B00cAA9c7c23383F399924d26A0E06fDc";
  const walletAddress = "0xc351AF3A6Db5ABbb400A449e0c438316f683322C";
  const salt = 0; // Default salt
  
  console.log("🔍 Calculating SimpleAccount address...");
  console.log("Factory:", factoryAddress);
  console.log("Owner (wallet):", walletAddress);
  console.log("Salt:", salt);
  
  // Get factory contract
  const SimpleAccountFactory = await ethers.getContractFactory("SimpleAccountFactory");
  const factory = SimpleAccountFactory.attach(factoryAddress);
  
  try {
    // Get account address
    const accountAddress = await factory.getFunction("getAddress").staticCall(walletAddress, salt);
    console.log("✅ Predicted SimpleAccount address:", accountAddress);
    
    // Check if account exists
    const code = await ethers.provider.getCode(accountAddress);
    const isDeployed = code !== "0x";
    console.log("📍 Account deployed:", isDeployed);
    
    if (!isDeployed) {
      console.log("⚠️  Account needs to be created first!");
      console.log("💡 You can create it by calling factory.createAccount(owner, salt)");
    }
    
    return {
      accountAddress,
      isDeployed,
      owner: walletAddress,
      salt
    };
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

main()
  .then((result) => {
    console.log("🎉 Account calculation completed:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });