# 📚 API Reference

Complete API documentation for frontend utilities, components, and hooks.

---

## 📦 Module Overview

```
src/
├── config/
│   └── bundler.ts         → Bundler configuration
├── utils/
│   ├── bundler.ts         → Core bundler utilities
│   └── contractABIs.ts    → Contract ABIs
├── components/
│   ├── AccountInfo.tsx    → Account display
│   ├── TokenBalance.tsx   → Balance display
│   └── SponsoredTransfer.tsx → Transfer UI
└── lib/
    └── wagmi.ts           → Wagmi configuration
```

---

## 🔧 Configuration API

### `config/bundler.ts`

Bundler configuration and endpoint management.

#### Constants

```typescript
export const SEPOLIA_CHAIN_ID: number = 11155111
```
Sepolia testnet chain ID.

#### Types

```typescript
interface BundlerConfig {
  name: string;
  endpoint: string;
  isPrimary: boolean;
  description: string;
}
```

#### Functions

##### `getBundlerEndpoints()`

Get list of all bundler endpoints.

```typescript
export function getBundlerEndpoints(): string[]
```

**Returns:** Array of bundler endpoint URLs

**Example:**
```typescript
const endpoints = getBundlerEndpoints();
// ["https://api.pimlico.io/v2/sepolia/rpc", ...]
```

---

##### `getBundlerConfig(name)`

Get configuration for specific bundler.

```typescript
export function getBundlerConfig(name: string): BundlerConfig | undefined
```

**Parameters:**
- `name`: Bundler name ("pimlico", "biconomy", etc.)

**Returns:** Bundler configuration object or undefined

**Example:**
```typescript
const config = getBundlerConfig("pimlico");
// { name: "pimlico", endpoint: "...", isPrimary: true, ... }
```

---

##### `getCustomBundlerEndpoints()`

Get custom bundler endpoints from environment variables.

```typescript
export function getCustomBundlerEndpoints(): string[]
```

**Returns:** Array of custom bundler URLs from `NEXT_PUBLIC_CUSTOM_BUNDLERS`

**Example:**
```typescript
// .env.local
// NEXT_PUBLIC_CUSTOM_BUNDLERS=https://my-bundler.com,https://another.com

const customs = getCustomBundlerEndpoints();
// ["https://my-bundler.com", "https://another.com"]
```

---

##### `getAllBundlerEndpoints()`

Get all bundlers (default + custom).

```typescript
export function getAllBundlerEndpoints(): string[]
```

**Returns:** Combined array of all bundler endpoints

---

## 🚀 Bundler Client API

### `utils/bundler.ts`

Core Account Abstraction utilities.

#### BundlerClient Class

Main class for interacting with ERC-4337 bundlers.

##### Constructor

```typescript
class BundlerClient {
  constructor()
}
```

Automatically initializes with configured bundler endpoints.

---

##### `createUserOperation()`

Create a UserOperation for token transfer.

```typescript
async createUserOperation(params: {
  sender: string;
  recipient: string;
  amount: bigint;
  ownerPrivateKey: string;
}): Promise<UserOperation>
```

**Parameters:**
- `sender`: SimpleAccount address
- `recipient`: Recipient address
- `amount`: Transfer amount in wei
- `ownerPrivateKey`: Private key of account owner

**Returns:** Signed UserOperation ready for submission

**Throws:**
- `"Invalid sender address"`
- `"Invalid recipient address"`
- `"Invalid amount"`
- `"Invalid private key"`

**Example:**
```typescript
const userOp = await bundlerClient.createUserOperation({
  sender: "0x123...",
  recipient: "0x456...",
  amount: parseEther("100"),
  ownerPrivateKey: "0xabc..."
});
```

---

##### `submitUserOperation()`

Submit UserOperation to bundler.

```typescript
async submitUserOperation(
  userOp: UserOperation
): Promise<{ userOpHash: string }>
```

**Parameters:**
- `userOp`: UserOperation to submit

**Returns:** Object with UserOperation hash

**Throws:**
- Bundler validation errors
- Network errors

**Example:**
```typescript
const { userOpHash } = await bundlerClient.submitUserOperation(userOp);
console.log("UserOp Hash:", userOpHash);
```

---

##### `waitForUserOperation()`

Wait for UserOperation to be mined.

```typescript
async waitForUserOperation(
  userOpHash: string,
  timeoutMs?: number
): Promise<{
  transactionHash: string;
  blockNumber: number;
  success: boolean;
}>
```

**Parameters:**
- `userOpHash`: UserOperation hash from submission
- `timeoutMs`: Timeout in milliseconds (default: 60000)

**Returns:** Transaction details

**Throws:**
- `"UserOperation not found after timeout"`
- Network errors

**Example:**
```typescript
const receipt = await bundlerClient.waitForUserOperation(
  userOpHash,
  120000 // 2 minutes
);

console.log("TX Hash:", receipt.transactionHash);
console.log("Block:", receipt.blockNumber);
```

---

##### `estimateUserOperationGas()`

Estimate gas for UserOperation.

```typescript
async estimateUserOperationGas(
  userOp: UserOperation
): Promise<{
  preVerificationGas: bigint;
  verificationGasLimit: bigint;
  callGasLimit: bigint;
}>
```

**Parameters:**
- `userOp`: UserOperation to estimate

**Returns:** Gas estimates for each phase

**Example:**
```typescript
const estimates = await bundlerClient.estimateUserOperationGas(userOp);
console.log("PreVerification:", estimates.preVerificationGas);
console.log("Verification:", estimates.verificationGasLimit);
console.log("Call:", estimates.callGasLimit);
```

---

##### `sendSponsoredTransfer()`

Complete flow: create, submit, and wait for sponsored transfer.

```typescript
async sendSponsoredTransfer(params: {
  sender: string;
  recipient: string;
  amount: bigint;
  ownerPrivateKey: string;
}): Promise<{
  userOpHash: string;
  transactionHash: string;
  blockNumber: number;
}>
```

**Parameters:**
- `sender`: SimpleAccount address
- `recipient`: Recipient address
- `amount`: Transfer amount in wei
- `ownerPrivateKey`: Account owner's private key

**Returns:** Complete transaction details

**Throws:**
- Any error from create/submit/wait steps

**Example:**
```typescript
const result = await bundlerClient.sendSponsoredTransfer({
  sender: accountAddress,
  recipient: "0x456...",
  amount: parseEther("50"),
  ownerPrivateKey: ownerKey
});

console.log("Success! TX:", result.transactionHash);
```

---

#### Contract Getters

##### `getEntryPointContract()`

Get EntryPoint contract instance.

```typescript
export function getEntryPointContract(): ethers.Contract
```

**Returns:** EntryPoint contract with connected provider

**Example:**
```typescript
const entryPoint = getEntryPointContract();
const nonce = await entryPoint.getNonce(accountAddress, 0);
```

---

##### `getTestTokenContract()`

Get TestToken contract instance.

```typescript
export function getTestTokenContract(): ethers.Contract
```

**Returns:** TestToken contract with connected provider

**Example:**
```typescript
const token = getTestTokenContract();
const balance = await token.balanceOf(address);
const symbol = await token.symbol(); // "TEST"
```

---

##### `getSimpleAccountContract()`

Get SimpleAccount contract instance.

```typescript
export function getSimpleAccountContract(
  accountAddress: string
): ethers.Contract
```

**Parameters:**
- `accountAddress`: Address of SimpleAccount

**Returns:** SimpleAccount contract instance

**Example:**
```typescript
const account = getSimpleAccountContract("0x123...");
const owner = await account.owner();
const nonce = await account.getNonce();
```

---

##### `getPaymasterContract()`

Get SponsorPaymaster contract instance.

```typescript
export function getPaymasterContract(): ethers.Contract
```

**Returns:** SponsorPaymaster contract instance

**Example:**
```typescript
const paymaster = getPaymasterContract();
const isWhitelisted = await paymaster.whitelist(accountAddress);
```

---

#### Utility Functions

##### `formatEther()`

Format wei value to ether string.

```typescript
export function formatEther(value: string | bigint): string
```

**Parameters:**
- `value`: Wei amount (string or bigint)

**Returns:** Formatted ether string

**Example:**
```typescript
formatEther("1000000000000000000") // "1.0"
formatEther(parseEther("100.5"))   // "100.5"
```

---

##### `formatAddress()`

Format address to shortened version.

```typescript
export function formatAddress(address: string): string
```

**Parameters:**
- `address`: Ethereum address

**Returns:** Shortened address (0x1234...5678)

**Example:**
```typescript
formatAddress("0x1234567890123456789012345678901234567890")
// "0x1234...7890"
```

---

##### `isValidAddress()`

Check if string is valid Ethereum address.

```typescript
export function isValidAddress(address: string): boolean
```

**Parameters:**
- `address`: String to validate

**Returns:** `true` if valid address

**Example:**
```typescript
isValidAddress("0x123...")  // true
isValidAddress("not-valid") // false
```

---

##### `isValidAmount()`

Check if string is valid amount.

```typescript
export function isValidAmount(amount: string): boolean
```

**Parameters:**
- `amount`: String to validate

**Returns:** `true` if valid number > 0

**Example:**
```typescript
isValidAmount("100.5")  // true
isValidAmount("0")      // false
isValidAmount("abc")    // false
```

---

## 📄 Contract ABIs

### `utils/contractABIs.ts`

Contract ABI definitions.

#### Exported ABIs

```typescript
export const TestTokenABI: AbiItem[]
export const SimpleAccountFactoryABI: AbiItem[]
export const SponsorPaymasterABI: AbiItem[]
export const SimpleAccountABI: AbiItem[]
export const EntryPointABI: AbiItem[]
```

**Usage:**
```typescript
import { TestTokenABI } from '@/utils/contractABIs';

const contract = new ethers.Contract(address, TestTokenABI, provider);
```

---

## 🎨 React Components API

### `<SponsoredTransfer />`

Component for sending sponsored token transfers.

#### Props

```typescript
interface SponsoredTransferProps {
  accountAddress: string;
  ownerPrivateKey: string;
  onSuccess?: (result: TransferResult) => void;
  onError?: (error: Error) => void;
}
```

#### Example

```typescript
<SponsoredTransfer
  accountAddress="0x123..."
  ownerPrivateKey="0xabc..."
  onSuccess={(result) => {
    console.log("Transfer successful:", result.transactionHash);
  }}
  onError={(error) => {
    console.error("Transfer failed:", error);
  }}
/>
```

---

### `<TokenBalance />`

Display token balance.

#### Props

```typescript
interface TokenBalanceProps {
  address: string;
  tokenAddress?: string;  // Default: TestToken
  autoRefresh?: boolean;  // Default: true
  refreshInterval?: number; // Default: 10000ms
}
```

#### Example

```typescript
<TokenBalance
  address={userAddress}
  autoRefresh={true}
  refreshInterval={15000}
/>
```

---

### `<AccountInfo />`

Display account information.

#### Props

```typescript
interface AccountInfoProps {
  accountAddress: string;
  showNonce?: boolean;
  showOwner?: boolean;
}
```

#### Example

```typescript
<AccountInfo
  accountAddress="0x123..."
  showNonce={true}
  showOwner={true}
/>
```

---

## 🔗 Contract Addresses

All deployed on Sepolia testnet:

```typescript
export const CONTRACTS = {
  ENTRY_POINT: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  TEST_TOKEN: "0x4eEE914a9Da7cAB89e5Bd2F01B5aea14327B3cC1",
  SPONSOR_PAYMASTER: "0xd6fC41c0c3D14Cac0c66Af4a0E8eFc6a4a47A20d",
  SIMPLE_ACCOUNT_FACTORY: "0xd74F11eeEF835d8b46b7329c8A00BD95bEd59704"
} as const;
```

---

## 🔄 Types & Interfaces

### UserOperation

```typescript
interface UserOperation {
  sender: string;           // Account address
  nonce: bigint;           // Anti-replay
  initCode: string;        // Account creation code
  callData: string;        // Execution data
  callGasLimit: bigint;    // Gas for execution
  verificationGasLimit: bigint; // Gas for verification
  preVerificationGas: bigint;   // Gas overhead
  maxFeePerGas: bigint;    // Max gas price
  maxPriorityFeePerGas: bigint; // Miner tip
  paymasterAndData: string; // Paymaster info
  signature: string;        // Owner signature
}
```

### TransferResult

```typescript
interface TransferResult {
  userOpHash: string;
  transactionHash: string;
  blockNumber: number;
  success: boolean;
  gasUsed?: bigint;
}
```

---

## ⚠️ Error Handling

### Common Errors

```typescript
try {
  const result = await bundlerClient.sendSponsoredTransfer(...);
} catch (error) {
  if (error.message.includes("insufficient funds")) {
    // Handle insufficient balance
  } else if (error.message.includes("not whitelisted")) {
    // Handle not whitelisted
  } else if (error.message.includes("timeout")) {
    // Handle timeout
  } else {
    // Handle other errors
  }
}
```

### Error Types

| Error | Cause | Solution |
|-------|-------|----------|
| `"Invalid sender address"` | Malformed address | Check address format |
| `"User not whitelisted"` | Account not whitelisted | Add to paymaster whitelist |
| `"Insufficient balance"` | Not enough tokens | Mint more TEST tokens |
| `"UserOperation not found"` | Timeout waiting | Increase timeout or retry |
| `"Bundler unavailable"` | Network issues | Check bundler status |

---

## 🧪 Testing Utilities

### Mock Data

```typescript
export const MOCK_USER_OP: UserOperation = {
  sender: "0x...",
  nonce: 0n,
  // ... other fields
};

export const MOCK_ACCOUNT_ADDRESS = "0x123...";
export const MOCK_PRIVATE_KEY = "0xabc...";
```

### Test Helpers

```typescript
export async function createTestAccount(): Promise<{
  address: string;
  privateKey: string;
}> {
  // Implementation
}

export async function fundTestAccount(
  address: string,
  amount: bigint
): Promise<void> {
  // Implementation
}
```

---

## 📊 Performance Considerations

### Gas Costs

| Operation | Avg Gas | Cost (@2000 gwei) |
|-----------|---------|-------------------|
| Create UserOp | ~150,000 | ~$0.60 |
| Submit to Bundler | 0 (off-chain) | $0 |
| On-chain execution | ~150,000 | ~$0.60 |
| **Total** | ~150,000 | ~$0.60 |

### Optimization Tips

1. **Batch Operations**
   ```typescript
   // Use executeBatch instead of multiple execute calls
   await account.executeBatch([dest1, dest2], [data1, data2]);
   ```

2. **Reuse UserOps**
   ```typescript
   // Cache gas estimates
   const estimates = await estimateGas(userOp);
   // Reuse for similar operations
   ```

3. **Minimize State Changes**
   ```typescript
   // Check before executing
   if (await needsUpdate()) {
     await execute();
   }
   ```

---

## 🔐 Security Best Practices

### Private Key Management

```typescript
// ❌ Don't hardcode
const key = "0x1234...";

// ✅ Use environment variables
const key = process.env.PRIVATE_KEY;

// ✅ Client-side: use wallet connection
const key = await walletClient.getPrivateKey();
```

### Input Validation

```typescript
// Always validate inputs
if (!isValidAddress(recipient)) {
  throw new Error("Invalid recipient");
}

if (!isValidAmount(amount)) {
  throw new Error("Invalid amount");
}
```

### Error Handling

```typescript
// Always handle errors
try {
  await sendTransfer(...);
} catch (error) {
  console.error("Transfer failed:", error);
  // Show user-friendly message
  showError("Transfer failed. Please try again.");
}
```

---

## 📚 Additional Resources

- [ERC-4337 Spec](https://eips.ethereum.org/EIPS/eip-4337)
- [ethers.js Documentation](https://docs.ethers.org)
- [wagmi Documentation](https://wagmi.sh)
- [Pimlico Docs](https://docs.pimlico.io)

---

**Last Updated:** December 2, 2025
**API Version:** 1.0.0
