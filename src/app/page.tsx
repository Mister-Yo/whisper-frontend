'use client';

import { useWallet } from '@/context/WalletContext';
import { RegisterKey } from '@/components/RegisterKey';
import { SendMessage } from '@/components/SendMessage';
import { MessageList } from '@/components/MessageList';
import { Stats } from '@/components/Stats';

export default function Home() {
  const { isSignedIn, isLoading } = useWallet();

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          🔐 Whisper Protocol
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          End-to-end encrypted messaging on NEAR blockchain.
          Send private messages to any NEAR account.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-gray-400 mt-4">Connecting to NEAR...</p>
        </div>
      ) : !isSignedIn ? (
        <div className="max-w-lg mx-auto">
          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 text-center">
            <span className="text-6xl mb-4 block">🔒</span>
            <h2 className="text-2xl font-bold text-white mb-2">Private Messaging</h2>
            <p className="text-gray-400 mb-6">
              Connect your NEAR wallet to start sending encrypted messages.
              Your messages are end-to-end encrypted — only the recipient can read them.
            </p>
            <div className="space-y-4 text-left text-sm text-gray-400">
              <div className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <span>End-to-end encryption using x25519</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <span>Messages stored as events, not on-chain</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <span>Attach NEAR payments to messages</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <span>Perfect for agent-to-agent communication</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats */}
          <Stats />
          
          {/* Registration */}
          <RegisterKey />
          
          {/* Main Content */}
          <div className="grid md:grid-cols-2 gap-8">
            <SendMessage />
            <MessageList />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>
          Built on NEAR · Contract: <code className="text-gray-400">whisper.kaizap.near</code>
        </p>
        <p className="mt-2">
          <a 
            href="https://github.com/Mister-Yo/whisper-protocol" 
            className="text-blue-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          {' · '}
          <a 
            href="https://nearblocks.io/address/whisper.kaizap.near" 
            className="text-blue-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Contract
          </a>
        </p>
      </footer>
    </main>
  );
}
