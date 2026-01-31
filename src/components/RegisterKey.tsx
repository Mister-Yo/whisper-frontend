'use client';

import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { publicKeyToBase58 } from '@/lib/crypto';

export function RegisterKey() {
  const { keyPair, isSignedIn, isRegistered, registerKey } = useWallet();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  if (!isSignedIn) {
    return null;
  }

  if (isRegistered) {
    return (
      <div className="bg-green-900/20 border border-green-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <h3 className="text-green-400 font-medium">Encryption Key Registered</h3>
            <p className="text-sm text-gray-400 mt-1">
              Your public key: {keyPair ? publicKeyToBase58(keyPair.publicKey).slice(0, 16) + '...' : '...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleRegister = async () => {
    setStatus('loading');
    setError('');
    
    try {
      await registerKey();
      setStatus('idle');
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'Failed to register key');
    }
  };

  return (
    <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <span className="text-2xl">🔑</span>
        <div className="flex-1">
          <h3 className="text-yellow-400 font-medium">Register Your Encryption Key</h3>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Before you can send or receive encrypted messages, you need to register your public key on-chain.
            This is a one-time setup.
          </p>
          
          {keyPair && (
            <p className="text-xs text-gray-500 mb-4 font-mono bg-gray-800 p-2 rounded break-all">
              Public Key: {publicKeyToBase58(keyPair.publicKey)}
            </p>
          )}
          
          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}
          
          <button
            onClick={handleRegister}
            disabled={status === 'loading'}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition"
          >
            {status === 'loading' ? 'Registering...' : 'Register Key (costs ~0.01 NEAR)'}
          </button>
        </div>
      </div>
    </div>
  );
}
