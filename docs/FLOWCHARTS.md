# 📊 System Architecture & Flow Diagrams

High-level visual representations of the ERC-4337 Account Abstraction system architecture and key flows.

---

## 🏗️ Overall System Architecture

```mermaid
graph TB
    subgraph User["👤 User Layer"]
        Browser[Web Browser]
        Wallet[MetaMask Wallet]
    end
    
    subgraph Frontend["🎨 Frontend Application (Next.js 16)"]
        UI[React UI Components]
        Wagmi[wagmi + viem Hooks]
        BundlerClient[Bundler Client]
    end
    
    subgraph Infrastructure["☁️ Infrastructure Layer"]
        Pimlico[Pimlico Bundler]
        Infura[Infura RPC Provider]
    end
    
    subgraph Blockchain["⛓️ Sepolia Testnet"]
        EntryPoint[EntryPoint<br/>0x5FF1...2789]
        Paymaster[SponsorPaymaster<br/>0xd6fC...A20d]
        Factory[SimpleAccountFactory<br/>0xd74F...9704]
        Account[SimpleAccount<br/>User Wallets]
        Token[TestToken ERC-20<br/>0x4eEE...3cC1]
    end
    
    Browser --> UI
    Wallet --> UI
    UI --> Wagmi
    Wagmi --> BundlerClient
    
    BundlerClient --> Pimlico
    BundlerClient --> Infura
    
    Pimlico --> EntryPoint
    Infura --> Token
    Infura --> Account
    
    EntryPoint --> Paymaster
    EntryPoint --> Account
    Factory -.Creates.-> Account
    Account --> Token
    
    Paymaster -.Sponsors Gas.-> EntryPoint
    
    style User fill:#e1f5e1,stroke:#2d5016,stroke-width:3px
    style Frontend fill:#e3f2fd,stroke:#0d47a1,stroke-width:3px
    style Infrastructure fill:#fff9c4,stroke:#f57f17,stroke-width:3px
    style Blockchain fill:#fce4ec,stroke:#c2185b,stroke-width:3px
    style EntryPoint fill:#ffebee,stroke:#d32f2f,stroke-width:2px
```

---

## 🔄 High-Level Transaction Flow

```mermaid
flowchart LR
    A[👤 User<br/>Initiates Transfer] --> B[🎨 Frontend<br/>Creates UserOp]
    B --> C[☁️ Bundler<br/>Validates & Submits]
    C --> D[⛓️ EntryPoint<br/>On-Chain Validation]
    D --> E[💰 Paymaster<br/>Sponsors Gas]
    E --> F[🔐 Account<br/>Executes Transfer]
    F --> G[🪙 Token<br/>Updates Balances]
    G --> H[✅ Success<br/>TX Confirmed]
    
    style A fill:#e1f5e1,stroke:#2d5016,stroke-width:2px
    style B fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px
    style C fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    style D fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    style E fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style F fill:#e0f2f1,stroke:#00695c,stroke-width:2px
    style G fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    style H fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
```

---

## 📦 Component Architecture

```mermaid
graph TD
    subgraph Contracts["Smart Contracts Layer"]
        direction TB
        EP[EntryPoint<br/>Core ERC-4337]
        PM[SponsorPaymaster<br/>Gas Sponsorship]
        FA[SimpleAccountFactory<br/>Account Creation]
        SA[SimpleAccount<br/>User Wallet]
        TK[TestToken<br/>ERC-20]
    end
    
    subgraph Frontend["Frontend Layer"]
        direction TB
        Dashboard[ERC4337Dashboard]
        Transfer[SponsoredTransfer]
        Info[ContractInfo]
        Gas[GasTracker]
    end
    
    subgraph Services["Service Layer"]
        direction TB
        Bundler[Bundler Service]
        RPC[RPC Provider]
    end
    
    Frontend --> Services
    Services --> Contracts
    
    EP --- PM
    EP --- SA
    FA -.-> SA
    SA --> TK
    
    style Contracts fill:#fce4ec,stroke:#c2185b,stroke-width:3px
    style Frontend fill:#e3f2fd,stroke:#0d47a1,stroke-width:3px
    style Services fill:#fff9c4,stroke:#f57f17,stroke-width:3px
```

---

## 🎯 Key Interactions

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Bundler
    participant EntryPoint
    participant Paymaster
    participant Account
    participant Token
    
    User->>Frontend: Initiate Transfer
    Frontend->>Bundler: Submit UserOperation
    Bundler->>EntryPoint: Execute UserOp
    EntryPoint->>Paymaster: Validate & Pay Gas
    EntryPoint->>Account: Validate & Execute
    Account->>Token: Transfer Tokens
    Token-->>User: ✅ Transfer Complete
    
    Note over EntryPoint,Paymaster: Gas Sponsored
    Note over Account,Token: Gasless for User
```

---

## 🔐 Account Abstraction Stack

```mermaid
graph TB
    subgraph Layer1["Layer 1: User Interface"]
        UI[Web Interface]
    end
    
    subgraph Layer2["Layer 2: Account Abstraction"]
        UO[UserOperation]
        Bundler[Bundler Service]
    end
    
    subgraph Layer3["Layer 3: Smart Contracts"]
        EP[EntryPoint]
        PM[Paymaster]
        SA[SimpleAccount]
    end
    
    subgraph Layer4["Layer 4: Blockchain"]
        ETH[Ethereum/Sepolia]
    end
    
    UI --> UO
    UO --> Bundler
    Bundler --> EP
    EP --> PM
    EP --> SA
    PM --> ETH
    SA --> ETH
    
    style Layer1 fill:#e1f5e1,stroke:#2d5016,stroke-width:2px
    style Layer2 fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px
    style Layer3 fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    style Layer4 fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
```

---

## 💸 Gas Sponsorship Model

```mermaid
graph LR
    subgraph Traditional["Traditional Transaction"]
        U1[User] -->|Pays Gas| TX1[Transaction]
        TX1 --> BC1[Blockchain]
    end
    
    subgraph AA["Account Abstraction"]
        U2[User] -->|No Gas Payment| UO[UserOperation]
        Sponsor[Sponsor Wallet] -->|Deposits| PM[Paymaster]
        PM -->|Pays Gas| EP[EntryPoint]
        UO --> Bundler[Bundler]
        Bundler --> EP
        EP --> BC2[Blockchain]
    end
    
    style Traditional fill:#ffebee,stroke:#c62828,stroke-width:2px
    style AA fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style PM fill:#fff9c4,stroke:#f57f17,stroke-width:2px
```

---

## 🔄 Data Flow

```mermaid
flowchart TD
    A[User Input] --> B[Frontend Validation]
    B --> C[Create UserOperation]
    C --> D[Sign with Owner Key]
    D --> E[Submit to Bundler]
    E --> F{Bundler<br/>Validates}
    F -->|Valid| G[Submit to EntryPoint]
    F -->|Invalid| H[Return Error]
    G --> I{On-Chain<br/>Validation}
    I -->|Valid| J[Execute Transaction]
    I -->|Invalid| K[Revert TX]
    J --> L[Update State]
    L --> M[Emit Events]
    M --> N[Frontend Updates UI]
    
    style A fill:#e1f5e1
    style N fill:#e8f5e9
    style H fill:#ffebee
    style K fill:#ffebee
```

---

## 🏭 Contract Deployment Structure

```mermaid
graph TD
    Start[Deployment Script] --> Token[Deploy TestToken]
    Token --> Paymaster[Deploy SponsorPaymaster]
    Paymaster --> Factory[Deploy SimpleAccountFactory]
    Factory --> Fund[Fund Paymaster]
    Fund --> Verify[Verify on Etherscan]
    Verify --> Save[Save Addresses]
    Save --> Config[Update Frontend Config]
    Config --> Done[✅ Ready to Use]
    
    style Start fill:#e3f2fd
    style Done fill:#e8f5e9
    style Fund fill:#fff9c4
    style Verify fill:#f3e5f5
```

---

## 🎨 Frontend Architecture

```mermaid
graph TB
    subgraph Pages["Pages"]
        Home[Home Page]
        Dashboard[Dashboard Page]
    end
    
    subgraph Components["React Components"]
        Transfer[SponsoredTransfer]
        Balance[TokenBalance]
        Info[ContractInfo]
        History[TransactionHistory]
    end
    
    subgraph Utils["Utilities"]
        Bundler[Bundler Client]
        Contracts[Contract Helpers]
        ABIs[Contract ABIs]
    end
    
    subgraph Web3["Web3 Integration"]
        Wagmi[wagmi Hooks]
        Viem[viem Library]
        Rainbow[RainbowKit]
    end
    
    Pages --> Components
    Components --> Utils
    Utils --> Web3
    
    style Pages fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px
    style Components fill:#e1f5e1,stroke:#2d5016,stroke-width:2px
    style Utils fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    style Web3 fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
```

---

## 🔗 Technology Stack Layers

```mermaid
graph TB
    subgraph Frontend["Frontend Stack"]
        Next[Next.js 16]
        React[React 19]
        TS[TypeScript]
        Tailwind[Tailwind CSS]
    end
    
    subgraph Web3["Web3 Stack"]
        Wagmi[wagmi 2.x]
        Viem[viem 2.x]
        RainbowKit[RainbowKit]
    end
    
    subgraph Contracts["Smart Contract Stack"]
        Solidity[Solidity 0.8.23]
        Hardhat[Hardhat 2.22]
        Ethers[ethers.js 6.x]
        OZ[OpenZeppelin]
    end
    
    subgraph Services["External Services"]
        Pimlico[Pimlico Bundler]
        Infura[Infura RPC]
        Etherscan[Etherscan API]
    end
    
    Frontend --> Web3
    Web3 --> Services
    Contracts --> Services
    
    style Frontend fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px
    style Web3 fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style Contracts fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    style Services fill:#fff9c4,stroke:#f57f17,stroke-width:2px
```

---

## 🧪 Testing Structure

```mermaid
graph TB
    subgraph Unit["Unit Tests"]
        Token[TestToken Tests<br/>15 tests]
        PM[Paymaster Tests<br/>12 tests]
    end
    
    subgraph Integration["Integration Tests"]
        Demo[Demo Scripts]
        Bundler[Bundler Integration]
    end
    
    subgraph E2E["End-to-End"]
        Live[Live Transactions<br/>on Sepolia]
    end
    
    Unit --> Integration
    Integration --> E2E
    
    style Unit fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px
    style Integration fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    style E2E fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
```

---

## 📁 Project Structure Overview

```mermaid
graph TD
    Root[vinu-digital-task2] --> Contracts[contracts/<br/>Smart Contracts]
    Root --> Frontend[frontend/<br/>Next.js App]
    Root --> Docs[docs/<br/>Documentation]
    
    Contracts --> SC[contracts/<br/>Solidity Files]
    Contracts --> Scripts[scripts/<br/>Deploy & Utils]
    Contracts --> Tests[test/<br/>Test Files]
    
    Frontend --> App[src/app/<br/>Pages]
    Frontend --> Comp[src/components/<br/>React Components]
    Frontend --> Utils[src/utils/<br/>Utilities]
    
    Docs --> Tech[Technical Docs]
    Docs --> Guides[How-to Guides]
    Docs --> API[API Reference]
    
    style Root fill:#e1f5e1,stroke:#2d5016,stroke-width:3px
    style Contracts fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    style Frontend fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px
    style Docs fill:#fff9c4,stroke:#f57f17,stroke-width:2px
```

---

## 🚀 Deployment Pipeline

```mermaid
flowchart LR
    Dev[Development] --> Test[Run Tests]
    Test --> Build[Build Project]
    Build --> Deploy[Deploy to Testnet]
    Deploy --> Verify[Verify Contracts]
    Verify --> Monitor[Monitor & Test]
    Monitor --> Prod[Production Ready]
    
    style Dev fill:#e3f2fd
    style Test fill:#fff9c4
    style Deploy fill:#fce4ec
    style Verify fill:#f3e5f5
    style Prod fill:#e8f5e9
```

---

## 🎯 User Journey Overview

```mermaid
flowchart TD
    A[Open Application] --> B[Connect Wallet]
    B --> C{Has Account?}
    C -->|No| D[Create Account]
    D --> E[Account Ready]
    C -->|Yes| E
    E --> F[View Dashboard]
    F --> G[Initiate Transfer]
    G --> H[Confirm Transaction]
    H --> I[Wait for Confirmation]
    I --> J[View Success]
    
    style A fill:#e1f5e1
    style E fill:#e8f5e9
    style J fill:#e8f5e9
```

---

## 📊 How to Use These Diagrams

### GitHub/GitLab
These Mermaid diagrams render automatically on GitHub and GitLab. Just view this file in your repository.

### Export as Images
1. Visit [Mermaid Live Editor](https://mermaid.live/)
2. Copy any diagram code
3. Export as PNG, SVG, or PDF

### In Presentations
- Use screenshots for quick presentations
- Export as SVG for scalable graphics
- Use Mermaid plugins for tools like VS Code, Obsidian

### Reference in Code
```typescript
/**
 * Transaction flow implementation
 * See: docs/FLOWCHARTS.md - "High-Level Transaction Flow"
 */
function sendTransaction() {
  // implementation
}
```

---

## 🔄 Updating Diagrams

When updating the system:
1. Identify affected diagrams
2. Update Mermaid code
3. Test rendering on GitHub
4. Update references in documentation

---

## 📚 Diagram Legend

### Colors
- 🟢 **Green** - User interactions, success states
- 🔵 **Blue** - Frontend components, UI layer
- 🟡 **Yellow** - Infrastructure, services
- 🔴 **Pink/Red** - Blockchain, smart contracts
- 🟣 **Purple** - Special components (Paymaster, etc.)

### Arrows
- **Solid →** - Direct calls/interactions
- **Dashed -.->** - Creates, supports, sponsors
- **Bold ⟹** - Main flow path

---

**Last Updated:** December 2, 2025  
**Total Diagrams:** 14 high-level architecture views  
**Format:** Mermaid.js  
**Purpose:** System overview and architecture understanding
