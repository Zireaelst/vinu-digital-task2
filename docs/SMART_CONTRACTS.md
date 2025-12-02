# 🔐 Smart Contracts Documentation

Comprehensive guide to all smart contracts in the ERC-4337 Account Abstraction system.

---

## 📋 Contract Overview

| Contract | Type | Purpose | Gas Efficient |
|----------|------|---------|---------------|
| **EntryPoint** | Core | ERC-4337 singleton entry point | ✅ Optimized |
| **SimpleAccount** | Wallet | User's smart contract wallet | ✅ Minimal overhead |
| **SimpleAccountFactory** | Factory | Creates SimpleAccount instances | ✅ CREATE2 |
| **SponsorPaymaster** | Paymaster | Sponsors gas for UserOps | ✅ Batch validation |
| **TestToken** | ERC-20 | Test token for demos | ✅ Standard |

---

## 🏗️ Contract Details

### 1. EntryPoint (Official ERC-4337)

**Address:** `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` (Canonical)

**Purpose:** 
- Central coordinator for all UserOperations
- Validates and executes account operations
- Manages paymaster interactions
- Handles gas accounting

**Key Functions:**
```solidity
function handleOps(UserOperation[] calldata ops, address payable beneficiary)
function getUserOpHash(UserOperation calldata userOp) returns (bytes32)
function getNonce(address sender, uint192 key) returns (uint256)
```

**Gas Characteristics:**
- Base gas: ~42,000 per UserOp
- Verification gas: ~100,000 (depends on account logic)
- Call gas: Variable (depends on operation)

**Why We Don't Deploy It:**
- Official canonical contract already deployed on Sepolia
- Using standard address ensures compatibility with all bundlers
- Immutable and battle-tested implementation

---

### 2. SimpleAccount

**Location:** `contracts/core/SimpleAccount.sol`

**Purpose:**
Individual smart contract wallet for each user implementing ERC-4337 standard.

**Inheritance:**
```solidity
SimpleAccount 
  ├─ BaseAccount (from @account-abstraction)
  └─ Initializable (from OpenZeppelin)
```

**Key Features:**

#### 🔑 Owner Management
```solidity
address public owner;  // EOA that controls this account

function initialize(address anOwner) public initializer {
    super.initialize(anOwner);
}
```

#### ✅ Signature Validation
```solidity
function validateUserOp(
    UserOperation calldata userOp,
    bytes32 userOpHash,
    uint256 missingAccountFunds
) external override returns (uint256 validationData) {
    // Validates ECDSA signature from owner
    // Returns 0 for valid, 1 for invalid
}
```

#### 📤 Execute Operations
```solidity
function execute(address dest, uint256 value, bytes calldata func) external {
    // Can only be called by EntryPoint
    // Executes arbitrary calls on behalf of account
}

function executeBatch(address[] calldata dest, bytes[] calldata func) external {
    // Batch execution for gas efficiency
}
```

#### 🔢 Nonce Management
```solidity
function getNonce() public view returns (uint256) {
    return entryPoint().getNonce(address(this), 0);
}
```

**State Variables:**
- `owner`: Address that controls the account
- `entryPoint`: Reference to EntryPoint contract

**Gas Optimization:**
- Minimal storage (only owner address)
- Delegate validation to EntryPoint
- Batch operations supported

**Security Features:**
- ✅ Only EntryPoint can call `execute()`
- ✅ Owner signature required for all operations
- ✅ Nonce protection against replay attacks
- ✅ Inherits OpenZeppelin security patterns

---

### 3. SimpleAccountFactory

**Location:** `contracts/core/SimpleAccountFactory.sol`

**Purpose:**
Factory contract that creates deterministic SimpleAccount instances using CREATE2.

**Key Functions:**

#### 🏭 Create Account
```solidity
function createAccount(address owner, uint256 salt) public returns (SimpleAccount) {
    // Creates account using CREATE2 for deterministic addresses
    address addr = getAddress(owner, salt);
    
    if (addr.code.length > 0) {
        return SimpleAccount(payable(addr));
    }
    
    return SimpleAccount(
        payable(
            new ERC1967Proxy{salt: bytes32(salt)}(
                address(accountImplementation),
                abi.encodeCall(SimpleAccount.initialize, (owner))
            )
        )
    );
}
```

#### 🔮 Predict Address
```solidity
function getAddress(address owner, uint256 salt) public view returns (address) {
    // Calculates address before deployment
    // Same owner + salt = same address
    return Create2.computeAddress(
        bytes32(salt),
        keccak256(abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(
                address(accountImplementation),
                abi.encodeCall(SimpleAccount.initialize, (owner))
            )
        ))
    );
}
```

**Why CREATE2?**
- ✅ Deterministic addresses (predictable before deployment)
- ✅ Same address across all chains
- ✅ Can send funds before account exists
- ✅ Gas efficient (only deploy when needed)

**Design Pattern:**
```
User wants account
    ↓
Calculate address with CREATE2
    ↓
Check if already deployed (code.length > 0)
    ↓
If not, deploy with CREATE2
    ↓
Return account address
```

**Gas Costs:**
- First deployment: ~250,000 gas
- Already deployed: ~50,000 gas (just returns address)

---

### 4. SponsorPaymaster

**Location:** `contracts/paymaster/SponsorPaymaster.sol`

**Purpose:**
Paymaster contract that sponsors gas fees for approved UserOperations.

**Inheritance:**
```solidity
SponsorPaymaster
  ├─ BasePaymaster (from @account-abstraction)
  └─ Ownable (from OpenZeppelin)
```

**Key Features:**

#### 💰 Deposit Management
```solidity
function depositForSponsor() external payable {
    require(msg.value >= MINIMUM_DEPOSIT, "deposit too small");
    entryPoint.depositTo{value: msg.value}(address(this));
    sponsorDeposits[msg.sender] += msg.value;
}

function withdrawDeposit(address payable withdrawAddress, uint256 amount) external onlyOwner {
    entryPoint.withdrawTo(withdrawAddress, amount);
}
```

#### 🎫 Whitelist System
```solidity
mapping(address => bool) public whitelist;

function setWhitelist(address user, bool whitelisted) external onlyOwner {
    whitelist[user] = whitelisted;
}
```

#### ✅ Validate UserOp
```solidity
function _validatePaymasterUserOp(
    UserOperation calldata userOp,
    bytes32 userOpHash,
    uint256 maxCost
) internal view override returns (bytes memory context, uint256 validationData) {
    // Check if sender is whitelisted
    require(whitelist[userOp.sender], "User not whitelisted");
    
    // Check if max cost is acceptable
    require(maxCost <= maxCostPerUserOp, "UserOp cost too high");
    
    return ("", 0); // 0 = valid
}
```

#### 💸 Post-Op Accounting
```solidity
function _postOp(
    PostOpMode mode,
    bytes calldata context,
    uint256 actualGasCost
) internal override {
    emit UserOpSponsored(msg.sender, actualGasCost);
}
```

**State Variables:**
```solidity
mapping(address => bool) public whitelist;           // Approved users
mapping(address => uint256) public sponsorDeposits;  // Sponsor balances
uint256 public constant MINIMUM_DEPOSIT = 0.01 ether;
uint256 public maxCostPerUserOp = 0.005 ether;       // Max gas cost per op
```

**Gas Sponsorship Flow:**
```
1. Sponsor deposits ETH → entryPoint.depositTo()
2. User submits UserOp with paymasterAndData
3. EntryPoint calls validatePaymasterUserOp()
4. Paymaster checks whitelist
5. EntryPoint deducts gas from paymaster's deposit
6. Paymaster._postOp() called for accounting
```

**Security Features:**
- ✅ Whitelist prevents unauthorized usage
- ✅ Max cost limit prevents gas griefing
- ✅ Owner-only deposit withdrawal
- ✅ Minimum deposit requirement
- ✅ Per-operation gas tracking

**Configuration:**
```solidity
// Owner can adjust these
maxCostPerUserOp = 0.005 ether;  // Adjust max gas per UserOp
MINIMUM_DEPOSIT = 0.01 ether;     // Minimum sponsor deposit
```

---

### 5. TestToken

**Location:** `contracts/token/TestToken.sol`

**Purpose:**
Standard ERC-20 token for testing sponsored transfers.

**Features:**
```solidity
contract TestToken is ERC20 {
    constructor() ERC20("Test Token", "TEST") {
        _mint(msg.sender, 1000000 * 10**18); // 1M tokens
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount); // Anyone can mint for testing
    }
}
```

**Token Details:**
- **Name:** Test Token
- **Symbol:** TEST
- **Decimals:** 18
- **Initial Supply:** 1,000,000 TEST
- **Mintable:** Yes (for testing)

**Why Mintable?**
- Easy testing without faucets
- Can create any scenario
- No real value (testnet only)

---

## 🔄 Contract Interaction Flow

### Complete UserOperation Flow

```
1. User Frontend
   ↓ (create UserOp)
2. Bundler
   ↓ (submit to chain)
3. EntryPoint.handleOps()
   ↓ (validate)
4. SponsorPaymaster.validatePaymasterUserOp()
   ↓ (check whitelist)
5. SimpleAccount.validateUserOp()
   ↓ (check signature)
6. SimpleAccount.execute()
   ↓ (call target)
7. TestToken.transfer()
   ↓ (execute)
8. SponsorPaymaster._postOp()
   ↓ (accounting)
9. Return success to bundler
```

### Gas Payment Flow

```
Traditional Transaction:
User → pays gas → executes

With Account Abstraction:
Sponsor deposits ETH → Paymaster
User creates UserOp (no ETH needed)
EntryPoint deducts from Paymaster
Transaction executes
User pays $0 in gas! 🎉
```

---

## 📊 Gas Analysis

### Deployment Costs

| Contract | Gas | ETH (@2000 gwei) |
|----------|-----|------------------|
| SimpleAccountFactory | ~2,500,000 | ~0.005 ETH |
| SponsorPaymaster | ~1,800,000 | ~0.0036 ETH |
| TestToken | ~1,200,000 | ~0.0024 ETH |
| SimpleAccount (per user) | ~250,000 | ~0.0005 ETH |

### Operation Costs

| Operation | Gas | Notes |
|-----------|-----|-------|
| Create Account | ~250,000 | Only first time |
| Sponsored Transfer | ~150,000 | Paid by Paymaster |
| Regular Transfer | ~50,000 | Direct token transfer |
| Batch Transfer (5x) | ~200,000 | Gas efficient for multiple ops |

---

## 🔒 Security Considerations

### SimpleAccount Security
- ✅ Owner-only control via signature
- ✅ EntryPoint-only execution
- ✅ Nonce protection
- ⚠️ Single owner (no multisig)

### Paymaster Security
- ✅ Whitelist protection
- ✅ Gas limit per operation
- ✅ Owner-only configuration
- ⚠️ Centralized whitelist (owner controls)

### Factory Security
- ✅ Deterministic addresses
- ✅ Proxy pattern for upgrades
- ✅ Minimal attack surface
- ✅ No funds held by factory

---

## 🧪 Testing

Each contract has comprehensive tests:

```bash
# Run all contract tests
npm test

# Test specific contract
npx hardhat test test/SponsorPaymaster.test.ts
npx hardhat test test/TestToken.test.ts
```

**Coverage:**
- ✅ 27 total tests
- ✅ All critical paths covered
- ✅ Edge cases validated
- ✅ Gas optimization verified

---

## 📚 References

- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Account Abstraction Repository](https://github.com/eth-infinitism/account-abstraction)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [CREATE2 Explained](https://docs.openzeppelin.com/cli/2.8/deploying-with-create2)

---

## 🔗 Contract Addresses (Sepolia)

| Contract | Address | Verified |
|----------|---------|----------|
| EntryPoint | `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` | ✅ Official |
| SimpleAccountFactory | `0xd74F11eeEF835d8b46b7329c8A00BD95bEd59704` | ✅ [View](https://sepolia.etherscan.io/address/0xd74F11eeEF835d8b46b7329c8A00BD95bEd59704) |
| SponsorPaymaster | `0xd6fC41c0c3D14Cac0c66Af4a0E8eFc6a4a47A20d` | ✅ [View](https://sepolia.etherscan.io/address/0xd6fC41c0c3D14Cac0c66Af4a0E8eFc6a4a47A20d) |
| TestToken | `0x4eEE914a9Da7cAB89e5Bd2F01B5aea14327B3cC1` | ✅ [View](https://sepolia.etherscan.io/address/0x4eEE914a9Da7cAB89e5Bd2F01B5aea14327B3cC1) |

---

**📝 Note:** All contracts are deployed on Sepolia testnet and verified on Etherscan for transparency.
