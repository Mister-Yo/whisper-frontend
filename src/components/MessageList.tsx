'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { getMessages, Message } from '@/lib/indexer';
import { decryptMessage, base58ToPublicKey } from '@/lib/crypto';

export function MessageList() {
  const { accountId, keyPair, isSignedIn, lookupProfile } = useWallet();
  const [messages, setMessages] = useState<Message[]>([]);
  const [decryptedMessages, setDecryptedMessages] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [senderKeys, setSenderKeys] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!accountId) return;
    
    const fetchMessages = async () => {
      setIsLoading(true);
      const msgs = await getMessages(accountId);
      setMessages(msgs);
      setIsLoading(false);
    };
    
    fetchMessages();
    // Poll every 30s
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [accountId]);

  const decryptMsg = async (msg: Message) => {
    if (!keyPair) return;
    
    // Get sender's public key
    let senderKey = senderKeys.get(msg.sender);
    if (!senderKey) {
      const profile = await lookupProfile(msg.sender);
      if (profile) {
        senderKey = profile.public_key;
        setSenderKeys(prev => new Map(prev).set(msg.sender, senderKey!));
      }
    }
    
    if (!senderKey) {
      setDecryptedMessages(prev => new Map(prev).set(msg.id, '[Sender key not found]'));
      return;
    }
    
    const decrypted = decryptMessage(
      msg.encrypted_content,
      msg.nonce,
      base58ToPublicKey(senderKey),
      keyPair.secretKey
    );
    
    setDecryptedMessages(prev => new Map(prev).set(msg.id, decrypted || '[Decryption failed]'));
  };

  if (!isSignedIn) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <p className="text-gray-400 text-center">Connect wallet to view messages</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h2 className="text-lg font-semibold text-white mb-4">📥 Inbox</h2>
      
      {isLoading && messages.length === 0 ? (
        <p className="text-gray-400 text-center py-8">Loading messages...</p>
      ) : messages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No messages yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Note: Messages appear here after the indexer processes them.
            The indexer is still being set up.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-400 font-medium">{msg.sender}</span>
                <span className="text-xs text-gray-500">
                  {new Date(msg.timestamp).toLocaleString()}
                </span>
              </div>
              
              {decryptedMessages.has(msg.id) ? (
                <p className="text-white">{decryptedMessages.get(msg.id)}</p>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-gray-500 text-sm font-mono flex-1 truncate">
                    {msg.encrypted_content.slice(0, 40)}...
                  </p>
                  <button
                    onClick={() => decryptMsg(msg)}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Decrypt
                  </button>
                </div>
              )}
              
              {msg.attached_amount !== '0' && (
                <p className="text-xs text-green-400 mt-2">
                  💰 {(parseInt(msg.attached_amount) / 1e24).toFixed(2)} NEAR attached
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
