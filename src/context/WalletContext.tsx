'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ensureHotConnector, getHotConnector, getNearAccountId, callContract } from '@/lib/hot';
import { getProfile, getStats, Profile, Stats } from '@/lib/near';
import {
  getOrCreateKeyPair,
  publicKeyToBase64,
  base64ToPublicKey,
  KeyPair,
  encryptMessage,
} from '@/lib/crypto';

interface WalletContextType {
  accountId: string | null;
  isSignedIn: boolean;
  isLoading: boolean;
  keyPair: KeyPair | null;
  isRegistered: boolean;
  profile: Profile | null;
  stats: Stats | null;
  connect: () => void;
  disconnect: () => void;
  registerKey: (displayName?: string) => Promise<void>;
  sendMessage: (
    recipient: string,
    message: string,
    recipientKeyVersion?: number,
    replyTo?: string,
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
  profile: null,
  stats: null,
  connect: () => {},
  disconnect: () => {},
  registerKey: async () => {},
  sendMessage: async () => {},
  lookupProfile: async () => null,
  refreshProfile: async () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
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
        // Wait a bit for connectors to restore sessions
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

  // When account changes, load keypair and check registration
  useEffect(() => {
    if (!accountId) {
      setKeyPair(null);
      setIsRegistered(false);
      setProfile(null);
      return;
    }

    const kp = getOrCreateKeyPair();
    setKeyPair(kp);

    getProfile(accountId).then((p) => {
      setProfile(p);
      setIsRegistered(!!p);
    });
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
        // Force clear state even if HOT Kit fails
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

  const sendMessageFn = useCallback(async (
    recipient: string,
    message: string,
    recipientKeyVersion?: number,
    replyTo?: string,
  ) => {
    if (!keyPair) throw new Error('No keypair');

    const recipientProfile = await getProfile(recipient);
    if (!recipientProfile) throw new Error('Recipient not registered on Whisper');

    const recipientPubkey = base64ToPublicKey(recipientProfile.x25519_pubkey);
    const { encrypted, nonce } = encryptMessage(message, recipientPubkey, keyPair.secretKey);

    await callContract(
      'send_message',
      {
        to: recipient,
        encrypted_body: encrypted,
        nonce,
        recipient_key_version: recipientKeyVersion ?? recipientProfile.key_version,
        reply_to: replyTo ?? null,
      },
      '30000000000000',
      '0',
    );
  }, [keyPair]);

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
        profile,
        stats,
        connect,
        disconnect,
        registerKey,
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
