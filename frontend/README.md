# ⚛️ ERC-4337 Frontend - Next.js Dashboard

Modern, production-ready frontend for ERC-4337 Account Abstraction with gasless transactions.

## ✨ Features

### Core Functionality
- 🔐 **Wallet Integration** - MetaMask connection with wagmi
- 💸 **Gasless Transfers** - Paymaster-sponsored token transfers
- 🎯 **UserOperation Builder** - Complete ERC-4337 flow implementation
- 📊 **Real-time Dashboard** - Contract info, balances, and network stats

### Advanced Features
- � **Transaction History** - View all past transfers with details
- ⛽ **Gas Tracker** - Monitor gas prices and Paymaster balance
- 🎨 **Modern UI/UX** - Responsive design with Tailwind CSS
- 🔄 **Auto-refresh** - Real-time data updates

## 🛠️ Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.5 | React framework |
| **React** | 19.2.0 | UI library |
| **TypeScript** | 5.x | Type safety |
| **wagmi** | 2.19.5 | Ethereum React hooks |
| **viem** | 2.40.3 | TypeScript Ethereum library |
| **Tailwind CSS** | 4.x | Styling framework |

## 🔗 Smart Contracts (Sepolia)

| Contract | Address | Verification |
|----------|---------|--------------|
| **TestToken** | [`0xab230E033D846Add5367Eb48BdCC4928259239a8`](https://sepolia.etherscan.io/address/0xab230E033D846Add5367Eb48BdCC4928259239a8) | ✅ Verified |
| **SponsorPaymaster** | [`0x61d222f1e0386a7Af71C865fF83Ad4CEd1131011`](https://sepolia.etherscan.io/address/0x61d222f1e0386a7Af71C865fF83Ad4CEd1131011) | ✅ Verified |
| **SimpleAccountFactory** | [`0x9C12C19B00cAA9c7c23383F399924d26A0E06fDc`](https://sepolia.etherscan.io/address/0x9C12C19B00cAA9c7c23383F399924d26A0E06fDc) | ✅ Deployed |
| **EntryPoint** | [`0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`](https://sepolia.etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789) | ✅ Official |

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MetaMask browser extension
- Sepolia testnet ETH (for contract interactions)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm run start
```

## 📂 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main landing page
│   └── layout.tsx         # Root layout with providers
├── components/             # React components
│   ├── ERC4337Dashboard.tsx    # Main dashboard
│   ├── SponsoredTransfer.tsx   # Transfer interface
│   ├── ContractInfo.tsx        # Contract details
│   ├── TransactionHistory.tsx  # Transaction list
│   ├── GasTracker.tsx         # Gas monitoring
│   └── Providers.tsx          # Web3 providers
├── config/                 # Configuration
│   └── wagmi.ts           # Web3 config & contract addresses
├── lib/                    # Core libraries
│   └── utils.ts           # Utility functions
└── utils/                  # Utilities
    └── bundler.ts         # Bundler client & ERC-4337 logic
```

## 🎯 Main Components

### 1. Landing Page (`page.tsx`)
- Hero section with wallet connection
- Quick transfer form
- Transaction status tracking
- Etherscan integration

### 2. ERC4337 Dashboard
**4 Interactive Tabs:**
- 📋 **Contract Info** - View deployed contracts
- 💸 **Sponsored Transfer** - Execute gasless transfers
- 📊 **Transaction History** - Past transaction records
- ⛽ **Gas Tracker** - Real-time gas monitoring

### 3. Bundler Integration
- Multiple bundler endpoints (Stackup, Candide, Voltaire)
- Automatic fallback mechanism
- UserOperation construction and signing
- Receipt polling and confirmation

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Optional: Custom RPC endpoint
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Optional: Bundler API key for higher rate limits
NEXT_PUBLIC_BUNDLER_API_KEY=your_bundler_api_key
```

### Contract Addresses

Configured in `src/config/wagmi.ts`:
```typescript
export const CONTRACT_ADDRESSES = {
  entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  testToken: "0xab230E033D846Add5367Eb48BdCC4928259239a8",
  sponsorPaymaster: "0x61d222f1e0386a7Af71C865fF83Ad4CEd1131011",
  simpleAccountFactory: "0x9C12C19B00cAA9c7c23383F399924d26A0E06fDc",
  simpleAccount: "0xe6C10E95f8AEF841e766018Cd08944602Bc7EFC2"
};
```

## 📚 Documentation

Comprehensive documentation available in the `/docs` folder:

- **[Frontend Architecture](../docs/FRONTEND_ARCHITECTURE.md)** - Detailed architecture overview
- **[Frontend Summary](../docs/FRONTEND_SUMMARY.md)** - Feature summary and implementation
- **[Bundler Guide](../docs/BUNDLER_GUIDE.md)** - Bundler configuration and troubleshooting

## 🎨 Features Overview

### Transaction Flow
1. User connects MetaMask wallet
2. Enters recipient address and amount
3. Frontend builds UserOperation
4. Signs transaction with wallet
5. Submits to bundler
6. Bundler executes via EntryPoint
7. Paymaster sponsors gas fees
8. Transaction confirmed on Sepolia

### Gas Sponsorship
- Paymaster pays all gas fees
- Users don't need ETH for transactions
- Only need tokens to transfer
- Real-time gas tracking and monitoring

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking
npm run type-check

# Build test
npm run build
```

## 🚢 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push code to GitHub
2. Import repository in Vercel
3. Configure environment variables
4. Deploy

### Manual Deployment

```bash
# Build
npm run build

# Output in .next/ directory
# Deploy to your hosting provider
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details

## 🔗 Links

- **Main Repository**: [vinu-digital-task2](https://github.com/Zireaelst/vinu-digital-task2)
- **Live Demo**: Coming soon
- **Documentation**: [/docs](../docs)
- **Smart Contracts**: [/contracts](../contracts)

## 💡 Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub](https://github.com/vercel/next.js)

### ERC-4337 Resources
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Account Abstraction Guide](https://docs.alchemy.com/docs/account-abstraction)
- [wagmi Documentation](https://wagmi.sh/)

---

<div align="center">

**Built with ❤️ using Next.js & ERC-4337**

Last Updated: December 2, 2025

</div>

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
