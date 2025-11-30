'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { buildTokenTransferUserOp, formatAddress, isValidAddress, isValidAmount } from '@/utils/erc4337';
import { DEMO_PRIVATE_KEY, DEMO_ACCOUNT_ADDRESS } from '@/config/wagmi';

interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

interface TransferState {
  recipient: string;
  amount: string;
  loading: boolean;
  success: boolean;
  error: string;
  userOp: UserOperation | null;
  txHash: string;
}

export default function SponsoredTransfer() {
  const { address: connectedAddress, isConnected } = useAccount();
  const [state, setState] = useState<TransferState>({
    recipient: '',
    amount: '',
    loading: false,
    success: false,
    error: '',
    userOp: null,
    txHash: ''
  });

  const handleInputChange = (field: keyof TransferState, value: string) => {
    setState(prev => ({
      ...prev,
      [field]: value,
      error: '', // Clear error when user types
      success: false
    }));
  };

  const validateInputs = (): boolean => {
    if (!state.recipient) {
      setState(prev => ({ ...prev, error: 'Please enter recipient address' }));
      return false;
    }
    
    if (!isValidAddress(state.recipient)) {
      setState(prev => ({ ...prev, error: 'Invalid recipient address' }));
      return false;
    }
    
    if (!state.amount) {
      setState(prev => ({ ...prev, error: 'Please enter transfer amount' }));
      return false;
    }
    
    if (!isValidAmount(state.amount)) {
      setState(prev => ({ ...prev, error: 'Invalid amount (must be positive number)' }));
      return false;
    }
    
    return true;
  };

  const buildUserOperation = async () => {
    if (!validateInputs()) return;
    if (!isConnected) {
      setState(prev => ({ ...prev, error: 'Lütfen önce cüzdanınızı bağlayın' }));
      return;
    }
    
    setState(prev => ({ ...prev, loading: true, error: '' }));
    
    try {
      // Use connected wallet address if available, otherwise use demo account
      const fromAddress = connectedAddress || DEMO_ACCOUNT_ADDRESS;
      
      console.log('Building UserOperation...');
      console.log('From:', fromAddress);
      console.log('To:', state.recipient);
      console.log('Amount:', state.amount);
      
      const userOp = await buildTokenTransferUserOp(
        fromAddress,
        state.recipient,
        state.amount,
        DEMO_PRIVATE_KEY // Still using demo private key for signing in this demo
      );
      
      console.log('UserOperation built:', userOp);
      
      setState(prev => ({
        ...prev,
        loading: false,
        success: true,
        userOp: userOp,
        error: ''
      }));
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to build UserOp:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Failed to build UserOperation: ${errorMessage}`
      }));
    }
  };

  const simulateTransaction = () => {
    // Simulate successful transaction for demo
    const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
    
    setState(prev => ({
      ...prev,
      txHash: mockTxHash,
      success: true
    }));
    
    // In a real implementation, this would submit the UserOp to a bundler
    console.log('🚀 UserOperation would be submitted to bundler');
    console.log('📋 UserOp:', state.userOp);
  };

  const resetForm = () => {
    setState({
      recipient: '',
      amount: '',
      loading: false,
      success: false,
      error: '',
      userOp: null,
      txHash: ''
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">💸 Sponsored Token Transfer</h2>
      <p className="text-gray-300 mb-6 text-sm">
        Send TEST tokens without paying gas fees! The paymaster will sponsor your transaction.
      </p>

      {/* Wallet Status */}
      {isConnected && connectedAddress && (
        <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3 mb-4">
          <div className="text-green-300 text-sm">
            ✅ <strong>Cüzdan Bağlandı:</strong> {formatAddress(connectedAddress)}
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3 mb-4">
          <div className="text-yellow-300 text-sm">
            ⚠️ Cüzdanınızı bağlamak için yukarıdaki &quot;Cüzdan Bağla&quot; butonunu kullanın
          </div>
        </div>
      )}
      
      {/* Input Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={state.recipient}
            onChange={(e) => handleInputChange('recipient', e.target.value)}
            placeholder="0x742d35Cc6851C2c2C6adD8C495Fa3D2B1068E589"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            disabled={state.loading}
          />
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Amount (TEST tokens)
          </label>
          <input
            type="number"
            value={state.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="100"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            disabled={state.loading}
          />
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex space-x-3 mb-6">
        <button
          onClick={buildUserOperation}
          disabled={state.loading || !state.recipient || !state.amount || !isConnected}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors"
        >
          {state.loading ? '⏳ Oluşturuluyor...' : 
           !isConnected ? '� Önce Cüzdan Bağlayın' : 
           '🔨 UserOperation Oluştur'}
        </button>
        
        {state.userOp && !state.txHash && (
          <button
            onClick={simulateTransaction}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            🚀 Gönder (Simülasyon)
          </button>
        )}
        
        {(state.success || state.error) && (
          <button
            onClick={resetForm}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            🔄 Reset
          </button>
        )}
      </div>
      
      {/* Error Display */}
      {state.error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded p-3 mb-4">
          <div className="text-red-300 text-sm">
            ❌ {state.error}
          </div>
        </div>
      )}
      
      {/* Success Display */}
      {state.success && state.userOp && (
        <div className="bg-green-900/30 border border-green-500/30 rounded p-4 mb-4">
          <div className="text-green-300 font-medium mb-2">
            ✅ UserOperation Ready!
          </div>
          
          <div className="text-sm space-y-1 text-gray-300">
            <div><strong>Gönderen:</strong> {formatAddress(connectedAddress || DEMO_ACCOUNT_ADDRESS)}</div>
            <div><strong>Alan:</strong> {formatAddress(state.recipient)}</div>
            <div><strong>Miktar:</strong> {state.amount} TEST</div>
            <div><strong>Gas Sponsoru:</strong> Paymaster</div>
            <div><strong>Nonce:</strong> {parseInt(state.userOp.nonce, 16)}</div>
          </div>
          
          {state.txHash && (
            <div className="mt-3 p-2 bg-blue-900/30 rounded">
              <div className="text-blue-300 text-sm">
                <strong>🎉 Transaction Simulated!</strong>
                <br />
                <span className="font-mono">{state.txHash}</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* UserOp Details */}
      {state.userOp && (
        <details className="bg-gray-900 rounded p-3">
          <summary className="text-gray-300 cursor-pointer hover:text-white">
            📋 View UserOperation Details
          </summary>
          <pre className="text-xs text-gray-400 mt-2 overflow-auto">
            {JSON.stringify(state.userOp, null, 2)}
          </pre>
        </details>
      )}
      
      {/* Info Box */}
      <div className="mt-6 p-4 bg-yellow-900/30 border border-yellow-500/30 rounded">
        <div className="text-yellow-300 text-sm">
          <strong>💡 How it works:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Your account is whitelisted with the paymaster</li>
            <li>UserOperation is signed with your account&apos;s private key</li>
            <li>Paymaster validates and sponsors the gas fees</li>
            <li>Transaction executes without you paying any ETH!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}