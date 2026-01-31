'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  initWalletSelector,
  signIn as nearSignIn,
  signOut as nearSignOut,
  getAccountId,
  getProfile,
  registerKey as nearRegisterKey,
  sendMessage as nearSendMessage,
  getStats,
  Profile,
  Stats,
} from '@/lib/near';
import { getOrCreateKeyPair, publicKeyToBase58, KeyPair, encryptMessage, base58ToPublicKey } from '@/lib/crypto';

interface WalletContextType {
  accountId: string | null;
  isSignedIn: boolean;
  isLoading: boolean;
  keyPair: KeyPair | null;
  isRegistered: boolean;
  stats: Stats | null;
  connect: () => void;
  disconnect: () => void;
  registerKey: () => Promise<void>;
  sendMessage: (recipient: string, message: string) => Promise<void>;
  lookupProfile: (accountId: string) => Promise<Profile | null>;
}

const WalletContext = createContext<WalletContextType>({
  accountId: null,
  isSignedIn: false,
  isLoading: true,
  keyPair: null,
  isRegistered: false,
  stats: null,
  connect: () => {},
  disconnect: () => {},
  registerKey: async () => {},
  sendMessage: async () => {},
  lookupProfile: async () => null,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await initWalletSelector();
        const id = await getAccountId();
        setAccountId(id);
        
        if (id) {
          // Get or create local keypair
          const kp = getOrCreateKeyPair();
          setKeyPair(kp);
          
          // Check if registered on contract
          const profile = await getProfile(id);
          setIsRegistered(!!profile);
        }
        
        // Fetch stats
        const s = await getStats();
        setStats(s);
      } catch (error) {
        console.error('Failed to initialize NEAR:', error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const connect = useCallback(() => {
    nearSignIn();
  }, []);

  const disconnect = useCallback(() => {
    nearSignOut();
    setAccountId(null);
    setIsRegistered(false);
  }, []);

  const registerKey = useCallback(async () => {
    if (!keyPair) throw new Error('No keypair');
    
    const publicKeyBase58 = publicKeyToBase58(keyPair.publicKey);
    await nearRegisterKey(publicKeyBase58);
    setIsRegistered(true);
  }, [keyPair]);

  const sendMessageFn = useCallback(async (recipient: string, message: string) => {
    if (!keyPair) throw new Error('No keypair');
    
    // Get recipient's public key
    const profile = await getProfile(recipient);
    if (!profile) throw new Error('Recipient not registered on Whisper');
    
    const recipientPublicKey = base58ToPublicKey(profile.public_key);
    const { encrypted, nonce } = encryptMessage(message, recipientPublicKey, keyPair.secretKey);
    
    await nearSendMessage(recipient, encrypted, nonce);
  }, [keyPair]);

  const lookupProfile = useCallback(async (accountId: string) => {
    return getProfile(accountId);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        accountId,
        isSignedIn: !!accountId,
        isLoading,
        keyPair,
        isRegistered,
        stats,
        connect,
        disconnect,
        registerKey,
        sendMessage: sendMessageFn,
        lookupProfile,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
