'use client';

import { useState, useEffect } from 'react';
import { IndexedMessage } from '@/lib/indexer';
import { Profile } from '@/lib/near';
import { KeyPair, decryptMessage, base64ToPublicKey } from '@/lib/crypto';

interface ChatBubbleProps {
  message: IndexedMessage;
  isMine: boolean;
  keyPair: KeyPair | null;
  lookupProfile: (id: string) => Promise<Profile | null>;
}

function formatTime(tsNs: string): string {
  const ms = Number(tsNs) / 1_000_000;
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatBubble({ message, isMine, keyPair, lookupProfile }: ChatBubbleProps) {
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState(false);

  // Auto-decrypt on mount
  useEffect(() => {
    if (!keyPair) return;

    const decrypt = async () => {
      try {
        // We need the peer's public key to decrypt
        const peerId = isMine ? message.recipient : message.sender;
        const profile = await lookupProfile(peerId);
        if (!profile) {
          setDecryptError(true);
          return;
        }

        const peerPubkey = base64ToPublicKey(profile.x25519_pubkey);
        const text = decryptMessage(
          message.encrypted_body,
          message.nonce,
          peerPubkey,
          keyPair.secretKey,
        );

        if (text) {
          setDecrypted(text);
        } else {
          setDecryptError(true);
        }
      } catch {
        setDecryptError(true);
      }
    };

    decrypt();
  }, [message, keyPair, isMine, lookupProfile]);

  const hasPayment = message.amount && message.amount !== '0';

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isMine
            ? 'bg-emerald-700 text-white rounded-br-md'
            : 'bg-gray-800 text-white rounded-bl-md'
        }`}
      >
        {/* Message text */}
        {decrypted ? (
          <p className="text-sm whitespace-pre-wrap break-words">{decrypted}</p>
        ) : decryptError ? (
          <p className="text-sm text-gray-400 italic">Unable to decrypt</p>
        ) : (
          <p className="text-sm text-gray-400 italic">Decrypting...</p>
        )}

        {/* Payment badge */}
        {hasPayment && (
          <div className={`text-xs mt-1 ${isMine ? 'text-emerald-300' : 'text-emerald-400'}`}>
            {(parseInt(message.amount!) / 1e24).toFixed(4)} NEAR attached
          </div>
        )}

        {/* Time */}
        <div className={`text-[10px] mt-1 ${isMine ? 'text-emerald-300/60' : 'text-gray-500'} text-right`}>
          {formatTime(message.timestamp_ns)}
        </div>
      </div>
    </div>
  );
}
