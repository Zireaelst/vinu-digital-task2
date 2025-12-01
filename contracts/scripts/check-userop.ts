import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Load deployed addresses
const deployedAddressesPath = path.join(__dirname, '../deployed_addresses.json');
const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf-8'));

const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/TOesvxt49zaYfum1kkgS6';

// UserOp hash from logs
const USER_OP_HASH = '0x1ce16a8c15cda2d7c1eb5ecca363d6f0310aa0727fbe5c86002008f553431fe1';
const DEMO_ACCOUNT = '0xe6C10E95f8AEF841e766018Cd08944602Bc7EFC2';

async function main() {
  console.log('🔍 Checking UserOperation status...\n');

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

  // EntryPoint contract
  const entryPoint = new ethers.Contract(
    deployedAddresses.entryPoint,
    [
      'event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)',
      'function balanceOf(address account) view returns (uint256)',
    ],
    provider
  );

  // Paymaster contract
  const paymaster = new ethers.Contract(
    deployedAddresses.sponsorPaymaster,
    [
      'event UserOpSponsored(address indexed sender, uint256 actualGasCost)',
    ],
    provider
  );

  // Get recent blocks (last 9 blocks - Alchemy free tier limit of 10 blocks inclusive)
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = currentBlock - 9;

  console.log('📋 Search Parameters:');
  console.log('  UserOp Hash:', USER_OP_HASH);
  console.log('  Account:', DEMO_ACCOUNT);
  console.log('  EntryPoint:', deployedAddresses.entryPoint);
  console.log('  Paymaster:', deployedAddresses.sponsorPaymaster);
  console.log('  Block Range:', fromBlock, '-', currentBlock);
  console.log();

  // Check EntryPoint balance
  console.log('💰 Checking balances...');
  const paymasterBalance = await entryPoint.balanceOf(deployedAddresses.sponsorPaymaster);
  console.log('  Paymaster balance on EntryPoint:', ethers.formatEther(paymasterBalance), 'ETH');
  
  const accountBalance = await provider.getBalance(DEMO_ACCOUNT);
  console.log('  SimpleAccount ETH balance:', ethers.formatEther(accountBalance), 'ETH');
  console.log();

  // Search for UserOperationEvent
  console.log('🔎 Searching for UserOperationEvent...');
  const filter = entryPoint.filters.UserOperationEvent(USER_OP_HASH);
  const events = await entryPoint.queryFilter(filter, fromBlock, currentBlock);

  if (events.length > 0) {
    console.log(`✅ Found ${events.length} UserOperationEvent(s)!\n`);
    
    for (const event of events) {
      const eventLog = event as ethers.EventLog;
      console.log('📦 Event Details:');
      console.log('  Block:', eventLog.blockNumber);
      console.log('  Transaction:', eventLog.transactionHash);
      console.log('  UserOp Hash:', eventLog.args?.userOpHash);
      console.log('  Sender:', eventLog.args?.sender);
      console.log('  Paymaster:', eventLog.args?.paymaster);
      console.log('  Nonce:', eventLog.args?.nonce?.toString());
      console.log('  Success:', eventLog.args?.success);
      console.log('  Actual Gas Cost:', ethers.formatEther(eventLog.args?.actualGasCost || 0n), 'ETH');
      console.log('  Actual Gas Used:', eventLog.args?.actualGasUsed?.toString());
      console.log();

      // Get transaction receipt for more details
      const receipt = await provider.getTransactionReceipt(eventLog.transactionHash);
      if (receipt) {
        console.log('📜 Transaction Receipt:');
        console.log('  Status:', receipt.status === 1 ? '✅ Success' : '❌ Failed');
        console.log('  Gas Used:', receipt.gasUsed.toString());
        console.log('  Effective Gas Price:', ethers.formatUnits(receipt.gasPrice, 'gwei'), 'gwei');
        console.log('  Total Cost:', ethers.formatEther(receipt.gasUsed * receipt.gasPrice), 'ETH');
        console.log();
      }
    }

    // Check if paymaster paid
    const firstEvent = events[0] as ethers.EventLog;
    if (firstEvent.args?.paymaster === deployedAddresses.sponsorPaymaster) {
      console.log('🎉 SUCCESS: Paymaster sponsored the transaction!');
      console.log('   Gas was paid by:', deployedAddresses.sponsorPaymaster);
      console.log('   NOT paid by SimpleAccount!');
    } else {
      console.log('⚠️ Transaction executed but paymaster did not sponsor');
    }
  } else {
    console.log('❌ No UserOperationEvent found with this hash');
    console.log('   This means the UserOperation was NOT executed on EntryPoint');
    console.log();
    
    // Check for paymaster events
    console.log('🔎 Checking for paymaster events...');
    const paymasterFilter = paymaster.filters.UserOpSponsored(DEMO_ACCOUNT);
    const paymasterEvents = await paymaster.queryFilter(paymasterFilter, fromBlock, currentBlock);
    
    if (paymasterEvents.length > 0) {
      console.log('✅ Found paymaster sponsorship events:');
      for (const event of paymasterEvents) {
        const eventLog = event as ethers.EventLog;
        console.log('  Block:', eventLog.blockNumber);
        console.log('  Transaction:', eventLog.transactionHash);
        console.log('  Gas Cost:', ethers.formatEther(eventLog.args?.actualGasCost || 0n), 'ETH');
      }
    } else {
      console.log('❌ No paymaster sponsorship events found');
    }
    
    console.log();
    console.log('💡 The transaction may have been executed directly (fallback mode)');
    console.log('   Check this transaction: 0xa8fb7ab010b62da6080bba0ca349175aacc088fcc9fb9e649fb97a4af7e712c5');
  }

  console.log();
  console.log('🔗 View on Etherscan:');
  console.log(`   https://sepolia.etherscan.io/address/${DEMO_ACCOUNT}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
