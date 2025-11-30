# ERC-4337 Account Abstraction - Smart Contracts

This project implements an ERC-4337 Account Abstraction system on Sepolia Testnet where a Paymaster sponsors gas fees for ERC-20 transfers.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Fill in your `.env` file with:
   - `SEPOLIA_RPC_URL`: Your Infura/Alchemy Sepolia endpoint
   - `PRIVATE_KEY`: Your deployer private key (with Sepolia ETH)
   - `SPONSOR_PRIVATE_KEY`: Sponsor wallet private key (with Sepolia ETH)
   - `ETHERSCAN_API_KEY`: For contract verification

## Usage

1. **Deploy contracts:**
```bash
npm run deploy
```

2. **Run demo (sponsored transfer):**
```bash
npm run demo
```

## Architecture

- **SimpleAccount**: Account Abstraction wallet contract
- **SponsorPaymaster**: Paymaster that sponsors gas fees
- **TestToken**: ERC-20 token for testing transfers

## EntryPoint

Using the canonical EntryPoint contract on Sepolia:
`0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`