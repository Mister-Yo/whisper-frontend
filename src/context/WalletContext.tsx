'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ensureHotConnector, getHotConnector, getNearAccountId, callContract, addFunctionCallAccessKey } from '@/lib/hot';
import { getProfile, getStats, Profile, Stats } from '@/lib/near';
import {
  getOrCreateKeyPair,
  publicKeyToBase64,
  base64ToPublicKey,
  KeyPair,
  encryptMessage,
} from '@/lib/crypto';
import {
  generateSigningKeyPair,
  saveSigningKey,
  loadSigningKey,
  hasLocalSigningKey,
  getSigningPublicKey,
  checkAccessKeyOnChain,
  sendMessageDirect,
} from '@/lib/access-key';

interface WalletContextType {
  accountId: string | null;
  isSignedIn: boolean;
  isLoading: boolean;
  keyPair: KeyPair | null;
  isRegistered: boolean;
  hasAccessKey: boolean;
  profile: Profile | null;
  stats: Stats | null;
  connect: () => void;
  disconnect: () => void;
  registerKey: (displayName?: string) => Promise<void>;
  setupAccessKey: () => Promise<void>;
  sendMessage: (
    recipient: string,
    message: string,
    recipientKeyVersion?: number,
    replyTo?: string,
    amount?: string,
  ) => Promise<void>;
  lookupProfile: (accountId: string) => Promise<Profile | null>;
  refreshProfile: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  accountId: null,
  isSignedIn: false,
  isLoading: true,
  keyPair: null,
  isRegistered: false,
  hasAccessKey: false,
  profile: null,
  stats: null,
  connect: () => {},
  disconnect: () => {},
  registerKey: async () => {},
  setupAccessKey: async () => {},
  sendMessage: async () => {},
  lookupProfile: async () => null,
  refreshProfile: async () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasAccessKey, setHasAccessKey] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  // Initialize HOT connector on mount and subscribe to wallet events
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const hot = await ensureHotConnector();

        // Subscribe to connect/disconnect
        hot.onConnect(() => {
          if (mounted) setAccountId(getNearAccountId());
        });
        hot.onDisconnect(() => {
          if (mounted) setAccountId(null);
        });

        // Check if already connected (session restore)
        await new Promise((r) => setTimeout(r, 1000));
        if (mounted) {
          setAccountId(getNearAccountId());
          setIsLoading(false);
        }
      } catch (e) {
        console.error('Failed to initialize HOT connector:', e);
        if (mounted) setIsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // When account changes, load keypair, check registration, check access key
  useEffect(() => {
    if (!accountId) {
      setKeyPair(null);
      setIsRegistered(false);
      setHasAccessKey(false);
      setProfile(null);
      return;
    }

    const kp = getOrCreateKeyPair();
    setKeyPair(kp);

    getProfile(accountId).then((p) => {
      console.log(`[whisper] Profile for ${accountId}:`, p);
      setProfile(p);
      setIsRegistered(!!p);
    }).catch((e) => {
      console.error(`[whisper] Failed to fetch profile:`, e);
    });

    // Check if FunctionCall access key exists
    if (hasLocalSigningKey(accountId)) {
      const pubKey = getSigningPublicKey(accountId);
      if (pubKey) {
        checkAccessKeyOnChain(accountId, pubKey).then((exists) => {
          console.log(`[whisper] Access key on-chain: ${exists}`);
          setHasAccessKey(exists);
        });
      }
    } else {
      setHasAccessKey(false);
    }
  }, [accountId]);

  // Fetch global stats once
  useEffect(() => {
    getStats().then(setStats);
  }, []);

  const connect = useCallback(async () => {
    const hot = await ensureHotConnector();
    hot.connect();
  }, []);

  const disconnect = useCallback(async () => {
    const hot = getHotConnector();
    const nearWallet = hot?.near;
    if (hot && nearWallet) {
      try {
        await hot.disconnect(nearWallet);
      } catch (e) {
        console.error('Disconnect failed:', e);
        setAccountId(null);
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!accountId) return;
    const p = await getProfile(accountId);
    setProfile(p);
    setIsRegistered(!!p);
  }, [accountId]);

  const registerKey = useCallback(async (displayName?: string) => {
    if (!keyPair) throw new Error('No keypair');

    const pubkeyBase64 = publicKeyToBase64(keyPair.publicKey);
    await callContract(
      'register_key',
      { x25519_pubkey: pubkeyBase64, display_name: displayName ?? null },
      '30000000000000',
      '10000000000000000000000',
    );

    if (accountId) {
      const p = await getProfile(accountId);
      setProfile(p);
      setIsRegistered(!!p);
    }
  }, [keyPair, accountId]);

  // One-time setup: generate signing key + send AddKey transaction
  const setupAccessKey = useCallback(async () => {
    if (!accountId) throw new Error('Not connected');

    // Generate new ed25519 keypair for signing
    const signingKey = generateSigningKeyPair();
    const pubKeyStr = signingKey.getPublicKey().toString();

    console.log(`[whisper] Setting up access key: ${pubKeyStr}`);

    // Send AddKey transaction through HOT Kit (requires wallet approval)
    await addFunctionCallAccessKey(pubKeyStr);

    // Store the signing key locally
    saveSigningKey(accountId, signingKey);
    setHasAccessKey(true);

    console.log('[whisper] Access key setup complete');
  }, [accountId]);

  const sendMessageFn = useCallback(async (
    recipient: string,
    message: string,
    recipientKeyVersion?: number,
    replyTo?: string,
    amount?: string,
  ) => {
    if (!keyPair) throw new Error('No keypair');
    if (!accountId) throw new Error('Not connected');

    const recipientProfile = await getProfile(recipient);
    if (!recipientProfile) throw new Error('Recipient not registered on Whisper');

    const recipientPubkey = base64ToPublicKey(recipientProfile.x25519_pubkey);
    const { encrypted, nonce } = encryptMessage(message, recipientPubkey, keyPair.secretKey);

    const args = {
      to: recipient,
      encrypted_body: encrypted,
      nonce,
      recipient_key_version: recipientKeyVersion ?? recipientProfile.key_version,
      reply_to: replyTo ?? null,
    };

    // If sending NEAR with message, use send_message_with_payment (always via HOT Kit)
    if (amount && amount !== '0') {
      await callContract(
        'send_message_with_payment',
        args,
        '30000000000000',
        amount,
      );
      return;
    }

    // Try direct signing first (no wallet popup)
    if (hasAccessKey && hasLocalSigningKey(accountId)) {
      try {
        console.log('[whisper] Sending message via direct signing');
        await sendMessageDirect(accountId, args);
        return;
      } catch (e) {
        console.warn('[whisper] Direct signing failed, falling back to HOT Kit:', e);
        // Access key might be expired/deleted — clear state
        setHasAccessKey(false);
      }
    }

    // Fallback: use HOT Kit (wallet popup)
    await callContract(
      'send_message',
      args,
      '30000000000000',
      '0',
    );
  }, [keyPair, accountId, hasAccessKey]);

  const lookupProfile = useCallback(async (id: string) => {
    return getProfile(id);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        accountId,
        isSignedIn: !!accountId,
        isLoading,
        keyPair,
        isRegistered,
        hasAccessKey,
        profile,
        stats,
        connect,
        disconnect,
        registerKey,
        setupAccessKey,
        sendMessage: sendMessageFn,
        lookupProfile,
        refreshProfile,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
