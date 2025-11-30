'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, SEPOLIA_RPC_URL } from '@/config/wagmi';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
  tokenAmount?: string;
  tokenSymbol?: string;
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactionHistory();
  }, []);

  const fetchTransactionHistory = async () => {
    try {
      setLoading(true);
      const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
      
      // Fetch latest transactions for our SimpleAccount
      const simpleAccountAddress = CONTRACT_ADDRESSES.simpleAccount;
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = currentBlock - 10000; // Last ~10k blocks
      
      // Get token transfer events
      const testTokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.testToken,
        [
          'event Transfer(address indexed from, address indexed to, uint256 value)',
        ],
        provider
      );

      const filter = testTokenContract.filters.Transfer(simpleAccountAddress, null);
      const events = await testTokenContract.queryFilter(filter, fromBlock, currentBlock);

      const txs: Transaction[] = await Promise.all(
        events.map(async (event) => {
          const tx = await event.getTransaction();
          const receipt = await event.getTransactionReceipt();
          const block = await provider.getBlock(tx.blockNumber!);

          return {
            hash: tx.hash,
            from: simpleAccountAddress,
            to: event.args![1] as string,
            value: ethers.formatEther(event.args![2] as bigint),
            gasUsed: receipt!.gasUsed.toString(),
            timestamp: block!.timestamp,
            status: receipt!.status === 1 ? 'success' : 'failed',
            tokenAmount: ethers.formatEther(event.args![2] as bigint),
            tokenSymbol: 'TEST',
          };
        })
      );

      setTransactions(txs.reverse()); // Most recent first
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">No transactions found</p>
        <p className="text-sm text-gray-500 mt-2">
          Send a transaction to see it appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Transaction History</h3>
        <button
          onClick={fetchTransactionHistory}
          className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500 rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="space-y-3">
        {transactions.map((tx, index) => (
          <div
            key={tx.hash + index}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {tx.status === 'success' ? (
                  <span className="text-green-500">✅</span>
                ) : tx.status === 'failed' ? (
                  <span className="text-red-500">❌</span>
                ) : (
                  <span className="text-yellow-500">⏳</span>
                )}
                <a
                  href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono text-sm"
                >
                  {truncateHash(tx.hash)}
                </a>
              </div>
              <span className="text-xs text-gray-500">
                {formatTimestamp(tx.timestamp)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">From:</span>
                <div className="font-mono text-gray-300 mt-1">
                  {truncateAddress(tx.from)}
                </div>
              </div>
              <div>
                <span className="text-gray-400">To:</span>
                <div className="font-mono text-gray-300 mt-1">
                  {truncateAddress(tx.to)}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Amount:</span>
                <div className="text-green-400 font-semibold mt-1">
                  {tx.tokenAmount} {tx.tokenSymbol}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Gas Used:</span>
                <div className="text-purple-400 mt-1">
                  {Number(tx.gasUsed).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 mt-4">
        Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
