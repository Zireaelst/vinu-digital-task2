'use client';

import { useState, useEffect } from 'react';
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
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-white mb-4">📊 Contract Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div>
            <span className="text-gray-400">EntryPoint:</span>
            <br />
            <code className="text-blue-400 break-all">{formatAddress(CONTRACT_ADDRESSES.entryPoint)}</code>
          </div>
          
          <div>
            <span className="text-gray-400">Account Factory:</span>
            <br />
            <code className="text-blue-400 break-all">{formatAddress(CONTRACT_ADDRESSES.simpleAccountFactory)}</code>
          </div>
          
          <div>
            <span className="text-gray-400">Paymaster:</span>
            <br />
            <code className="text-blue-400 break-all">{formatAddress(CONTRACT_ADDRESSES.sponsorPaymaster)}</code>
          </div>
        </div>
        
        <div className="space-y-2">
          <div>
            <span className="text-gray-400">Test Token:</span>
            <br />
            <code className="text-blue-400 break-all">{formatAddress(CONTRACT_ADDRESSES.testToken)}</code>
            {!info.loading && (
              <div className="text-gray-300 mt-1">
                {info.tokenName} ({info.tokenSymbol})
              </div>
            )}
          </div>
          
          <div>
            <span className="text-gray-400">Your Account:</span>
            <br />
            <code className="text-blue-400 break-all">{formatAddress(accountAddress)}</code>
          </div>
          
          <div>
            <span className="text-gray-400">Token Balance:</span>
            <br />
            <span className="text-green-400 font-mono text-lg">
              {info.loading ? '...' : formatEther(info.accountBalance)} {info.tokenSymbol}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-900/30 rounded border border-blue-500/30">
        <div className="text-blue-300 text-sm">
          🌐 <strong>Network:</strong> Sepolia Testnet
        </div>
        <div className="text-blue-300 text-sm mt-1">
          ⛽ <strong>Gas Sponsorship:</strong> Enabled via Paymaster
        </div>
      </div>
    </div>
  );
}