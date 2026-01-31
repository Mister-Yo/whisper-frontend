'use client';

import { useWallet } from '@/context/WalletContext';

export function Header() {
  const { accountId, isSignedIn, isLoading, connect, disconnect, isRegistered, profile, stats } = useWallet();

  return (
    <header className="h-16 border-b border-gray-800 bg-gray-950 sticky top-0 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="text-base font-bold text-white">Whisper</span>
          {stats && (
            <span className="text-xs text-gray-500 hidden sm:inline">
              {stats.profile_count} users / {stats.message_count} msgs
            </span>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="text-sm text-gray-500">Connecting...</div>
          ) : isSignedIn ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300 hidden sm:inline">{accountId}</span>
                {isRegistered && profile?.display_name && (
                  <span className="text-xs text-gray-500 hidden lg:inline">({profile.display_name})</span>
                )}
                {isRegistered ? (
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" title="Registered" />
                ) : (
                  <span className="w-2 h-2 bg-yellow-400 rounded-full" title="Not registered" />
                )}
              </div>
              <button
                onClick={disconnect}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:border-gray-600 transition"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={connect}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg font-medium transition"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
