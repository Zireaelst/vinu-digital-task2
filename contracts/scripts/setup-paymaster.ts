import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Load deployed addresses
const deployedAddressesPath = path.join(__dirname, '../deployed_addresses.json');
const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf-8'));

const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/TOesvxt49zaYfum1kkgS6';
const SPONSOR_PRIVATE_KEY = process.env.PRIVATE_KEY || '0xf940ad78f04aee09ea25f8233fb4919f787cd302c215644e7084d194a0459322';

// Demo account that should be whitelisted
const DEMO_ACCOUNT = '0xe6C10E95f8AEF841e766018Cd08944602Bc7EFC2';

async function main() {
  console.log('🚀 Setting up paymaster for gas sponsorship...\n');

  // Connect to Sepolia
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(SPONSOR_PRIVATE_KEY, provider);
  
  console.log('📋 Configuration:');
  console.log('  Sponsor wallet:', wallet.address);
  console.log('  EntryPoint:', deployedAddresses.entryPoint);
  console.log('  Paymaster:', deployedAddresses.sponsorPaymaster);
  console.log('  SimpleAccount to whitelist:', DEMO_ACCOUNT);
  
  // Get wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log('  Sponsor balance:', ethers.formatEther(balance), 'ETH\n');
  
  if (balance < ethers.parseEther('0.015')) {
    console.error('❌ Insufficient balance! Need at least 0.015 ETH for setup');
    console.error('Get Sepolia ETH from: https://sepoliafaucet.com/');
    process.exit(1);
  }

  // Paymaster contract
  const paymaster = new ethers.Contract(
    deployedAddresses.sponsorPaymaster,
    [
      'function depositForOwner() payable',
      'function setWhitelist(address user, bool whitelisted) external',
      'function whitelist(address) view returns (bool)',
      'function owner() view returns (address)',
      'function entryPoint() view returns (address)',
      'function maxCostPerUserOp() view returns (uint256)',
    ],
    wallet
  );

  // EntryPoint contract (to check deposits)
  const entryPoint = new ethers.Contract(
    deployedAddresses.entryPoint,
    [
      'function balanceOf(address account) view returns (uint256)',
      'function depositTo(address account) payable',
    ],
    provider
  );

  // Step 1: Check current paymaster deposit
  console.log('1️⃣ Checking paymaster deposit on EntryPoint...');
  const currentDeposit = await entryPoint.balanceOf(deployedAddresses.sponsorPaymaster);
  console.log('   Current deposit:', ethers.formatEther(currentDeposit), 'ETH');

  // Step 2: Deposit ETH if needed
  const REQUIRED_DEPOSIT = ethers.parseEther('0.01'); // 0.01 ETH
  
  if (currentDeposit < REQUIRED_DEPOSIT) {
    console.log('   ⚠️  Deposit too low, funding paymaster...');
    const depositAmount = ethers.parseEther('0.01');
    console.log('   Depositing:', ethers.formatEther(depositAmount), 'ETH');
    
    const tx = await paymaster.depositForOwner({ value: depositAmount });
    console.log('   Transaction:', tx.hash);
    await tx.wait();
    console.log('   ✅ Deposit successful!\n');
    
    const newDeposit = await entryPoint.balanceOf(deployedAddresses.sponsorPaymaster);
    console.log('   New deposit:', ethers.formatEther(newDeposit), 'ETH\n');
  } else {
    console.log('   ✅ Deposit is sufficient\n');
  }

  // Step 3: Check if account is whitelisted
  console.log('2️⃣ Checking whitelist status...');
  const isWhitelisted = await paymaster.whitelist(DEMO_ACCOUNT);
  console.log('   Account:', DEMO_ACCOUNT);
  console.log('   Whitelisted:', isWhitelisted);

  // Step 4: Whitelist account if needed
  if (!isWhitelisted) {
    console.log('   ⚠️  Account not whitelisted, adding to whitelist...');
    
    const tx = await paymaster.setWhitelist(DEMO_ACCOUNT, true);
    console.log('   Transaction:', tx.hash);
    await tx.wait();
    console.log('   ✅ Account whitelisted!\n');
  } else {
    console.log('   ✅ Account already whitelisted\n');
  }

  // Step 5: Verify setup
  console.log('3️⃣ Verifying setup...');
  const finalDeposit = await entryPoint.balanceOf(deployedAddresses.sponsorPaymaster);
  const finalWhitelisted = await paymaster.whitelist(DEMO_ACCOUNT);
  const maxCost = await paymaster.maxCostPerUserOp();
  
  console.log('   Paymaster deposit:', ethers.formatEther(finalDeposit), 'ETH');
  console.log('   Account whitelisted:', finalWhitelisted);
  console.log('   Max cost per UserOp:', ethers.formatEther(maxCost), 'ETH');

  if (finalDeposit >= REQUIRED_DEPOSIT && finalWhitelisted) {
    console.log('\n✅ Paymaster setup complete!');
    console.log('   The paymaster can now sponsor gas for the demo account.');
    console.log('   Estimated operations supported:', 
      Math.floor(Number(ethers.formatEther(finalDeposit)) / Number(ethers.formatEther(maxCost))));
  } else {
    console.log('\n⚠️  Setup incomplete. Please check the errors above.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
