'use client';

import { useWallet } from '@/context/WalletContext';
import { ChatLayout } from '@/components/ChatLayout';

export default function Home() {
  const { isSignedIn, isLoading, connect } = useWallet();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm mt-4">Connecting...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-emerald-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Whisper Protocol</h1>
            <p className="text-gray-400 mb-8">
              End-to-end encrypted messaging on NEAR.
              Connect your wallet to start private conversations.
            </p>

            {/* Features */}
            <div className="space-y-3 text-left mb-8">
              {[
                'x25519 end-to-end encryption',
                'Messages stored as events, not on-chain data',
                'Attach NEAR payments to messages',
                'Multi-wallet support via HOT Kit',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-3 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <button
              onClick={connect}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition text-base"
            >
              Connect Wallet
            </button>

            <p className="text-xs text-gray-600 mt-4">
              Contract: whisper.kaizap.near
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <ChatLayout />;
}
