'use client';

import { useState, useRef, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';

interface MessageInputProps {
  peer: string;
}

export function MessageInput({ peer }: MessageInputProps) {
  const { sendMessage } = useWallet();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setError('');

    try {
      await sendMessage(peer, trimmed);
      setText('');
      inputRef.current?.focus();
    } catch (e: any) {
      setError(e.message || 'Failed to send');
    } finally {
      setIsSending(false);
    }
  }, [text, isSending, peer, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-800 p-3">
      {error && (
        <div className="text-xs text-red-400 mb-2 px-1">{error}</div>
      )}
      <div className="flex items-end gap-2">
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
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white transition shrink-0"
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
    </div>
  );
}
