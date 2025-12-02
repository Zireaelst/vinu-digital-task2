'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { 
  buildBatchTransferUserOp, 
  formatAddress, 
  isValidAddress, 
  isValidAmount 
} from '@/utils/erc4337';
import { bundlerClient } from '@/utils/bundler';
import { DEMO_PRIVATE_KEY, DEMO_ACCOUNT_ADDRESS, CONTRACT_ADDRESSES } from '@/config/wagmi';

interface Recipient {
  id: string;
  address: string;
  amount: string;
}

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

interface BatchTransferState {
  recipients: Recipient[];
  loading: boolean;
  success: boolean;
  error: string;
  userOp: UserOperation | null;
  txHash: string;
  gasEstimate: {
    singleTx: string;
    batch: string;
    saved: string;
    percentSaved: number;
  } | null;
}

export default function BatchTransfer() {
  const { address: connectedAddress, isConnected } = useAccount();
  
  const [state, setState] = useState<BatchTransferState>({
    recipients: [{ id: '1', address: '', amount: '' }],
    loading: false,
    success: false,
    error: '',
    userOp: null,
    txHash: '',
    gasEstimate: null
  });

  const addRecipient = () => {
    setState(prev => ({
      ...prev,
      recipients: [...prev.recipients, { id: Date.now().toString(), address: '', amount: '' }]
    }));
  };

  const removeRecipient = (id: string) => {
    if (state.recipients.length > 1) {
      setState(prev => ({
        ...prev,
        recipients: prev.recipients.filter(r => r.id !== id)
      }));
    }
  };

  const updateRecipient = (id: string, field: 'address' | 'amount', value: string) => {
    setState(prev => ({
      ...prev,
      recipients: prev.recipients.map(r => 
        r.id === id ? { ...r, [field]: value } : r
      ),
      error: '',
      success: false
    }));
  };

  const validateInputs = (): boolean => {
    for (const recipient of state.recipients) {
      if (!recipient.address) {
        setState(prev => ({ ...prev, error: 'Please enter all recipient addresses' }));
        return false;
      }
      if (!isValidAddress(recipient.address)) {
        setState(prev => ({ ...prev, error: `Invalid address: ${recipient.address}` }));
        return false;
      }
      if (!recipient.amount) {
        setState(prev => ({ ...prev, error: 'Please enter all amounts' }));
        return false;
      }
      if (!isValidAmount(recipient.amount)) {
        setState(prev => ({ ...prev, error: `Invalid amount: ${recipient.amount}` }));
        return false;
      }
    }
    return true;
  };

  const buildUserOperation = async () => {
    if (!validateInputs()) return;
    if (!isConnected) {
      setState(prev => ({ ...prev, error: 'Please connect your wallet first' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      console.log('🚀 Building Batch Transfer UserOperation...');
      console.log('👛 Connected Wallet:', connectedAddress);
      console.log('🔀 Mode: Demo Account');
      console.log('� Recipients:', state.recipients);

      // Always use demo account for now
      const userOp = await buildBatchTransferUserOp(
        DEMO_ACCOUNT_ADDRESS,
        state.recipients,
        DEMO_PRIVATE_KEY
      );

      console.log('✅ UserOperation built:', userOp);

      setState(prev => ({
        ...prev,
        loading: false,
        success: true,
        userOp,
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

  const executeBatchTransfer = async () => {
    if (!state.userOp) {
      setState(prev => ({ ...prev, error: 'Please build UserOperation first' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      console.log('🚀 Submitting UserOperation to bundler...');
      console.log('📋 UserOp:', state.userOp);

      // Send UserOperation to bundler
      const userOpHash = await bundlerClient.sendUserOperation(
        state.userOp,
        CONTRACT_ADDRESSES.entryPoint
      );

      console.log('✅ UserOperation submitted!');
      console.log('UserOp Hash:', userOpHash);

      // Wait for transaction to be mined
      console.log('⏳ Waiting for transaction to be mined...');
      const receipt = await bundlerClient.waitForUserOperationReceipt(userOpHash);

      console.log('✅ Transaction confirmed!');
      console.log('Transaction Hash:', receipt.receipt.transactionHash);
      console.log('Gas Used:', receipt.actualGasUsed);
      console.log('Full Receipt:', receipt);

      setState(prev => ({
        ...prev,
        loading: false,
        success: true,
        txHash: receipt.receipt.transactionHash,
        error: ''
      }));

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Batch transfer failed:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Transaction failed: ${errorMessage}`
      }));
    }
  };

  const resetForm = () => {
    setState({
      recipients: [{ id: '1', address: '', amount: '' }],
      loading: false,
      success: false,
      error: '',
      userOp: null,
      txHash: '',
      gasEstimate: null
    });
  };

  const calculateTotals = () => {
    const totalAmount = state.recipients.reduce((sum, r) => {
      const amount = parseFloat(r.amount || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    return {
      totalRecipients: state.recipients.length,
      totalAmount: totalAmount.toFixed(6)
    };
  };

  const totals = calculateTotals();
  const allValid = state.recipients.every(r => 
    r.address && isValidAddress(r.address) && r.amount && isValidAmount(r.amount)
  );

  return (
    <div className="space-y-6">
      {/* Account Info */}
      {isConnected && connectedAddress && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="text-white font-medium mb-1">
            Using Demo SimpleAccount
          </div>
          <div className="text-gray-400 text-sm">
            Transactions are sent from the deployed demo account: <span className="text-blue-300 font-mono">{formatAddress(DEMO_ACCOUNT_ADDRESS)}</span>
            <br />
            <span className="text-gray-500 text-xs mt-1 block">Note: &quot;Own Wallet&quot; feature coming soon (requires factory contract fix)</span>
          </div>
        </div>
      )}

      {/* Original Toggle - Commented Out for Now
      {isConnected && connectedAddress && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex-1">
              <div className="text-white font-medium mb-1">
                Use My Own SimpleAccount
              </div>
              <div className="text-gray-400 text-sm">
                {false ? (
                  <>
                    <span className="text-purple-400">✓</span> Creating/using your own SimpleAccount for: <span className="text-purple-300 font-mono">{formatAddress(connectedAddress)}</span>
                  </>
                ) : (
                  <>Using demo account: <span className="text-blue-300 font-mono">{formatAddress(DEMO_ACCOUNT_ADDRESS)}</span></>
                )}
              </div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={false}
                onChange={() => {}}
              />
              <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-blue-500"></div>
            </div>
          </label>
        </div>
      )}
      */}

      {/* Wallet Status */}
      {isConnected && connectedAddress && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
          <div className="text-green-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span><strong>Wallet Connected:</strong> {formatAddress(connectedAddress)}</span>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
          <div className="text-yellow-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Please connect your wallet to continue</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">Batch Token Transfer</h2>
            <p className="text-zinc-400 text-sm mt-1">
              Execute multiple transfers in a single transaction
            </p>
          </div>
        </div>
      </div>

      {/* Recipients List */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Recipients</h3>
        
        <div className="space-y-3">
          {state.recipients.map((recipient, index) => (
            <div key={recipient.id} className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all">
              <div className="shrink-0 w-8 h-8 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center text-purple-400 font-bold text-sm">
                {index + 1}
              </div>
              
              <div className="grow grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Recipient Address (0x...)"
                  value={recipient.address}
                  onChange={(e) => updateRecipient(recipient.id, 'address', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                  disabled={state.loading}
                />
                
                <div className="relative">
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="Amount"
                    value={recipient.amount}
                    onChange={(e) => updateRecipient(recipient.id, 'amount', e.target.value)}
                    className="w-full px-3 py-2 pr-16 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                    disabled={state.loading}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">
                    TEST
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => removeRecipient(recipient.id)}
                disabled={state.recipients.length === 1 || state.loading}
                className="shrink-0 w-8 h-8 text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addRecipient}
          disabled={state.loading}
          className="w-full mt-4 px-4 py-3 border-2 border-dashed border-gray-600 hover:border-purple-500 text-gray-400 hover:text-purple-400 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span>
          Add Another Recipient
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400">Total Recipients</span>
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white">{totals.totalRecipients}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400">Total Amount</span>
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white">{totals.totalAmount} <span className="text-lg text-zinc-400">TEST</span></div>
        </div>
      </div>

      {/* Gas Estimation - Mock for now */}
      {state.userOp && (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Gas Estimation & Savings
          </h3>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-zinc-400 text-sm mb-1">Single Transactions</div>
              <div className="text-xl font-bold text-red-400">~0.0013 ETH</div>
            </div>
            
            <div>
              <div className="text-zinc-400 text-sm mb-1">Batch Transaction</div>
              <div className="text-xl font-bold text-green-400">~0.0009 ETH</div>
            </div>
            
            <div>
              <div className="text-zinc-400 text-sm mb-1">You Save</div>
              <div className="text-xl font-bold text-yellow-400">~30%</div>
              <div className="text-sm text-zinc-400">0.0004 ETH</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {!state.userOp ? (
          <button
            onClick={buildUserOperation}
            disabled={!allValid || state.loading || !isConnected}
            className="w-full px-6 py-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 disabled:from-white/5 disabled:to-white/5 border border-purple-500/30 disabled:border-white/10 text-white disabled:text-zinc-500 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {state.loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Building UserOperation...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Build Batch Transfer</span>
              </>
            )}
          </button>
        ) : !state.txHash ? (
          <button
            onClick={executeBatchTransfer}
            disabled={state.loading}
            className="w-full px-6 py-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 disabled:from-white/5 disabled:to-white/5 border border-green-500/30 disabled:border-white/10 text-white disabled:text-zinc-500 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {state.loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Executing Batch Transfer...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Execute Batch Transfer</span>
              </>
            )}
          </button>
        ) : null}

        {state.success && state.userOp && (
          <button
            onClick={resetForm}
            className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-all"
          >
            Start New Batch Transfer
          </button>
        )}
      </div>

      {/* Success Message */}
      {state.txHash && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-green-400 font-semibold">Batch transfer successful!</div>
                <div className="text-zinc-400 text-sm mt-1">
                  Transaction: {state.txHash.substring(0, 10)}...{state.txHash.substring(state.txHash.length - 8)}
                </div>
              </div>
            </div>
            <a
              href={`https://sepolia.etherscan.io/tx/${state.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-lg transition-all flex items-center gap-2"
            >
              <span>View on Etherscan</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Error Message */}
      {state.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <div className="text-red-400 font-semibold">Transaction Failed</div>
              <div className="text-zinc-400 text-sm mt-1">{state.error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Benefits Info */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Batch Operations Benefits
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 shrink-0"></div>
            <div>
              <div className="text-white font-medium">Gas Optimization</div>
              <div className="text-zinc-400">Save 30-40% on gas costs</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 shrink-0"></div>
            <div>
              <div className="text-white font-medium">Atomic Execution</div>
              <div className="text-zinc-400">All transfers succeed or fail together</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 shrink-0"></div>
            <div>
              <div className="text-white font-medium">Better UX</div>
              <div className="text-zinc-400">Single signature for multiple operations</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 shrink-0"></div>
            <div>
              <div className="text-white font-medium">Network Efficiency</div>
              <div className="text-zinc-400">Reduces blockchain congestion</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}