"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { Send, Wallet, Zap, Shield, CheckCircle2 } from "lucide-react";

import { Spotlight } from "@/components/ui/Spotlight";
import { BackgroundBeams } from "@/components/ui/BackgroundBeams";
import { HoverBorderGradient } from "@/components/ui/HoverBorderGradient";
import { Input } from "@/components/ui/Input";
import WalletConnection from "@/components/WalletConnection";
import { executeTokenTransfer, formatAddress, isValidAddress, isValidAmount } from "@/utils/bundler";
import { DEMO_PRIVATE_KEY, DEMO_ACCOUNT_ADDRESS } from "@/config/wagmi";

interface TransferState {
  recipient: string;
  amount: string;
  loading: boolean;
  success: boolean;
  error: string;
  txHash: string;
}

export default function Home() {
  const { address: connectedAddress, isConnected } = useAccount();
  const [state, setState] = useState<TransferState>({
    recipient: "",
    amount: "",
    loading: false,
    success: false,
    error: "",
    txHash: "",
  });

  const handleInputChange = (field: keyof TransferState, value: string) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
      error: "",
      success: false,
    }));
  };

  const validateInputs = (): boolean => {
    if (!state.recipient) {
      setState((prev) => ({ ...prev, error: "Please enter recipient address" }));
      return false;
    }

    if (!isValidAddress(state.recipient)) {
      setState((prev) => ({ ...prev, error: "Invalid recipient address" }));
      return false;
    }

    if (!state.amount) {
      setState((prev) => ({ ...prev, error: "Please enter transfer amount" }));
      return false;
    }

    if (!isValidAmount(state.amount)) {
      setState((prev) => ({ ...prev, error: "Invalid amount (must be positive number)" }));
      return false;
    }

    return true;
  };

  const executeTransfer = async () => {
    if (!validateInputs()) return;
    if (!isConnected) {
      setState((prev) => ({ ...prev, error: "Please connect your wallet first" }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      // Always use the deployed SimpleAccount, not the connected EOA wallet
      const simpleAccountAddress = DEMO_ACCOUNT_ADDRESS;

      console.log('🚀 Starting real ERC-4337 transaction...');
      console.log('SimpleAccount Address:', simpleAccountAddress);
      console.log('Connected Wallet (for signing):', connectedAddress);
      
      // Execute real UserOperation via bundler
      const result = await executeTokenTransfer(
        simpleAccountAddress,
        state.recipient,
        state.amount,
        DEMO_PRIVATE_KEY
      );

      // Use real transaction hash from blockchain
      setState((prev) => ({
        ...prev,
        loading: false,
        success: true,
        txHash: result.receipt.receipt.transactionHash,
      }));

      console.log('🎉 Meta Transaction Successful!', {
        userOpHash: result.userOpHash,
        txHash: result.receipt.receipt.transactionHash,
        from: simpleAccountAddress,
        to: state.recipient,
        amount: state.amount,
        gasSponsored: true
      });

      console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/tx/${result.receipt.receipt.transactionHash}`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error('❌ Transaction failed:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: `Transaction failed: ${errorMessage}`,
      }));
    }
  };

  const resetForm = () => {
    setState({
      recipient: "",
      amount: "",
      loading: false,
      success: false,
      error: "",
      txHash: "",
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white relative overflow-hidden">
      {/* Background Effects */}
      <BackgroundBeams />
      <Spotlight className="top-0 left-0" fill="#262626" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Gasless Transfers</h1>
                <p className="text-sm text-zinc-400">ERC-4337 Account Abstraction</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <WalletConnection />
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6">
            <span className="bg-clip-text text-transparent bg-linear-to-br from-white via-white to-zinc-400">
              Gasless
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-linear-to-br from-blue-500 to-purple-500">
              Transfers
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Experience the power of ERC-4337. Send tokens without gas fees, sponsored by our paymaster infrastructure.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          className="grid md:grid-cols-3 gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="glass-card rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold mb-2">Smart Account</h3>
            <p className="text-sm text-zinc-400">Contract-based wallet with advanced features and security.</p>
          </div>
          
          <div className="glass-card rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-semibold mb-2">Gas Sponsorship</h3>
            <p className="text-sm text-zinc-400">Paymaster covers all transaction fees automatically.</p>
          </div>
          
          <div className="glass-card rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Send className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="font-semibold mb-2">Instant Execution</h3>
            <p className="text-sm text-zinc-400">Fast and reliable transaction processing via bundlers.</p>
          </div>
        </motion.div>

        {/* Transaction Card */}
        <motion.div 
          className="glass-card rounded-3xl p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-semibold">Send Transaction</h2>
          </div>

          {/* Wallet Status */}
          {isConnected && connectedAddress && (
            <motion.div 
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Wallet Connected</span>
              </div>
              <p className="text-sm text-emerald-300 mt-1 font-mono">
                {formatAddress(connectedAddress)}
              </p>
            </motion.div>
          )}

          {!isConnected && (
            <motion.div 
              className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-2 text-yellow-400">
                <Wallet className="w-5 h-5" />
                <span className="font-medium">Connect wallet to continue</span>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <div className="space-y-6 mb-8">
            <Input
              label="Recipient Address"
              placeholder="0x742d35Cc6851C2c2C6adD8C495Fa3D2B1068E589"
              value={state.recipient}
              onChange={(e) => handleInputChange("recipient", e.target.value)}
              disabled={state.loading}
              error={state.error && state.error.includes("address") ? state.error : undefined}
            />
            
            <Input
              label="Amount (TEST tokens)"
              type="number"
              placeholder="100"
              value={state.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              disabled={state.loading}
              error={state.error && state.error.includes("amount") ? state.error : undefined}
            />
          </div>

          {/* Action Button */}
          <div className="flex justify-center mb-6">
            <HoverBorderGradient
              onClick={state.success ? resetForm : executeTransfer}
              disabled={state.loading || (!isConnected && !state.success)}
              className="px-12 py-4 text-lg font-medium"
            >
              {state.loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : state.success ? (
                "Send Another"
              ) : !isConnected ? (
                "Connect Wallet First"
              ) : (
                "Send Transaction"
              )}
            </HoverBorderGradient>
          </div>

          {/* Error Display */}
          {state.error && (
            <motion.div 
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-red-400 text-sm">{state.error}</p>
            </motion.div>
          )}

          {/* Success Display */}
          {state.success && state.txHash && (
            <motion.div 
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center space-x-2 text-emerald-400 mb-3">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Transaction Successful!</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">From:</span>
                  <span className="font-mono text-white">{formatAddress(connectedAddress || DEMO_ACCOUNT_ADDRESS)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">To:</span>
                  <span className="font-mono text-white">{formatAddress(state.recipient)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Amount:</span>
                  <span className="text-white">{state.amount} TEST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Gas Sponsored:</span>
                  <span className="text-emerald-400">✓ Paymaster</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-neutral-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-zinc-400">Transaction Hash:</p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${state.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                  >
                    <span>View on Etherscan</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <p className="font-mono text-emerald-400 text-sm break-all">{state.txHash}</p>
                
                {/* Copy button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(state.txHash);
                    // You could add a toast notification here
                  }}
                  className="mt-2 text-xs text-zinc-400 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy Hash</span>
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center text-zinc-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <p>Built with Hardhat, ethers.js, and @account-abstraction/contracts</p>
          <p className="mt-1">Deployed on Sepolia Testnet • ERC-4337 Demo</p>
        </motion.div>
      </main>
    </div>
  );
}
