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
      'function owner() view returns (address)'
    ],
    provider
  );
};

// Build a UserOperation for token transfer
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