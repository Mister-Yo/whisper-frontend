'use client';

import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';

export function AccessKeyBanner() {
  const { setupAccessKey } = useWallet();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'dismissed'>('idle');
  const [error, setError] = useState('');

  if (status === 'dismissed') return null;

  const handleSetup = async () => {
    setStatus('loading');
    setError('');
    try {
      await setupAccessKey();
      // Banner will disappear because hasAccessKey becomes true in parent
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'Failed to set up access key');
    }
  };

  return (
    <div className="bg-emerald-900/30 border-b border-emerald-800/50 px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <p className="text-sm text-emerald-300 truncate">
          {status === 'error'
            ? error
            : 'Enable instant messaging — send messages without wallet popups'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleSetup}
          disabled={status === 'loading'}
          className="px-3 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition"
        >
          {status === 'loading' ? 'Setting up...' : status === 'error' ? 'Retry' : 'Enable'}
        </button>
        <button
          onClick={() => setStatus('dismissed')}
          className="text-gray-500 hover:text-gray-300 transition"
          title="Dismiss"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
