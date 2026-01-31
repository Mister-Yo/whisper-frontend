'use client';

import { useWallet } from '@/context/WalletContext';

export function Header() {
  const { accountId, isSignedIn, isLoading, connect, disconnect, isRegistered } = useWallet();

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔐</span>
          <h1 className="text-xl font-bold text-white">Whisper Protocol</h1>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">NEAR</span>
        </div>
        
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="text-gray-400">Loading...</div>
          ) : isSignedIn ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">{accountId}</span>
                {isRegistered ? (
                  <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">✓ Registered</span>
                ) : (
                  <span className="text-xs text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded">Not Registered</span>
                )}
              </div>
              <button
                onClick={disconnect}
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white border border-gray-700 rounded-lg hover:border-gray-600 transition"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={connect}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
