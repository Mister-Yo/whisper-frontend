'use client';

import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';

export function SendMessage() {
  const { isSignedIn, isRegistered, sendMessage, lookupProfile } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [recipientFound, setRecipientFound] = useState<boolean | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleLookup = async () => {
    if (!recipient) return;
    
    const profile = await lookupProfile(recipient);
    setRecipientFound(!!profile);
    if (!profile) {
      setError('Recipient not registered on Whisper');
    } else {
      setError('');
    }
  };

  const handleSend = async () => {
    if (!recipient || !message) return;
    
    setStatus('loading');
    setError('');
    
    try {
      await sendMessage(recipient, message);
      setStatus('success');
      setMessage('');
      setRecipient('');
      setRecipientFound(null);
      
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'Failed to send message');
    }
  };

  if (!isSignedIn) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <p className="text-gray-400 text-center">Connect wallet to send messages</p>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <p className="text-yellow-400 text-center">Register your encryption key first</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h2 className="text-lg font-semibold text-white mb-4">📤 Send Encrypted Message</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Recipient (NEAR account)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setRecipientFound(null);
              }}
              placeholder="alice.near"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleLookup}
              disabled={!recipient}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
            >
              Lookup
            </button>
          </div>
          {recipientFound === true && (
            <p className="text-xs text-green-400 mt-1">✓ Recipient found</p>
          )}
          {recipientFound === false && (
            <p className="text-xs text-red-400 mt-1">✗ {error}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your encrypted message..."
            rows={4}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {error && status === 'error' && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          onClick={handleSend}
          disabled={!recipientFound || !message || status === 'loading'}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition"
        >
          {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Sent!' : 'Send Message'}
        </button>
      </div>
    </div>
  );
}
