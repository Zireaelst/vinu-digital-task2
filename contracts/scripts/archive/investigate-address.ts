import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const address = "0x9C12C19B00cAA9c7c23383F399924d26A0E06fDc";
  
  console.log("🔍 Investigating address:", address);
  
  // Check what's deployed at this address
  const code = await ethers.provider.getCode(address);
  console.log("📋 Contract code length:", code.length);
  
  // Try to interact as factory
  try {
    const factoryInterface = new ethers.Interface([
      "function getEntryPoint() view returns (address)",
      "function getImplementation() view returns (address)"
    ]);
    
    const entryPoint = await ethers.provider.call({
      to: address,
      data: factoryInterface.encodeFunctionData("getEntryPoint")
    });
    const entryPointAddress = factoryInterface.decodeFunctionResult("getEntryPoint", entryPoint)[0];
    console.log("✅ As Factory - EntryPoint:", entryPointAddress);
    
    const impl = await ethers.provider.call({
      to: address,
      data: factoryInterface.encodeFunctionData("getImplementation")
    });
    const implAddress = factoryInterface.decodeFunctionResult("getImplementation", impl)[0];
    console.log("✅ As Factory - Implementation:", implAddress);
    
  } catch (error: any) {
    console.log("❌ Not a factory:", error.message);
  }
  
  // Try to interact as SimpleAccount
  try {
    const accountInterface = new ethers.Interface([
      "function entryPoint() view returns (address)",
      "function owner() view returns (address)"
    ]);
    
    const entryPoint = await ethers.provider.call({
      to: address,
      data: accountInterface.encodeFunctionData("entryPoint")
    });
    const entryPointAddress = accountInterface.decodeFunctionResult("entryPoint", entryPoint)[0];
    console.log("✅ As Account - EntryPoint:", entryPointAddress);
    
    const ownerResult = await ethers.provider.call({
      to: address,
      data: accountInterface.encodeFunctionData("owner")
    });
    const ownerAddress = accountInterface.decodeFunctionResult("owner", ownerResult)[0];
    console.log("✅ As Account - Owner:", ownerAddress);
    
  } catch (error: any) {
    console.log("❌ Not an account:", error.message);
  }
}

main()
  .then(() => {
    console.log("🎉 Investigation completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });