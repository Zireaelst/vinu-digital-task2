'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { Wallet, AlertTriangle, LogOut } from 'lucide-react';

export default function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <div className="flex items-center space-x-4">
      {/* RainbowKit Connect Button */}
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2"
                      type="button"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Connect Wallet</span>
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center space-x-2"
                      type="button"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Wrong Network</span>
                    </button>
                  );
                }

                return (
                  <div className="flex items-center space-x-3">
                    {/* Chain Info */}
                    <button
                      onClick={openChainModal}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2 backdrop-blur-sm"
                      type="button"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 20,
                            height: 20,
                            borderRadius: 999,
                            overflow: 'hidden',
                          }}
                        >
                          {chain.iconUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 20, height: 20 }}
                            />
                          )}
                        </div>
                      )}
                      <span className="text-sm font-medium">{chain.name}</span>
                    </button>

                    {/* Account Info */}
                    <button
                      onClick={openAccountModal}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2 backdrop-blur-sm"
                      type="button"
                    >
                      <span className="text-sm font-mono font-medium">
                        {account.displayName}
                      </span>
                      {account.displayBalance && (
                        <span className="text-xs text-zinc-400 font-normal">
                          {account.displayBalance}
                        </span>
                      )}
                    </button>

                    {/* Disconnect Button */}
                    <button
                      onClick={() => disconnect()}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 py-2 px-3 rounded-xl transition-all duration-200 backdrop-blur-sm group"
                      type="button"
                      title="Disconnect"
                    >
                      <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>

      {/* Connection Status */}
      {isConnected && address && (
        <div className="hidden md:flex items-center space-x-2 text-xs text-zinc-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="font-medium text-emerald-400">Connected</span>
        </div>
      )}
    </div>
  );
}
