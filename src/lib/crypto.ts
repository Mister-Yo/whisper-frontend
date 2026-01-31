import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import bs58 from 'bs58';

const STORAGE_KEY = 'whisper_keypair';

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

// Generate a new x25519 keypair for encryption
export function generateKeyPair(): KeyPair {
  return nacl.box.keyPair();
}

// Save keypair to localStorage (encrypted with password in future)
export function saveKeyPair(keyPair: KeyPair): void {
  if (typeof window === 'undefined') return;
  const data = {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Load keypair from localStorage
export function loadKeyPair(): KeyPair | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    const data = JSON.parse(stored);
    return {
      publicKey: decodeBase64(data.publicKey),
      secretKey: decodeBase64(data.secretKey),
    };
  } catch {
    return null;
  }
}

// Get or create keypair
export function getOrCreateKeyPair(): KeyPair {
  let keyPair = loadKeyPair();
  if (!keyPair) {
    keyPair = generateKeyPair();
    saveKeyPair(keyPair);
  }
  return keyPair;
}

// Convert public key to base58 for contract storage
export function publicKeyToBase58(publicKey: Uint8Array): string {
  return bs58.encode(publicKey);
}

// Convert base58 public key back to Uint8Array
export function base58ToPublicKey(base58: string): Uint8Array {
  return bs58.decode(base58);
}

// Encrypt a message for a recipient
export function encryptMessage(
  message: string,
  recipientPublicKey: Uint8Array,
  senderSecretKey: Uint8Array
): { encrypted: string; nonce: string } {
  const messageBytes = decodeUTF8(message);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  
  const encrypted = nacl.box(
    messageBytes,
    nonce,
    recipientPublicKey,
    senderSecretKey
  );
  
  return {
    encrypted: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
  };
}

// Decrypt a message from a sender
export function decryptMessage(
  encryptedBase64: string,
  nonceBase64: string,
  senderPublicKey: Uint8Array,
  recipientSecretKey: Uint8Array
): string | null {
  try {
    const encrypted = decodeBase64(encryptedBase64);
    const nonce = decodeBase64(nonceBase64);
    
    const decrypted = nacl.box.open(
      encrypted,
      nonce,
      senderPublicKey,
      recipientSecretKey
    );
    
    if (!decrypted) return null;
    return encodeUTF8(decrypted);
  } catch {
    return null;
  }
}
