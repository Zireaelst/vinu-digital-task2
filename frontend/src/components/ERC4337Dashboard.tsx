'use client';

import { useState, useEffect } from 'react';
import ContractInfo from './ContractInfo';
import SponsoredTransfer from './SponsoredTransfer';
import WalletConnection from './WalletConnection';
import TransactionHistory from './TransactionHistory';
import GasTracker from './GasTracker';

interface DashboardStats {
  connectedWallet: string | null;
  networkName: string;
  blockNumber: number | null;
  gasPriceGwei: number | null;
}

export default function ERC4337Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    connectedWallet: null,
    networkName: 'Sepolia Testnet',
    blockNumber: null,
    gasPriceGwei: null
  });

  const [activeTab, setActiveTab] = useState<'contracts' | 'transfer' | 'history' | 'gas'>('contracts');

  useEffect(() => {
    // Simulate some network stats
    const updateStats = () => {
      setStats(prev => ({
        ...prev,
        blockNumber: Math.floor(Math.random() * 1000000) + 4500000, // Mock block number
        gasPriceGwei: Math.floor(Math.random() * 20) + 10 // Mock gas price 10-30 gwei
      }));
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🚀</span>
                </div>
                <h1 className="text-xl font-bold">ERC-4337 Demo</h1>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <span className="text-sm text-gray-300">Network: {stats.networkName}</span>
                {stats.blockNumber && (
                  <span className="text-sm text-gray-300">Block: #{stats.blockNumber.toLocaleString()}</span>
                )}
                {stats.gasPriceGwei && (
                  <span className="text-sm text-gray-300">Gas: {stats.gasPriceGwei} gwei</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <WalletConnection />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'contracts'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              📋 Contracts
            </button>
            <button
              onClick={() => setActiveTab('transfer')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'transfer'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              💸 Transfer
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              📊 History
            </button>
            <button
              onClick={() => setActiveTab('gas')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'gas'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              ⛽ Gas Tracker
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8">
          {/* ERC-4337 Overview Card */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Account Abstraction (ERC-4337)</h2>
                <p className="text-gray-300 mb-4">
                  Experience gasless transactions with smart contract wallets and paymaster sponsorship.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-green-400 font-medium">✅ Smart Account</div>
                    <div className="text-sm text-gray-300">Contract-based wallet</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-green-400 font-medium">✅ Paymaster</div>
                    <div className="text-sm text-gray-300">Gas fee sponsorship</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-green-400 font-medium">✅ Bundler Ready</div>
                    <div className="text-sm text-gray-300">UserOp construction</div>
                  </div>
                </div>
              </div>
              <div className="text-6xl opacity-20">🏗️</div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'contracts' && (
            <div className="space-y-6">
              <ContractInfo accountAddress="0x742d35Cc6851C2c2C6adD8C495Fa3D2B1068E589" />
              
              {/* Technical Architecture */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">🏗️ System Architecture</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-700 rounded p-4">
                      <h4 className="font-medium text-blue-300 mb-2">Smart Contracts</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• SimpleAccount: ERC-4337 wallet implementation</li>
                        <li>• SimpleAccountFactory: CREATE2 factory for accounts</li>
                        <li>• SponsorPaymaster: Gas fee sponsorship</li>
                        <li>• TestToken: ERC-20 for demonstrations</li>
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-700 rounded p-4">
                      <h4 className="font-medium text-green-300 mb-2">ERC-4337 Flow</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>1. Build UserOperation with transaction data</li>
                        <li>2. Sign with account private key</li>
                        <li>3. Submit to bundler for execution</li>
                        <li>4. Paymaster sponsors gas fees</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transfer' && (
            <div className="space-y-6">
              <SponsoredTransfer />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <TransactionHistory />
            </div>
          )}

          {activeTab === 'gas' && (
            <div>
              <GasTracker />
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>
            Built with Hardhat v2.22.17, ethers.js v6, and @account-abstraction/contracts v0.6.0
          </p>
          <p className="mt-1">
            Deployed on Sepolia Testnet • ERC-4337 Account Abstraction Demo
          </p>
        </div>
      </div>
    </div>
  );
}