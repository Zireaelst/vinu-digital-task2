# ERC-4337 Account Abstraction Frontend

A complete Next.js frontend for demonstrating ERC-4337 Account Abstraction with sponsored gas transactions.

## Features

- 🏗️ **Smart Contract Integration**: Connects to deployed ERC-4337 contracts on Sepolia
- 💸 **Sponsored Transactions**: Demo gasless token transfers via paymaster
- 📋 **Contract Information**: Real-time display of contract addresses and balances  
- 🚀 **UserOperation Builder**: Construct and simulate ERC-4337 UserOperations
- 🎨 **Modern UI**: Clean, responsive interface with Tailwind CSS

## Tech Stack

- **Next.js 15** with TypeScript
- **wagmi v2.19.5** for Web3 integration
- **RainbowKit** for wallet connections
- **Tailwind CSS** for styling
- **ethers.js v6** for blockchain interactions

## Deployed Contracts (Sepolia)

| Contract | Address | Status |
|----------|---------|--------|
| TestToken | `0xab230E033D846Add5367Eb48BdCC4928259239a8` | ✅ Functional |
| SponsorPaymaster | `0x376709BAb502daECEd2d3C0e3D07a564747Dc2AB` | ✅ Funded (0.01 ETH) |
| SimpleAccountFactory | `0x878eC102A6983DC26Ca74b4eC2D464b2f12cF60c` | ⚠️ Partial (CREATE2 bug) |
| EntryPoint | `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` | ✅ Standard ERC-4337 |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
