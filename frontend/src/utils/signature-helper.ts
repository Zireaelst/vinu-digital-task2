import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, SEPOLIA_RPC_URL } from '@/config/wagmi';
import { UserOperation } from './bundler';

// Create provider
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

/**
 * Sign UserOperation hash for SimpleAccount
 * SimpleAccount expects ECDSA signature over the userOpHash
 */
export async function signUserOperationHash(
  userOpHash: string,
  privateKey: string
): Promise<string> {
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // For SimpleAccount, we need to sign the hash as bytes (not as prefixed message)
  // The SimpleAccount contract will validate this signature directly
  const signature = await wallet.signingKey.sign(userOpHash);
  
  // Convert signature to string format (r + s + v)
  return ethers.Signature.from(signature).serialized;
}

/**
 * Verify that the private key matches the SimpleAccount owner
 */
export async function verifyAccountOwner(
  accountAddress: string,
  privateKey: string
): Promise<boolean> {
  try {
    const wallet = new ethers.Wallet(privateKey);
    const expectedOwner = wallet.address;
    
    const accountContract = new ethers.Contract(
      accountAddress,
      ['function owner() view returns (address)'],
      provider
    );
    
    const actualOwner = await accountContract.owner();
    return actualOwner.toLowerCase() === expectedOwner.toLowerCase();
  } catch (error) {
    console.error('Error verifying account owner:', error);
    return false;
  }
}

/**
 * Get the proper UserOperation hash for signing
 */
export async function getUserOperationHash(userOp: UserOperation): Promise<string> {
  const entryPointContract = new ethers.Contract(
    CONTRACT_ADDRESSES.entryPoint,
    [
      'function getUserOpHash(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) userOp) view returns (bytes32)'
    ],
    provider
  );
  
  return await entryPointContract.getUserOpHash(userOp);
}