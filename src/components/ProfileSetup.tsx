'use client';

import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { publicKeyToBase64 } from '@/lib/crypto';

export function ProfileSetup() {
  const { keyPair, registerKey, accountId } = useWallet();
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setStatus('loading');
    setError('');
    try {
      await registerKey(displayName.trim() || undefined);
      setStatus('idle');
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'Registration failed');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Set Up Encryption</h2>
            <p className="text-sm text-gray-400 mt-2">
              Register your encryption key on-chain to start sending and receiving messages.
            </p>
          </div>

          {/* Display name (optional) */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1.5">Display Name (optional)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={accountId?.split('.')[0] || 'Your name'}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Public key display */}
          {keyPair && (
            <div className="mb-6 p-3 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Your x25519 public key:</p>
              <p className="text-xs text-gray-400 font-mono break-all">
                {publicKeyToBase64(keyPair.publicKey)}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={status === 'loading'}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-medium transition"
          >
            {status === 'loading' ? 'Registering...' : 'Register Key (~0.01 NEAR)'}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            This is a one-time setup. Your private key stays in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
