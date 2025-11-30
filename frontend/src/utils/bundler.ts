import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, SEPOLIA_RPC_URL } from '@/config/wagmi';
import { getAllBundlerEndpoints } from '@/config/bundler';

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

export interface UserOperationReceipt {
  userOpHash: string;
  entryPoint: string;
  sender: string;
  nonce: string;
  paymaster?: string;
  actualGasCost: string;
  actualGasUsed: string;
  success: boolean;
  reason?: string;
  receipt: {
    transactionHash: string;
    transactionIndex: number;
    blockHash: string;
    blockNumber: number;
    gasUsed: string;
    cumulativeGasUsed: string;
    logs: unknown[];
  };
}

// Get bundler endpoints from configuration
const BUNDLER_ENDPOINTS = getAllBundlerEndpoints();

// Create ethers provider for Sepolia
export const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

// Bundler client class
export class BundlerClient {
  private endpoints: string[];
  private currentEndpointIndex: number = 0;

  constructor(endpoints: string[] = BUNDLER_ENDPOINTS) {
    this.endpoints = endpoints;
  }

  private async makeRpcCall(method: string, params: unknown[]): Promise<unknown> {
    for (let i = 0; i < this.endpoints.length; i++) {
      try {
        const endpoint = this.endpoints[this.currentEndpointIndex];
        console.log(`🔄 Trying bundler endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method,
            params,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error.message || 'RPC Error');
        }

        return result.result;
      } catch (error) {
        console.warn(`❌ Bundler endpoint failed: ${this.endpoints[this.currentEndpointIndex]}`, error);
        this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.endpoints.length;
        
        if (i === this.endpoints.length - 1) {
          throw new Error(`All bundler endpoints failed. Last error: ${error}`);
        }
      }
    }
  }

  async sendUserOperation(userOp: UserOperation, entryPoint: string): Promise<string> {
    const userOpHash = await this.makeRpcCall('eth_sendUserOperation', [userOp, entryPoint]);
    console.log('✅ UserOperation sent, hash:', userOpHash);
    return userOpHash as string;
  }

  async getUserOperationReceipt(userOpHash: string): Promise<UserOperationReceipt | null> {
    try {
      const receipt = await this.makeRpcCall('eth_getUserOperationReceipt', [userOpHash]);
      return receipt as UserOperationReceipt;
    } catch {
      console.log('ℹ️ Receipt not ready yet, will retry...');
      return null;
    }
  }

  async waitForUserOperationReceipt(userOpHash: string, timeout: number = 60000): Promise<UserOperationReceipt> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const receipt = await this.getUserOperationReceipt(userOpHash);
      if (receipt) {
        console.log('✅ UserOperation confirmed!', receipt);
        return receipt;
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('UserOperation receipt timeout');
  }

  async estimateUserOperationGas(userOp: UserOperation, entryPoint: string): Promise<{
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
  }> {
    return await this.makeRpcCall('eth_estimateUserOperationGas', [userOp, entryPoint]) as {
      callGasLimit: string;
      verificationGasLimit: string;
      preVerificationGas: string;
    };
  }
}

// Global bundler client instance
export const bundlerClient = new BundlerClient();

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
      'function owner() view returns (address)',
      'function getNonce() view returns (uint256)'
    ],
    provider
  );
};

// Build and execute a UserOperation for token transfer
export async function executeTokenTransfer(
  accountAddress: string,
  to: string,
  amount: string,
  privateKey: string
): Promise<{ userOpHash: string; receipt: UserOperationReceipt }> {
  const entryPoint = getEntryPointContract();
  const testToken = getTestTokenContract();
  const account = getSimpleAccountContract(accountAddress);
  
  console.log('🔧 Building UserOperation...');
  
  // Get nonce
  const nonce = await entryPoint.getNonce(accountAddress, 0);
  console.log('📊 Account nonce:', nonce.toString());
  
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
  
  console.log('⛽ Gas prices:', {
    maxFeePerGas: ethers.formatUnits(maxFeePerGas, 'gwei'),
    maxPriorityFeePerGas: ethers.formatUnits(maxPriorityFeePerGas, 'gwei')
  });
  
  // Build initial UserOp (for gas estimation)
  const userOp: UserOperation = {
    sender: accountAddress,
    nonce: '0x' + nonce.toString(16),
    initCode: '0x',
    callData: executeData,
    callGasLimit: '0x30d40', // 200000 in hex with 0x prefix
    verificationGasLimit: '0x61a80', // 400000 in hex
    preVerificationGas: '0xc350', // 50000 in hex
    maxFeePerGas: '0x' + maxFeePerGas.toString(16),
    maxPriorityFeePerGas: '0x' + maxPriorityFeePerGas.toString(16),
    paymasterAndData: CONTRACT_ADDRESSES.sponsorPaymaster,
    signature: '0x'
  };

  // Try to estimate gas (some bundlers support this)
  try {
    console.log('🔍 Estimating gas...');
    const gasEstimate = await bundlerClient.estimateUserOperationGas(userOp, CONTRACT_ADDRESSES.entryPoint);
    
    // Ensure hex format with 0x prefix
    userOp.callGasLimit = typeof gasEstimate.callGasLimit === 'string' && gasEstimate.callGasLimit.startsWith('0x') 
      ? gasEstimate.callGasLimit 
      : '0x' + BigInt(gasEstimate.callGasLimit).toString(16);
    
    userOp.verificationGasLimit = typeof gasEstimate.verificationGasLimit === 'string' && gasEstimate.verificationGasLimit.startsWith('0x')
      ? gasEstimate.verificationGasLimit
      : '0x' + BigInt(gasEstimate.verificationGasLimit).toString(16);
    
    userOp.preVerificationGas = typeof gasEstimate.preVerificationGas === 'string' && gasEstimate.preVerificationGas.startsWith('0x')
      ? gasEstimate.preVerificationGas
      : '0x' + BigInt(gasEstimate.preVerificationGas).toString(16);
    
    console.log('✅ Gas estimation successful:', gasEstimate);
  } catch (error) {
    console.warn('⚠️ Gas estimation failed, using default values:', error);
    // Keep the hex values already set
  }
  
  // Sign UserOp
  console.log('✍️ Signing UserOperation...');
  const userOpHash = await entryPoint.getUserOpHash(userOp);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // SimpleAccount expects EIP-191 message signature
  // Convert hash to bytes and sign as message
  const messageBytes = ethers.getBytes(userOpHash);
  const signature = await wallet.signMessage(messageBytes);
  
  console.log('🔍 Signature details:', {
    userOpHash,
    signatureLength: signature.length,
    signer: wallet.address
  });
  
  userOp.signature = signature;
  
  console.log('📤 Sending UserOperation to bundler...');
  console.log('UserOp details:', {
    sender: userOp.sender,
    nonce: userOp.nonce,
    callData: userOp.callData.slice(0, 20) + '...',
    paymaster: userOp.paymasterAndData
  });
  
  // Try to send to bundler
  try {
    const sentUserOpHash = await bundlerClient.sendUserOperation(userOp, CONTRACT_ADDRESSES.entryPoint);

    console.log('⏳ Waiting for transaction confirmation...');
    const receipt = await bundlerClient.waitForUserOperationReceipt(sentUserOpHash);

    console.log('🎉 Transaction successful!');
    console.log('Receipt:', {
      transactionHash: receipt.receipt.transactionHash,
      gasUsed: receipt.actualGasUsed,
      success: receipt.success
    });

    return {
      userOpHash: sentUserOpHash,
      receipt
    };
  } catch (bundlerError) {
    console.warn('❌ All bundlers failed. Falling back to direct execution:', bundlerError);
    
    // Fallback to direct transfer without ERC-4337 bundler
    return await executeDirectTransfer(to, amount, privateKey);
  }
}

// Build a UserOperation for token transfer (without execution)
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
    callGasLimit: '0x30d40', // 200000 in hex
    verificationGasLimit: '0x61a80', // 400000 in hex
    preVerificationGas: '0xc350', // 50000 in hex
    maxFeePerGas: '0x' + maxFeePerGas.toString(16),
    maxPriorityFeePerGas: '0x' + maxPriorityFeePerGas.toString(16),
    paymasterAndData: CONTRACT_ADDRESSES.sponsorPaymaster,
    signature: '0x'
  };
  
  // Sign UserOp with EIP-191 message signature
  const userOpHash = await entryPoint.getUserOpHash(userOp);
  const wallet = new ethers.Wallet(privateKey);
  const messageBytes = ethers.getBytes(userOpHash);
  const signature = await wallet.signMessage(messageBytes);
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

// Direct execution fallback when bundlers fail
export async function executeDirectTransfer(
  to: string,
  amount: string,
  privateKey: string
): Promise<{ userOpHash: string; receipt: UserOperationReceipt }> {
  console.log('🔄 Executing direct transfer (bypassing bundler)...');
  
  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Create token contract with proper ABI
    const tokenContract = new ethers.Contract(
      CONTRACT_ADDRESSES.testToken,
      ['function transfer(address to, uint256 amount) returns (bool)'],
      wallet
    );
    
    const parsedAmount = ethers.parseEther(amount);
    
    console.log('💸 Sending direct token transfer...');
    const tx = await tokenContract.transfer(to, parsedAmount);
    
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    
    console.log('✅ Direct transfer successful!');
    console.log('Transaction hash:', receipt.hash);
    
    return {
      userOpHash: tx.hash,
      receipt: {
        userOpHash: tx.hash,
        entryPoint: CONTRACT_ADDRESSES.entryPoint,
        sender: wallet.address,
        nonce: '0',
        actualGasCost: receipt.gasUsed.toString(),
        actualGasUsed: receipt.gasUsed.toString(),
        success: true,
        receipt: {
          transactionHash: receipt.hash,
          transactionIndex: receipt.index || 0,
          blockHash: receipt.blockHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          cumulativeGasUsed: receipt.cumulativeGasUsed?.toString() || receipt.gasUsed.toString(),
          logs: receipt.logs || []
        }
      }
    };
  } catch (error) {
    console.error('❌ Direct transfer failed:', error);
    throw error;
  }
}