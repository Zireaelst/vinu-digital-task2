# Technical Specification: ERC-4337 Meta Transaction Sponsorship Task

## 1. Project Architecture
[cite_start]**Goal:** Implement an Account Abstraction system on Sepolia Testnet where a Paymaster sponsors gas fees for an ERC-20 transfer. [cite: 4, 5]

**Directory Structure:**
```text
/Vinu-digital-task2
  ├── /contracts (Hardhat Project)
  │     ├── contracts/
  │     │     ├── core/SimpleAccount.sol
  │     │     ├── paymaster/SponsorPaymaster.sol
  │     │     └── token/TestToken.sol
  │     ├── scripts/
  │     │     ├── deploy.ts
  │     │     └── demo-execute-transfer.ts (The Manual Bundler)
  │     ├── test/
  │     └── hardhat.config.ts
  │
  └── /frontend (Next.js Project - Bonus Task)
        ├── src/components
        ├── src/hooks
        └── src/utils (UserOp construction logic)