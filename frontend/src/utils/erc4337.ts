import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, SEPOLIA_RPC_URL } from '@/config/wagmi';

// UserOperation interface
export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

// Create ethers provider for Sepolia
export const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

// Contract instances
export const getEntryPointContract = () => {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.entryPoint,
    [
      'function getUserOpHash(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) userOp) view returns (bytes32)',
      'function getNonce(address sender, uint192 key) view returns (uint256 nonce)'
    ],
    provider
  );
};

export const getTestTokenContract = () => {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.testToken,
    [
      'function balanceOf(address account) view returns (uint256)',
      'function transfer(address to, uint256 amount) returns (bool)',
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)'
    ],
    provider
  );
};

export const getSimpleAccountContract = (accountAddress: string) => {
  return new ethers.Contract(
    accountAddress,
    [
      'function execute(address dest, uint256 value, bytes func)',
      'function executeBatch(address[] dest, uint256[] value, bytes[] func)',
      'function owner() view returns (address)'
    ],
    provider
  );
};

export const getSimpleAccountFactoryContract = () => {
  // Full ABI for SimpleAccountFactory
  const abi = [
    {
      "inputs": [
        {"internalType": "address", "name": "owner", "type": "address"},
        {"internalType": "uint256", "name": "salt", "type": "uint256"}
      ],
      "name": "createAccount",
      "outputs": [
        {"internalType": "contract SimpleAccount", "name": "account", "type": "address"}
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "address", "name": "owner", "type": "address"},
        {"internalType": "uint256", "name": "salt", "type": "uint256"}
      ],
      "name": "getAddress",
      "outputs": [
        {"internalType": "address", "name": "", "type": "address"}
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];
  
  return new ethers.Contract(
    CONTRACT_ADDRESSES.simpleAccountFactory,
    abi,
    provider
  );
};

/**
 * Calculate the SimpleAccount address for a given owner using CREATE2
 * This is deterministic based on owner address and salt
 */
export async function getAccountAddress(ownerAddress: string, salt: number = 0): Promise<string> {
  console.log('🔍 Getting account address for:', {
    owner: ownerAddress,
    salt,
    factory: CONTRACT_ADDRESSES.simpleAccountFactory
  });
  
  try {
    const factory = getSimpleAccountFactoryContract();
    console.log('📞 Calling factory.getAddress...');
    // Call getAddress with proper parameters
    // TypeScript doesn't properly infer the factory contract methods, so we explicitly type it
    const accountAddress = await (factory as unknown as { getAddress: (owner: string, salt: number) => Promise<string> }).getAddress(ownerAddress, salt);
    
    console.log('📦 Factory returned:', accountAddress);
    console.log('🏭 Factory address:', CONTRACT_ADDRESSES.simpleAccountFactory);
    console.log('❓ Are they equal?', accountAddress.toLowerCase() === CONTRACT_ADDRESSES.simpleAccountFactory.toLowerCase());
    
    // Sanity check - address should not be the factory itself or zero address
    if (accountAddress.toLowerCase() === CONTRACT_ADDRESSES.simpleAccountFactory.toLowerCase() ||
        accountAddress === ethers.ZeroAddress) {
      throw new Error(`Invalid account address returned: ${accountAddress}. This might indicate the factory's getAddress() method is not working correctly.`);
    }
    
    console.log(`✅ Calculated SimpleAccount for owner ${ownerAddress}: ${accountAddress}`);
    return accountAddress;
  } catch (error) {
    console.error('❌ Error in getAccountAddress:', error);
    throw error;
  }
}

/**
 * Check if a SimpleAccount exists for the given owner
 * If not, generate initCode to deploy it
 */
export async function getAccountInitCode(ownerAddress: string, salt: number = 0): Promise<string> {
  const accountAddress = await getAccountAddress(ownerAddress, salt);
  
  // Check if account already exists (has code)
  const code = await provider.getCode(accountAddress);
  if (code !== '0x') {
    // Account already deployed
    return '0x';
  }
  
  // Account doesn't exist, generate initCode
  const factory = getSimpleAccountFactoryContract();
  const factoryData = factory.interface.encodeFunctionData('createAccount', [ownerAddress, salt]);
  
  // initCode = factory address + factory calldata
  return CONTRACT_ADDRESSES.simpleAccountFactory + factoryData.slice(2);
}

/**
 * Build a UserOperation for token transfer from user's wallet
 * Automatically calculates the SimpleAccount address and includes initCode if needed
 */
export async function buildTokenTransferUserOpFromWallet(
  walletAddress: string,
  to: string,
  amount: string,
  privateKey: string,
  salt: number = 0
): Promise<UserOperation> {
  // Calculate the SimpleAccount address for this wallet
  const accountAddress = await getAccountAddress(walletAddress, salt);
  
  // Get initCode (will be '0x' if account already exists)
  const initCode = await getAccountInitCode(walletAddress, salt);
  
  console.log('🏭 Account Info:');
  console.log('  Wallet (Owner):', walletAddress);
  console.log('  SimpleAccount:', accountAddress);
  console.log('  InitCode:', initCode === '0x' ? 'Already deployed' : 'Will deploy');
  
  const entryPoint = getEntryPointContract();
  const testToken = getTestTokenContract();
  const account = getSimpleAccountContract(accountAddress);
  
  // Get nonce
  const nonce = await entryPoint.getNonce(accountAddress, 0);
  
  // Encode transfer call
  const transferData = testToken.interface.encodeFunctionData('transfer', [to, ethers.parseEther(amount)]);
  
  // Encode execute call for account
  const executeData = account.interface.encodeFunctionData('execute', [
    CONTRACT_ADDRESSES.testToken,
    0,
    transferData
  ]);
  
  // Get gas prices
  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits('20', 'gwei');
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei');
  
  // Adjust gas limits if deploying
  const callGasLimit = initCode !== '0x' ? 250000 : 150000;
  const verificationGasLimit = initCode !== '0x' ? 500000 : 300000;
  
  // Build UserOp
  const userOp: UserOperation = {
    sender: accountAddress,
    nonce: '0x' + nonce.toString(16),
    initCode,
    callData: executeData,
    callGasLimit: '0x' + callGasLimit.toString(16),
    verificationGasLimit: '0x' + verificationGasLimit.toString(16),
    preVerificationGas: '0x' + (50000).toString(16),
    maxFeePerGas: '0x' + maxFeePerGas.toString(16),
    maxPriorityFeePerGas: '0x' + maxPriorityFeePerGas.toString(16),
    paymasterAndData: CONTRACT_ADDRESSES.sponsorPaymaster,
    signature: '0x'
  };
  
  // Sign UserOp
  const userOpHash = await entryPoint.getUserOpHash(userOp);
  const wallet = new ethers.Wallet(privateKey);
  const signature = await wallet.signMessage(ethers.getBytes(userOpHash));
  userOp.signature = signature;
  
  return userOp;
}

// Build a UserOperation for token transfer (legacy - uses existing account)
export async function buildTokenTransferUserOp(
  accountAddress: string,
  to: string,
  amount: string,
  privateKey: string
): Promise<UserOperation> {
  const entryPoint = getEntryPointContract();
  const testToken = getTestTokenContract();
  const account = getSimpleAccountContract(accountAddress);
  
  // Get nonce
  const nonce = await entryPoint.getNonce(accountAddress, 0);
  
  // Encode transfer call
  const transferData = testToken.interface.encodeFunctionData('transfer', [to, ethers.parseEther(amount)]);
  
  // Encode execute call for account
  const executeData = account.interface.encodeFunctionData('execute', [
    CONTRACT_ADDRESSES.testToken,
    0,
    transferData
  ]);
  
  // Get gas prices
  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits('20', 'gwei');
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei');
  
  // Build UserOp
  const userOp: UserOperation = {
    sender: accountAddress,
    nonce: '0x' + nonce.toString(16),
    initCode: '0x',
    callData: executeData,
    callGasLimit: '0x' + (150000).toString(16),
    verificationGasLimit: '0x' + (300000).toString(16),
    preVerificationGas: '0x' + (50000).toString(16),
    maxFeePerGas: '0x' + maxFeePerGas.toString(16),
    maxPriorityFeePerGas: '0x' + maxPriorityFeePerGas.toString(16),
    paymasterAndData: CONTRACT_ADDRESSES.sponsorPaymaster,
    signature: '0x'
  };
  
  // Sign UserOp
  const userOpHash = await entryPoint.getUserOpHash(userOp);
  const wallet = new ethers.Wallet(privateKey);
  const signature = await wallet.signMessage(ethers.getBytes(userOpHash));
  userOp.signature = signature;
  
  return userOp;
}

// Format display values
export function formatEther(value: string | bigint): string {
  return parseFloat(ethers.formatEther(value)).toFixed(4);
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Validation helpers
export function isValidAddress(address: string): boolean {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
}

export function isValidAmount(amount: string): boolean {
  try {
    const parsed = ethers.parseEther(amount);
    return parsed > 0;
  } catch {
    return false;
  }
}

/**
 * Build a UserOperation for batch token transfers from user's wallet
 * Automatically calculates the SimpleAccount address and includes initCode if needed
 */
export async function buildBatchTransferUserOpFromWallet(
  walletAddress: string,
  recipients: Array<{ address: string; amount: string }>,
  privateKey: string,
  salt: number = 0
): Promise<UserOperation> {
  // Calculate the SimpleAccount address for this wallet
  const accountAddress = await getAccountAddress(walletAddress, salt);
  
  // Get initCode (will be '0x' if account already exists)
  const initCode = await getAccountInitCode(walletAddress, salt);
  
  console.log('🏭 Batch Account Info:');
  console.log('  Wallet (Owner):', walletAddress);
  console.log('  SimpleAccount:', accountAddress);
  console.log('  InitCode:', initCode === '0x' ? 'Already deployed' : 'Will deploy');
  
  const entryPoint = getEntryPointContract();
  const testToken = getTestTokenContract();
  
  // Get SimpleAccount contract with executeBatch function
  const account = new ethers.Contract(
    accountAddress,
    [
      'function executeBatch(address[] dest, uint256[] value, bytes[] func)',
      'function owner() view returns (address)'
    ],
    provider
  );
  
  // Get nonce
  const nonce = await entryPoint.getNonce(accountAddress, 0);
  
  // Prepare batch data
  const destinations: string[] = [];
  const values: bigint[] = [];
  const callDatas: string[] = [];
  
  for (const recipient of recipients) {
    destinations.push(CONTRACT_ADDRESSES.testToken);
    values.push(0n); // No ETH being sent
    
    // Encode transfer call for each recipient
    const transferData = testToken.interface.encodeFunctionData('transfer', [
      recipient.address,
      ethers.parseEther(recipient.amount)
    ]);
    callDatas.push(transferData);
  }
  
  // Encode executeBatch call for account
  const executeBatchData = account.interface.encodeFunctionData('executeBatch', [
    destinations,
    values,
    callDatas
  ]);
  
  // Get gas prices
  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits('20', 'gwei');
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei');
  
  // Calculate gas limits (scaled for batch operations and potential deployment)
  const baseGas = initCode !== '0x' ? 200000 : 100000;
  const perTransferGas = 80000;
  const totalCallGas = baseGas + (perTransferGas * recipients.length);
  const verificationGasLimit = initCode !== '0x' ? 500000 : 300000;
  
  // Build UserOp
  const userOp: UserOperation = {
    sender: accountAddress,
    nonce: '0x' + nonce.toString(16),
    initCode,
    callData: executeBatchData,
    callGasLimit: '0x' + totalCallGas.toString(16),
    verificationGasLimit: '0x' + verificationGasLimit.toString(16),
    preVerificationGas: '0x' + (50000).toString(16),
    maxFeePerGas: '0x' + maxFeePerGas.toString(16),
    maxPriorityFeePerGas: '0x' + maxPriorityFeePerGas.toString(16),
    paymasterAndData: CONTRACT_ADDRESSES.sponsorPaymaster,
    signature: '0x'
  };
  
  // Sign UserOp
  const userOpHash = await entryPoint.getUserOpHash(userOp);
  const wallet = new ethers.Wallet(privateKey);
  const signature = await wallet.signMessage(ethers.getBytes(userOpHash));
  userOp.signature = signature;
  
  return userOp;
}

// Build a UserOperation for batch token transfers (legacy - uses existing account)
export async function buildBatchTransferUserOp(
  accountAddress: string,
  recipients: Array<{ address: string; amount: string }>,
  privateKey: string
): Promise<UserOperation> {
  const entryPoint = getEntryPointContract();
  const testToken = getTestTokenContract();
  
  // Get SimpleAccount contract with executeBatch function
  const account = new ethers.Contract(
    accountAddress,
    [
      'function executeBatch(address[] dest, uint256[] value, bytes[] func)',
      'function owner() view returns (address)'
    ],
    provider
  );
  
  // Get nonce
  const nonce = await entryPoint.getNonce(accountAddress, 0);
  
  // Prepare batch data
  const destinations: string[] = [];
  const values: bigint[] = [];
  const callDatas: string[] = [];
  
  for (const recipient of recipients) {
    destinations.push(CONTRACT_ADDRESSES.testToken);
    values.push(0n); // No ETH being sent
    
    // Encode transfer call for each recipient
    const transferData = testToken.interface.encodeFunctionData('transfer', [
      recipient.address,
      ethers.parseEther(recipient.amount)
    ]);
    callDatas.push(transferData);
  }
  
  // Encode executeBatch call for account
  const executeBatchData = account.interface.encodeFunctionData('executeBatch', [
    destinations,
    values,
    callDatas
  ]);
  
  // Get gas prices with proper minimums for bundlers
  const feeData = await provider.getFeeData();
  const networkMaxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits('20', 'gwei');
  const networkMaxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei');
  
  // Ensure minimum gas prices for bundlers (Alchemy requires at least 0.1 gwei priority fee)
  const minPriorityFee = ethers.parseUnits('0.1', 'gwei'); // 100000000 wei
  const maxPriorityFeePerGas = networkMaxPriorityFeePerGas > minPriorityFee 
    ? networkMaxPriorityFeePerGas 
    : minPriorityFee;
  
  const maxFeePerGas = networkMaxFeePerGas > maxPriorityFeePerGas
    ? networkMaxFeePerGas
    : maxPriorityFeePerGas + ethers.parseUnits('1', 'gwei');
  
  // Calculate gas limits (scaled for batch operations)
  const baseGas = 100000;
  const perTransferGas = 80000;
  const totalCallGas = baseGas + (perTransferGas * recipients.length);
  
  // Build UserOp with proper gas values
  const userOp: UserOperation = {
    sender: accountAddress,
    nonce: '0x' + nonce.toString(16),
    initCode: '0x',
    callData: executeBatchData,
    callGasLimit: '0x' + totalCallGas.toString(16),
    verificationGasLimit: '0x' + (300000).toString(16),
    preVerificationGas: '0x' + (51000).toString(16), // Increased from 50000 to 51000 to meet Pimlico requirements
    maxFeePerGas: '0x' + maxFeePerGas.toString(16),
    maxPriorityFeePerGas: '0x' + maxPriorityFeePerGas.toString(16),
    paymasterAndData: CONTRACT_ADDRESSES.sponsorPaymaster,
    signature: '0x'
  };
  
  // Sign UserOp
  const userOpHash = await entryPoint.getUserOpHash(userOp);
  const wallet = new ethers.Wallet(privateKey);
  const signature = await wallet.signMessage(ethers.getBytes(userOpHash));
  userOp.signature = signature;
  
  return userOp;
}