import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const factoryAddress = "0x9C12C19B00cAA9c7c23383F399924d26A0E06fDc";
  const walletAddress = "0xc351AF3A6Db5ABbb400A449e0c438316f683322C";
  
  console.log("🔍 Searching for existing SimpleAccounts...");
  console.log("Factory:", factoryAddress);
  console.log("Owner (wallet):", walletAddress);
  
  // Try different salts to find existing accounts
  for (let salt = 0; salt < 10; salt++) {
    try {
      const factoryInterface = new ethers.Interface([
        "function getAddress(address, uint256) view returns (address)"
      ]);
      
      const result = await ethers.provider.call({
        to: factoryAddress,
        data: factoryInterface.encodeFunctionData("getAddress", [walletAddress, salt])
      });
      const accountAddress = factoryInterface.decodeFunctionResult("getAddress", result)[0];
      
      // Check if account exists
      const code = await ethers.provider.getCode(accountAddress);
      const isDeployed = code !== "0x";
      
      console.log(`Salt ${salt}: ${accountAddress} - ${isDeployed ? "✅ DEPLOYED" : "❌ Not deployed"}`);
      
      if (isDeployed && accountAddress !== factoryAddress) {
        console.log(`🎉 Found deployed SimpleAccount at ${accountAddress} with salt ${salt}`);
        return {
          accountAddress,
          salt,
          owner: walletAddress
        };
      }
    } catch (error) {
      console.log(`Salt ${salt}: Error -`, (error as any).message);
    }
  }
  
  console.log("⚠️  No existing SimpleAccount found. Need to deploy one.");
  return null;
}

main()
  .then((result) => {
    if (result) {
      console.log("✅ Found account:", result);
    } else {
      console.log("❌ No account found");
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });