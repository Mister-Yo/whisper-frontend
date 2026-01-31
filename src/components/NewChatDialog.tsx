'use client';

import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';

interface NewChatDialogProps {
  onSelect: (peerId: string) => void;
  onClose: () => void;
}

export function NewChatDialog({ onSelect, onClose }: NewChatDialogProps) {
  const { lookupProfile } = useWallet();
  const [accountInput, setAccountInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'found' | 'not_found'>('idle');
  const [error, setError] = useState('');

  const handleCheck = async () => {
    const id = accountInput.trim().toLowerCase();
    if (!id) return;

    setStatus('checking');
    setError('');

    const profile = await lookupProfile(id);
    if (profile) {
      setStatus('found');
    } else {
      setStatus('not_found');
      setError('User not registered on Whisper');
    }
  };

  const handleStart = () => {
    const id = accountInput.trim().toLowerCase();
    if (id) onSelect(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">New Conversation</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">NEAR Account ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={accountInput}
                onChange={(e) => {
                  setAccountInput(e.target.value);
                  setStatus('idle');
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCheck();
                }}
                placeholder="alice.near"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <button
                onClick={handleCheck}
                disabled={!accountInput.trim() || status === 'checking'}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded-lg transition"
              >
                {status === 'checking' ? '...' : 'Check'}
              </button>
            </div>
          </div>

          {status === 'found' && (
            <div className="p-3 bg-emerald-900/20 border border-emerald-800/50 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-emerald-400">User found and registered on Whisper</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={status !== 'found'}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-medium transition"
          >
            Start Conversation
          </button>
        </div>
      </div>
    </div>
  );
}
