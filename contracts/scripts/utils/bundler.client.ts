/**
 * Bundler RPC Client for ERC-4337
 * 
 * This client handles communication with ERC-4337 bundler services
 * to submit UserOperations and retrieve receipts.
 */

import { ethers } from 'ethers';
import chalk from 'chalk';
import { getAllBundlerEndpoints } from '../config/bundler.config';

export interface UserOperation {
  sender: string;
  nonce: string | bigint;
  initCode: string;
  callData: string;
  callGasLimit: string | bigint;
  verificationGasLimit: string | bigint;
  preVerificationGas: string | bigint;
  maxFeePerGas: string | bigint;
  maxPriorityFeePerGas: string | bigint;
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
    logs: any[];
    status: number;
  };
}

/**
 * Normalize UserOperation values to hex strings
 */
function normalizeUserOp(userOp: UserOperation): any {
  return {
    sender: userOp.sender,
    nonce: typeof userOp.nonce === 'bigint' ? '0x' + userOp.nonce.toString(16) : userOp.nonce,
    initCode: userOp.initCode,
    callData: userOp.callData,
    callGasLimit: typeof userOp.callGasLimit === 'bigint' ? '0x' + userOp.callGasLimit.toString(16) : userOp.callGasLimit,
    verificationGasLimit: typeof userOp.verificationGasLimit === 'bigint' ? '0x' + userOp.verificationGasLimit.toString(16) : userOp.verificationGasLimit,
    preVerificationGas: typeof userOp.preVerificationGas === 'bigint' ? '0x' + userOp.preVerificationGas.toString(16) : userOp.preVerificationGas,
    maxFeePerGas: typeof userOp.maxFeePerGas === 'bigint' ? '0x' + userOp.maxFeePerGas.toString(16) : userOp.maxFeePerGas,
    maxPriorityFeePerGas: typeof userOp.maxPriorityFeePerGas === 'bigint' ? '0x' + userOp.maxPriorityFeePerGas.toString(16) : userOp.maxPriorityFeePerGas,
    paymasterAndData: userOp.paymasterAndData,
    signature: userOp.signature,
  };
}

/**
 * BundlerClient - Handles RPC communication with ERC-4337 bundlers
 */
export class BundlerClient {
  private endpoints: string[];
  private currentEndpointIndex: number = 0;

  constructor(endpoints?: string[]) {
    this.endpoints = endpoints || getAllBundlerEndpoints();
  }

  /**
   * Make an RPC call to the bundler
   * Automatically retries with different endpoints on failure
   */
  private async makeRpcCall(method: string, params: any[]): Promise<any> {
    const maxRetries = this.endpoints.length;

    for (let i = 0; i < maxRetries; i++) {
      const endpoint = this.endpoints[this.currentEndpointIndex];
      
      try {
        console.log(chalk.cyan(`\n🔄 Trying bundler: ${this.getBundlerName(endpoint)}`));
        console.log(chalk.gray(`   Method: ${method}`));
        
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

        const result: any = await response.json();

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${result.error?.message || response.statusText}`);
        }

        if (result.error) {
          console.error(chalk.red(`❌ RPC Error: ${result.error.message}`));
          if (result.error.data) {
            console.error(chalk.red(`   Data: ${JSON.stringify(result.error.data)}`));
          }
          throw new Error(result.error.message || JSON.stringify(result.error));
        }

        console.log(chalk.green(`✅ Success!`));
        return result.result;

      } catch (error: any) {
        console.warn(chalk.yellow(`⚠️  Bundler failed: ${error.message}`));
        
        // Try next endpoint
        this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.endpoints.length;

        // If this was the last endpoint, throw error
        if (i === maxRetries - 1) {
          throw new Error(`All ${maxRetries} bundler endpoint(s) failed. Last error: ${error.message}`);
        }
      }
    }

    throw new Error('All bundler endpoints failed');
  }

  /**
   * Get bundler name from endpoint URL
   */
  private getBundlerName(endpoint: string): string {
    if (endpoint.includes('pimlico')) return 'Pimlico';
    if (endpoint.includes('stackup')) return 'Stackup';
    if (endpoint.includes('alchemy')) return 'Alchemy';
    return 'Unknown';
  }

  /**
   * Send UserOperation to bundler
   * @returns UserOperation hash
   */
  async sendUserOperation(userOp: UserOperation, entryPoint: string): Promise<string> {
    console.log(chalk.blue('\n📤 Sending UserOperation to bundler...'));
    
    const normalizedUserOp = normalizeUserOp(userOp);
    
    // Log UserOp details
    console.log(chalk.gray('\nUserOperation Details:'));
    console.log(chalk.gray(`  Sender: ${normalizedUserOp.sender}`));
    console.log(chalk.gray(`  Nonce: ${normalizedUserOp.nonce}`));
    console.log(chalk.gray(`  CallData: ${normalizedUserOp.callData.slice(0, 66)}...`));
    console.log(chalk.gray(`  Paymaster: ${normalizedUserOp.paymasterAndData.slice(0, 42)}`));

    const userOpHash = await this.makeRpcCall('eth_sendUserOperation', [normalizedUserOp, entryPoint]);
    
    console.log(chalk.green(`\n✅ UserOperation submitted successfully!`));
    console.log(chalk.green(`   UserOp Hash: ${userOpHash}`));
    
    return userOpHash;
  }

  /**
   * Get UserOperation receipt
   * @returns Receipt or null if not yet mined
   */
  async getUserOperationReceipt(userOpHash: string): Promise<UserOperationReceipt | null> {
    try {
      const receipt = await this.makeRpcCall('eth_getUserOperationReceipt', [userOpHash]);
      return receipt as UserOperationReceipt;
    } catch (error: any) {
      // Receipt not ready yet (this is normal)
      if (error.message.includes('not found') || error.message.includes('UserOperation not found')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Wait for UserOperation receipt with timeout
   * @param userOpHash UserOperation hash
   * @param timeout Timeout in milliseconds (default: 60 seconds)
   * @param pollInterval Poll interval in milliseconds (default: 2 seconds)
   */
  async waitForUserOperationReceipt(
    userOpHash: string,
    timeout: number = 60000,
    pollInterval: number = 2000
  ): Promise<UserOperationReceipt> {
    console.log(chalk.blue(`\n⏳ Waiting for UserOperation confirmation...`));
    console.log(chalk.gray(`   UserOp Hash: ${userOpHash}`));
    
    const startTime = Date.now();
    let attempts = 0;

    while (Date.now() - startTime < timeout) {
      attempts++;
      
      const receipt = await this.getUserOperationReceipt(userOpHash);
      
      if (receipt) {
        console.log(chalk.green(`\n✅ UserOperation confirmed after ${attempts} attempt(s)!`));
        console.log(chalk.green(`   Transaction Hash: ${receipt.receipt.transactionHash}`));
        console.log(chalk.green(`   Block Number: ${receipt.receipt.blockNumber}`));
        console.log(chalk.green(`   Gas Used: ${receipt.actualGasUsed}`));
        console.log(chalk.green(`   Status: ${receipt.success ? 'Success' : 'Failed'}`));
        
        if (receipt.paymaster) {
          console.log(chalk.green(`   Paymaster: ${receipt.paymaster} (Gas Sponsored! 🎉)`));
        }
        
        return receipt;
      }

      // Log progress
      if (attempts % 5 === 0) {
        console.log(chalk.gray(`   Still waiting... (attempt ${attempts}, ${Math.floor((Date.now() - startTime) / 1000)}s elapsed)`));
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`UserOperation receipt timeout after ${timeout}ms (${attempts} attempts)`);
  }

  /**
   * Estimate gas for UserOperation
   */
  async estimateUserOperationGas(
    userOp: UserOperation,
    entryPoint: string
  ): Promise<{
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
  }> {
    console.log(chalk.blue('\n⛽ Estimating gas for UserOperation...'));
    
    const normalizedUserOp = normalizeUserOp(userOp);
    
    const gasEstimate = await this.makeRpcCall('eth_estimateUserOperationGas', [normalizedUserOp, entryPoint]);
    
    console.log(chalk.green('\n✅ Gas estimation complete:'));
    console.log(chalk.green(`   Call Gas Limit: ${gasEstimate.callGasLimit}`));
    console.log(chalk.green(`   Verification Gas Limit: ${gasEstimate.verificationGasLimit}`));
    console.log(chalk.green(`   Pre-verification Gas: ${gasEstimate.preVerificationGas}`));
    
    return gasEstimate;
  }

  /**
   * Get supported EntryPoints
   */
  async getSupportedEntryPoints(): Promise<string[]> {
    return await this.makeRpcCall('eth_supportedEntryPoints', []);
  }

  /**
   * Get chain ID
   */
  async getChainId(): Promise<string> {
    return await this.makeRpcCall('eth_chainId', []);
  }

  /**
   * Get bundler-specific gas prices for UserOperations
   */
  async getUserOperationGasPrice(): Promise<{
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  }> {
    try {
      // Try Pimlico-specific method first
      const pimlicoGasPrice = await this.makeRpcCall('pimlico_getUserOperationGasPrice', []);
      return pimlicoGasPrice;
    } catch (error) {
      try {
        // Try Stackup-specific method
        const stackupGasPrice = await this.makeRpcCall('stackup_getUserOperationGasPrice', []);
        return stackupGasPrice;
      } catch (error) {
        try {
          // Try generic method
          const genericGasPrice = await this.makeRpcCall('eth_getUserOperationGasPrice', []);
          return genericGasPrice;
        } catch (error) {
          // Fallback to network gas prices with higher multipliers for bundler requirements
          console.log(chalk.yellow('⚠️  Bundler gas price API not available, using fallback...'));
          
          // Use significantly higher gas prices as fallback
          return {
            maxFeePerGas: '0x' + (2000000000n).toString(16), // 2 gwei minimum
            maxPriorityFeePerGas: '0x' + (1500000000n).toString(16) // 1.5 gwei minimum
          };
        }
      }
    }
  }
}

/**
 * Create a singleton bundler client instance
 */
let bundlerClientInstance: BundlerClient | null = null;

export function getBundlerClient(endpoints?: string[]): BundlerClient {
  if (!bundlerClientInstance) {
    bundlerClientInstance = new BundlerClient(endpoints);
  }
  return bundlerClientInstance;
}
