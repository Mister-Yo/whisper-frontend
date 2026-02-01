'use client';

import { useState, useRef, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';

interface MessageInputProps {
  peer: string;
}

function nearToYocto(near: string): string {
  const parts = near.split('.');
  const whole = parts[0] || '0';
  const frac = (parts[1] || '').padEnd(24, '0').slice(0, 24);
  return (BigInt(whole) * BigInt('1000000000000000000000000') + BigInt(frac)).toString();
}

export function MessageInput({ peer }: MessageInputProps) {
  const { sendMessage, hasAccessKey } = useWallet();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [showNear, setShowNear] = useState(false);
  const [nearAmount, setNearAmount] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setError('');

    try {
      const amount = showNear && nearAmount.trim()
        ? nearToYocto(nearAmount.trim())
        : undefined;
      await sendMessage(peer, trimmed, undefined, undefined, amount);
      setText('');
      setNearAmount('');
      setShowNear(false);
      inputRef.current?.focus();
    } catch (e: any) {
      setError(e.message || 'Failed to send');
    } finally {
      setIsSending(false);
    }
  }, [text, isSending, peer, sendMessage, showNear, nearAmount]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasPayment = showNear && nearAmount.trim() && parseFloat(nearAmount) > 0;

  return (
    <div className="border-t border-gray-800 p-3">
      {error && (
        <div className="text-xs text-red-400 mb-2 px-1">{error}</div>
      )}

      {/* NEAR amount input (shown when toggled) */}
      {showNear && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 flex items-center bg-gray-800 border border-amber-700/50 rounded-lg px-3 py-1.5">
            <span className="text-amber-400 text-xs font-medium mr-2">NEAR</span>
            <input
              type="number"
              value={nearAmount}
              onChange={(e) => setNearAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              disabled={isSending}
            />
          </div>
          <button
            onClick={() => { setShowNear(false); setNearAmount(''); }}
            className="text-gray-500 hover:text-gray-300 transition p-1"
            title="Remove payment"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* NEAR toggle button */}
        <button
          onClick={() => setShowNear(!showNear)}
          className={`w-10 h-10 flex items-center justify-center rounded-xl border transition shrink-0 ${
            showNear
              ? 'bg-amber-600/20 border-amber-600 text-amber-400'
              : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
          }`}
          title="Attach NEAR payment"
          disabled={isSending}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
        </button>

        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none max-h-32 overflow-y-auto"
          style={{ minHeight: '40px' }}
          disabled={isSending}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className={`w-10 h-10 flex items-center justify-center rounded-xl text-white transition shrink-0 ${
            hasPayment
              ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 disabled:text-gray-500'
              : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500'
          }`}
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Indicator: instant vs wallet */}
      {text.trim() && (
        <div className="text-[10px] text-gray-600 mt-1 px-1">
          {hasPayment
            ? 'Requires wallet approval (payment)'
            : hasAccessKey
            ? 'Instant send'
            : 'Requires wallet approval'}
        </div>
      )}
    </div>
  );
}
