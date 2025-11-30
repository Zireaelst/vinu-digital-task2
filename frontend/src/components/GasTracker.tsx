'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { SEPOLIA_RPC_URL, CONTRACT_ADDRESSES } from '@/config/wagmi';

interface GasStats {
  currentGasPrice: string;
  currentGasPriceGwei: string;
  estimatedCost: string;
  paymasterBalance: string;
  totalGasSponsored: string;
  transactionCount: number;
}

export default function GasTracker() {
  const [stats, setStats] = useState<GasStats>({
    currentGasPrice: '0',
    currentGasPriceGwei: '0',
    estimatedCost: '0',
    paymasterBalance: '0',
    totalGasSponsored: '0',
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchGasStats();
    
    if (autoRefresh) {
      const interval = setInterval(fetchGasStats, 15000); // Update every 15 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchGasStats = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
      
      // Get current gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || 0n;
      const gasPriceGwei = ethers.formatUnits(gasPrice, 'gwei');
      
      // Estimate cost for a typical UserOperation (650k gas)
      const estimatedGas = 650000n;
      const estimatedCost = gasPrice * estimatedGas;
      const estimatedCostEth = ethers.formatEther(estimatedCost);
      
      // Get Paymaster balance
      const paymasterContract = new ethers.Contract(
        CONTRACT_ADDRESSES.paymaster,
        [
          'function getDeposit() view returns (uint256)',
        ],
        provider
      );
      
      let paymasterBalance = '0';
      try {
        const balance = await paymasterContract.getDeposit();
        paymasterBalance = ethers.formatEther(balance);
      } catch {
        // Fallback to direct balance check
        const balance = await provider.getBalance(CONTRACT_ADDRESSES.paymaster);
        paymasterBalance = ethers.formatEther(balance);
      }
      
      // Calculate total gas sponsored (rough estimate based on paymaster usage)
      const initialDeposit = 0.1; // 0.1 ETH initial deposit
      const currentBalance = parseFloat(paymasterBalance);
      const totalSponsored = Math.max(0, initialDeposit - currentBalance);
      
      // Get transaction count from SimpleAccount
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = currentBlock - 10000;
      
      const testTokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.testToken,
        ['event Transfer(address indexed from, address indexed to, uint256 value)'],
        provider
      );
      
      const filter = testTokenContract.filters.Transfer(CONTRACT_ADDRESSES.simpleAccount, null);
      const events = await testTokenContract.queryFilter(filter, fromBlock, currentBlock);
      
      setStats({
        currentGasPrice: gasPrice.toString(),
        currentGasPriceGwei: gasPriceGwei,
        estimatedCost: estimatedCostEth,
        paymasterBalance,
        totalGasSponsored: totalSponsored.toFixed(6),
        transactionCount: events.length,
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching gas stats:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    unit, 
    icon, 
    color 
  }: { 
    title: string; 
    value: string; 
    unit?: string; 
    icon: string; 
    color: string;
  }) => (
    <div className={`bg-gradient-to-br ${color} p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex items-end space-x-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        {unit && <span className="text-gray-400 text-sm mb-1">{unit}</span>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">⛽ Gas Tracker</h2>
          <p className="text-gray-400 text-sm mt-1">
            Real-time gas prices and sponsorship stats
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              autoRefresh
                ? 'bg-green-500/10 border-green-500 text-green-400'
                : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}
          >
            {autoRefresh ? '🔄 Auto' : '⏸️ Paused'}
          </button>
          <button
            onClick={fetchGasStats}
            className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500 text-blue-400 rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Current Gas Price"
          value={parseFloat(stats.currentGasPriceGwei).toFixed(2)}
          unit="gwei"
          icon="⛽"
          color="from-blue-500/10 to-purple-500/10"
        />
        
        <StatCard
          title="Estimated UserOp Cost"
          value={parseFloat(stats.estimatedCost).toFixed(6)}
          unit="ETH"
          icon="💰"
          color="from-purple-500/10 to-pink-500/10"
        />
        
        <StatCard
          title="Paymaster Balance"
          value={parseFloat(stats.paymasterBalance).toFixed(4)}
          unit="ETH"
          icon="🏦"
          color="from-green-500/10 to-emerald-500/10"
        />
        
        <StatCard
          title="Total Gas Sponsored"
          value={stats.totalGasSponsored}
          unit="ETH"
          icon="🎁"
          color="from-yellow-500/10 to-orange-500/10"
        />
        
        <StatCard
          title="Sponsored Transactions"
          value={stats.transactionCount.toString()}
          unit="txs"
          icon="📊"
          color="from-red-500/10 to-pink-500/10"
        />
        
        <StatCard
          title="Avg Gas Saved"
          value={
            stats.transactionCount > 0
              ? (parseFloat(stats.totalGasSponsored) / stats.transactionCount).toFixed(6)
              : '0.000000'
          }
          unit="ETH/tx"
          icon="💎"
          color="from-indigo-500/10 to-blue-500/10"
        />
      </div>

      {/* Gas Price Chart (Visual Indicator) */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Gas Price Indicator</h3>
        <div className="space-y-3">
          {[
            { label: 'Slow', range: '< 10 gwei', color: 'bg-green-500' },
            { label: 'Standard', range: '10-20 gwei', color: 'bg-yellow-500' },
            { label: 'Fast', range: '20-30 gwei', color: 'bg-orange-500' },
            { label: 'Rapid', range: '> 30 gwei', color: 'bg-red-500' },
          ].map((item) => {
            const currentGwei = parseFloat(stats.currentGasPriceGwei);
            const isActive =
              (item.label === 'Slow' && currentGwei < 10) ||
              (item.label === 'Standard' && currentGwei >= 10 && currentGwei < 20) ||
              (item.label === 'Fast' && currentGwei >= 20 && currentGwei < 30) ||
              (item.label === 'Rapid' && currentGwei >= 30);

            return (
              <div key={item.label} className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${item.color} ${isActive ? 'animate-pulse' : 'opacity-30'}`} />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-xs text-gray-400">{item.range}</span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-500 ${
                        isActive ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Paymaster Info */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="text-4xl">🛡️</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">
              Paymaster Gas Sponsorship
            </h3>
            <p className="text-gray-300 text-sm mb-3">
              Your transactions are sponsored! The Paymaster covers all gas fees,
              so you don&apos;t need any ETH in your wallet.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Remaining Budget:</span>
                <div className="text-white font-semibold mt-1">
                  {parseFloat(stats.paymasterBalance).toFixed(4)} ETH
                </div>
              </div>
              <div>
                <span className="text-gray-400">Transactions Left:</span>
                <div className="text-white font-semibold mt-1">
                  ~{Math.floor(parseFloat(stats.paymasterBalance) / parseFloat(stats.estimatedCost))} txs
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-500">
        Last updated: {new Date().toLocaleTimeString()}
        {autoRefresh && <span className="ml-2">• Auto-refreshing every 15s</span>}
      </div>
    </div>
  );
}
