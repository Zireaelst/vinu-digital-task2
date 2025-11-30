'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';

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
                      <span>🔗</span>
                      <span>Cüzdan Bağla</span>
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
                      <span>⚠️</span>
                      <span>Yanlış Ağ</span>
                    </button>
                  );
                }

                return (
                  <div className="flex items-center space-x-3">
                    {/* Chain Info */}
                    <button
                      onClick={openChainModal}
                      className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
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
                      <span className="text-sm">{chain.name}</span>
                    </button>

                    {/* Account Info */}
                    <button
                      onClick={openAccountModal}
                      className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                      type="button"
                    >
                      <span className="text-sm font-mono">
                        {account.displayName}
                      </span>
                      {account.displayBalance && (
                        <span className="text-xs text-gray-300">
                          ({account.displayBalance})
                        </span>
                      )}
                    </button>

                    {/* Disconnect Button */}
                    <button
                      onClick={() => disconnect()}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg transition-colors"
                      type="button"
                      title="Bağlantıyı Kes"
                    >
                      <span>🔌</span>
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
        <div className="hidden md:flex items-center space-x-2 text-sm text-gray-300">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Bağlandı</span>
        </div>
      )}
    </div>
  );
}
