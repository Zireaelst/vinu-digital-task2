# 🔐 Smart Contracts - ERC-4337 Account Abstraction

> Production-ready Account Abstraction implementation with Paymaster-sponsored transactions on Sepolia Testnet

## 📋 Overview

This directory contains the Solidity smart contracts implementing the **ERC-4337 Account Abstraction** standard. The system enables gasless transactions where a Paymaster sponsors gas fees for ERC-20 token transfers, providing seamless UX for end users.

## 🏗️ Contract Architecture

### Core Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| **SimpleAccount** | [Etherscan](https://sepolia.etherscan.io/) | Individual smart contract wallet for each user |
| **SimpleAccountFactory** | `0xd74F11eeEF835d8b46b7329c8A00BD95bEd59704` | Factory contract for deploying SimpleAccount instances |
| **TestToken** | `0x4eEE914a9Da7cAB89e5Bd2F01B5aea14327B3cC1` | ERC-20 token for testing sponsored transfers |
| **SponsorPaymaster** | `0xd6fC41c0c3D14Cac0c66Af4a0E8eFc6a4a47A20d` | Paymaster that sponsors gas fees for UserOperations |
| **EntryPoint** | `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` | Canonical ERC-4337 EntryPoint (official) |

### Contract Relationships

```
┌─────────────────┐
│   EntryPoint    │  ← Canonical ERC-4337 contract
└────────┬────────┘
         │
    ┌────┴────────────────────┐
    │                         │
┌───▼────────────┐  ┌────────▼──────────┐
│ SimpleAccount  │  │ SponsorPaymaster  │
│   Factory      │  │                   │
└───┬────────────┘  └────────┬──────────┘
    │                        │
    │ creates                │ sponsors
    │                        │
┌───▼────────────┐  ┌────────▼──────────┐
│ SimpleAccount  │──│    TestToken      │
│   Instance     │  │                   │
└────────────────┘  └───────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Sepolia ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/))
- Infura/Alchemy API key

### Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### Environment Variables

Configure your `.env` file:

```env
# RPC Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Deployment Wallet (needs Sepolia ETH)
PRIVATE_KEY=your_deployer_private_key

# Sponsor Wallet (needs Sepolia ETH for gas sponsorship)
SPONSOR_PRIVATE_KEY=your_sponsor_private_key

# Bundler Configuration (optional)
PIMLICO_API_KEY=your_pimlico_api_key

# Contract Verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 📦 Available Commands

### Development

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Test with gas reporting
npm run test:gas

# Deploy all contracts
npm run deploy

# Run sponsored transfer demo
npm run demo
```

### Testing & Verification

```bash
# Run specific test
npx hardhat test test/SponsorPaymaster.test.ts

# Get test coverage
npm run coverage

# Verify on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## 📁 Project Structure

```
contracts/
├── contracts/
│   ├── core/                     # Account Abstraction core contracts
│   │   ├── SimpleAccount.sol     # Individual smart wallet
│   │   └── SimpleAccountFactory.sol  # Factory for wallet creation
│   ├── paymaster/
│   │   └── SponsorPaymaster.sol  # Gas sponsorship contract
│   └── token/
│       └── TestToken.sol         # ERC-20 test token
├── scripts/
│   ├── deployment/               # Deployment scripts
│   ├── demos/                    # Demo scripts
│   ├── utils/                    # Utility functions
│   └── config/                   # Configuration files
├── test/                         # Contract tests
├── artifacts/                    # Compiled contracts
├── typechain-types/              # TypeScript type definitions
├── hardhat.config.ts             # Hardhat configuration
└── deployed_addresses.json       # Deployed contract addresses
```

## 🔨 Contract Details

### SimpleAccount

Account Abstraction wallet implementing ERC-4337. Each user gets their own instance.

**Key Features:**
- ✅ Signature validation
- ✅ Execute arbitrary transactions
- ✅ Nonce management
- ✅ Upgradeable via proxy pattern

### SimpleAccountFactory

Deterministic factory for creating SimpleAccount instances using CREATE2.

**Key Features:**
- ✅ Deterministic addresses
- ✅ Gas-efficient deployment
- ✅ Account address prediction

### SponsorPaymaster

Paymaster contract that sponsors gas fees for approved UserOperations.

**Key Features:**
- ✅ Configurable gas limits
- ✅ Sponsor balance management
- ✅ Transaction validation
- ✅ Deposit/withdraw mechanisms

### TestToken

Standard ERC-20 token for testing sponsored transfers.

**Key Features:**
- ✅ Mintable for testing
- ✅ Standard ERC-20 interface
- ✅ Transfer/approval mechanisms

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/SponsorPaymaster.test.ts

# Run with gas reporting
REPORT_GAS=true npm test

# Run with coverage
npm run coverage
```

## 🚢 Deployment

### Deploy to Sepolia

```bash
# Deploy all contracts
npm run deploy

# Or use Hardhat directly
npx hardhat run scripts/deployment/deploy.ts --network sepolia
```

### Deployment Output

Deployed addresses are saved to `deployed_addresses.json`:

```json
{
  "network": "sepolia",
  "testToken": "0x4eEE914a9Da7cAB89e5Bd2F01B5aea14327B3cC1",
  "sponsorPaymaster": "0xd6fC41c0c3D14Cac0c66Af4a0E8eFc6a4a47A20d",
  "simpleAccountFactory": "0xd74F11eeEF835d8b46b7329c8A00BD95bEd59704",
  "entryPoint": "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
}
```

## 📚 Documentation

For detailed documentation, visit the `/docs` folder:

- [📖 Tech Spec](../docs/TECH_SPEC.md) - Technical specifications
- [🔗 Bundler Integration](../docs/BUNDLER_INTEGRATION.md) - Bundler setup guide
- [🧪 Testing Guide](../docs/TESTING.md) - Comprehensive testing documentation
- [🎯 Task Requirements](../docs/TASK_REQUIREMENTS_ANALYSIS.md) - Project requirements
- [✅ Project Completion](../docs/PROJECT_COMPLETION.md) - Implementation status

## 🛡️ Security

### Best Practices

- ✅ All contracts inherit from OpenZeppelin secure implementations
- ✅ ReentrancyGuard on critical functions
- ✅ Access control with Ownable pattern
- ✅ Gas optimization for cost-effective operations

### Audit Status

⚠️ **Warning**: These contracts are for **demonstration purposes** and have not been audited. Do not use in production without a proper security audit.

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Resources

- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Account Abstraction Docs](https://docs.alchemy.com/docs/account-abstraction-overview)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Sepolia Testnet](https://sepolia.etherscan.io/)