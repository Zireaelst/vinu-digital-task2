'use client';

import { useState, useEffect } from 'react';
import { Shield, ExternalLink } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';
import { getTestTokenContract } from '@/utils/erc4337';
import { formatAddress, formatEther } from '@/utils/erc4337';

interface ContractInfo {
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  accountBalance: string;
  loading: boolean;
}

export default function ContractInfo({ accountAddress }: { accountAddress: string }) {
  const [info, setInfo] = useState<ContractInfo>({
    tokenName: '',
    tokenSymbol: '',
    tokenDecimals: 18,
    accountBalance: '0',
    loading: true
  });

  useEffect(() => {
    async function loadContractInfo() {
      try {
        const testToken = getTestTokenContract();
        
        const [name, symbol, decimals, balance] = await Promise.all([
          testToken.name(),
          testToken.symbol(),
          testToken.decimals(),
          testToken.balanceOf(accountAddress)
        ]);

        setInfo({
          tokenName: name,
          tokenSymbol: symbol,
          tokenDecimals: Number(decimals),
          accountBalance: balance.toString(),
          loading: false
        });
      } catch (error) {
        console.error('Failed to load contract info:', error);
        setInfo(prev => ({ ...prev, loading: false }));
      }
    }

    if (accountAddress) {
      loadContractInfo();
    }
  }, [accountAddress]);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-6 flex items-center space-x-2">
        <Shield className="w-6 h-6 text-blue-400" />
        <span>Smart Contract Addresses</span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-zinc-400 text-sm mb-2">EntryPoint</div>
            <code className="text-blue-400 font-mono text-sm break-all">{formatAddress(CONTRACT_ADDRESSES.entryPoint)}</code>
            <a 
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.entryPoint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-blue-400 transition-colors mt-2 inline-flex items-center space-x-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>View on Etherscan</span>
            </a>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-zinc-400 text-sm mb-2">Account Factory</div>
            <code className="text-purple-400 font-mono text-sm break-all">{formatAddress(CONTRACT_ADDRESSES.simpleAccountFactory)}</code>
            <a 
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.simpleAccountFactory}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-purple-400 transition-colors mt-2 inline-flex items-center space-x-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>View on Etherscan</span>
            </a>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-zinc-400 text-sm mb-2">Paymaster (Gas Sponsor)</div>
            <code className="text-emerald-400 font-mono text-sm break-all">{formatAddress(CONTRACT_ADDRESSES.sponsorPaymaster)}</code>
            <a 
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.sponsorPaymaster}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors mt-2 inline-flex items-center space-x-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>View on Etherscan</span>
            </a>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-zinc-400 text-sm mb-2">Test Token (ERC-20)</div>
            <code className="text-yellow-400 font-mono text-sm break-all">{formatAddress(CONTRACT_ADDRESSES.testToken)}</code>
            {!info.loading && (
              <div className="text-white mt-2 font-medium">
                {info.tokenName} ({info.tokenSymbol})
              </div>
            )}
            <a 
              href={`https://sepolia.etherscan.io/token/${CONTRACT_ADDRESSES.testToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-yellow-400 transition-colors mt-2 inline-flex items-center space-x-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>View on Etherscan</span>
            </a>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-zinc-400 text-sm mb-2">Your Smart Account</div>
            <code className="text-pink-400 font-mono text-sm break-all">{formatAddress(accountAddress)}</code>
            <a 
              href={`https://sepolia.etherscan.io/address/${accountAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-pink-400 transition-colors mt-2 inline-flex items-center space-x-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>View on Etherscan</span>
            </a>
          </div>
          
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
            <div className="text-emerald-300 text-sm mb-2">Token Balance</div>
            <div className="text-emerald-400 font-mono text-2xl font-bold">
              {info.loading ? '...' : formatEther(info.accountBalance)} {info.tokenSymbol}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
        <div className="flex items-center space-x-2 text-blue-300 text-sm mb-2">
          <span>🌐</span>
          <strong>Network:</strong>
          <span>Sepolia Testnet</span>
        </div>
        <div className="flex items-center space-x-2 text-blue-300 text-sm">
          <span>⛽</span>
          <strong>Gas Sponsorship:</strong>
          <span>Enabled via Paymaster</span>
        </div>
      </div>
    </div>
  );
}