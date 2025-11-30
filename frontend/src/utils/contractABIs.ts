// Contract ABIs for our deployed ERC-4337 contracts

export const TestTokenABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "freeMint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const SimpleAccountFactoryABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "uint256", "name": "salt", "type": "uint256" }
    ],
    "name": "createAccount",
    "outputs": [{ "internalType": "contract SimpleAccount", "name": "account", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "uint256", "name": "salt", "type": "uint256" }
    ],
    "name": "getAddress",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const SponsorPaymasterABI = [
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "isWhitelisted",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDepositBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const SimpleAccountABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "dest", "type": "address" },
      { "internalType": "uint256", "name": "value", "type": "uint256" },
      { "internalType": "bytes", "name": "func", "type": "bytes" }
    ],
    "name": "execute",
    "outputs": [],
    "stateMutability": "nonpayable", 
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const EntryPointABI = [
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "sender", "type": "address" },
          { "internalType": "uint256", "name": "nonce", "type": "uint256" },
          { "internalType": "bytes", "name": "initCode", "type": "bytes" },
          { "internalType": "bytes", "name": "callData", "type": "bytes" },
          { "internalType": "uint256", "name": "callGasLimit", "type": "uint256" },
          { "internalType": "uint256", "name": "verificationGasLimit", "type": "uint256" },
          { "internalType": "uint256", "name": "preVerificationGas", "type": "uint256" },
          { "internalType": "uint256", "name": "maxFeePerGas", "type": "uint256" },
          { "internalType": "uint256", "name": "maxPriorityFeePerGas", "type": "uint256" },
          { "internalType": "bytes", "name": "paymasterAndData", "type": "bytes" },
          { "internalType": "bytes", "name": "signature", "type": "bytes" }
        ],
        "internalType": "struct UserOperation",
        "name": "userOp",
        "type": "tuple"
      }
    ],
    "name": "getUserOpHash",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "sender", "type": "address" },
      { "internalType": "uint192", "name": "key", "type": "uint192" }
    ],
    "name": "getNonce",
    "outputs": [{ "internalType": "uint256", "name": "nonce", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;