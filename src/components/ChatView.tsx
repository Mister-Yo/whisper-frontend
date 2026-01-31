'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { getMessages, IndexedMessage } from '@/lib/indexer';
import { ChatBubble } from './ChatBubble';
import { MessageInput } from './MessageInput';

interface ChatViewProps {
  peer: string;
  onBack: () => void;
}

export function ChatView({ peer, onBack }: ChatViewProps) {
  const { accountId, keyPair, lookupProfile } = useWallet();
  const [messages, setMessages] = useState<IndexedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages for this conversation
  useEffect(() => {
    if (!accountId) return;
    let mounted = true;

    const fetchMsgs = async () => {
      const msgs = await getMessages(accountId, peer);
      if (mounted) {
        setMessages(msgs);
        setIsLoading(false);
      }
    };

    fetchMsgs();
    const interval = setInterval(fetchMsgs, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [accountId, peer]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3 bg-gray-900/50">
        {/* Back button (mobile) */}
        <button
          onClick={onBack}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Peer info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{peer}</h3>
          <p className="text-xs text-gray-500">End-to-end encrypted</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Send the first encrypted message to {peer}</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isMine={msg.sender === accountId}
              keyPair={keyPair}
              lookupProfile={lookupProfile}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <MessageInput peer={peer} />
    </div>
  );
}
