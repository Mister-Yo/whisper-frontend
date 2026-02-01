'use client';

import { KeyPairEd25519, KeyPair, type KeyPairString } from '@near-js/crypto';
import { KeyPairSigner } from '@near-js/signers';
import { JsonRpcProvider } from '@near-js/providers';
import { actionCreators, createTransaction } from '@near-js/transactions';
import { CONTRACT_ID, RPC_URL } from './near';

const STORAGE_PREFIX = 'whisper_signing_key_';
// 0.25 NEAR allowance (~5000 messages)
const DEFAULT_ALLOWANCE = BigInt('250000000000000000000000');
const GAS = BigInt('30000000000000');

interface StoredSigningKey {
  publicKey: string; // ed25519:...
  secretKey: string; // ed25519:...
}

// Generate a new ed25519 keypair for transaction signing
export function generateSigningKeyPair(): KeyPairEd25519 {
  return KeyPairEd25519.fromRandom();
}

// Save signing keypair to localStorage keyed by account
export function saveSigningKey(accountId: string, kp: KeyPair): void {
  if (typeof window === 'undefined') return;
  const data: StoredSigningKey = {
    publicKey: kp.getPublicKey().toString(),
    secretKey: kp.toString(),
  };
  localStorage.setItem(STORAGE_PREFIX + accountId, JSON.stringify(data));
}

// Load signing keypair from localStorage
export function loadSigningKey(accountId: string): KeyPair | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_PREFIX + accountId);
  if (!stored) return null;
  try {
    const data: StoredSigningKey = JSON.parse(stored);
    return KeyPair.fromString(data.secretKey as KeyPairString);
  } catch {
    return null;
  }
}

// Check if a signing key exists locally
export function hasLocalSigningKey(accountId: string): boolean {
  return loadSigningKey(accountId) !== null;
}

// Get the public key string for a stored signing key
export function getSigningPublicKey(accountId: string): string | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_PREFIX + accountId);
  if (!stored) return null;
  try {
    const data: StoredSigningKey = JSON.parse(stored);
    return data.publicKey;
  } catch {
    return null;
  }
}

// Check if a FunctionCall access key exists on-chain for this public key
export async function checkAccessKeyOnChain(
  accountId: string,
  publicKey: string,
): Promise<boolean> {
  try {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'ak',
        method: 'query',
        params: {
          request_type: 'view_access_key',
          account_id: accountId,
          public_key: publicKey,
          finality: 'final',
        },
      }),
    });
    const data = await res.json();
    if (data.error || data.result?.error) return false;
    // Key exists and has FunctionCall permission
    return data.result?.permission?.FunctionCall !== undefined;
  } catch {
    return false;
  }
}

// Get access key nonce and block hash for signing a transaction
async function getAccessKeyInfo(
  accountId: string,
  publicKey: string,
): Promise<{ nonce: bigint; blockHash: Uint8Array } | null> {
  try {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'ak',
        method: 'query',
        params: {
          request_type: 'view_access_key',
          account_id: accountId,
          public_key: publicKey,
          finality: 'final',
        },
      }),
    });
    const data = await res.json();
    if (data.error || data.result?.error) return null;

    const nonce = BigInt(data.result.nonce) + BigInt(1);
    // block_hash is base58 encoded — decode it
    const blockHash = baseDecode(data.result.block_hash);
    return { nonce, blockHash };
  } catch {
    return null;
  }
}

// base58 decode (NEAR block hashes are base58)
function baseDecode(value: string): Uint8Array {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const ALPHABET_MAP = new Map<string, number>();
  for (let i = 0; i < ALPHABET.length; i++) ALPHABET_MAP.set(ALPHABET[i], i);

  let bytes = [0];
  for (const char of value) {
    const val = ALPHABET_MAP.get(char);
    if (val === undefined) throw new Error(`Invalid base58 char: ${char}`);
    let carry = val;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // Handle leading zeros
  for (const char of value) {
    if (char !== '1') break;
    bytes.push(0);
  }
  return new Uint8Array(bytes.reverse());
}

// Build the AddKey action for HOT Kit
export function buildAddAccessKeyAction(publicKey: string, allowance = DEFAULT_ALLOWANCE) {
  return {
    type: 'AddKey' as const,
    params: {
      publicKey,
      accessKey: {
        nonce: 0,
        permission: {
          receiverId: CONTRACT_ID,
          methodNames: ['send_message'],
          allowance: allowance.toString(),
        },
      },
    },
  };
}

// Sign and send a send_message transaction directly via RPC (no wallet popup)
export async function sendMessageDirect(
  accountId: string,
  args: {
    to: string;
    encrypted_body: string;
    nonce: string;
    recipient_key_version: number;
    reply_to: string | null;
  },
): Promise<string> {
  const kp = loadSigningKey(accountId);
  if (!kp) throw new Error('No signing key found');

  const publicKey = kp.getPublicKey();
  const akInfo = await getAccessKeyInfo(accountId, publicKey.toString());
  if (!akInfo) throw new Error('Access key not found on-chain or expired');

  const action = actionCreators.functionCall(
    'send_message',
    args,
    GAS,
    BigInt(0), // no deposit
  );

  const tx = createTransaction(
    accountId,
    publicKey,
    CONTRACT_ID,
    akInfo.nonce,
    [action],
    akInfo.blockHash,
  );

  const signer = new KeyPairSigner(kp);
  const [, signedTx] = await signer.signTransaction(tx);

  const provider = new JsonRpcProvider({ url: RPC_URL });
  const outcome = await provider.sendTransaction(signedTx);

  // Return the transaction hash
  return outcome.transaction?.hash ?? '';
}

// Remove stored signing key
export function removeSigningKey(accountId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_PREFIX + accountId);
}
