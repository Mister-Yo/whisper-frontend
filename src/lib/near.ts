import { setupWalletSelector, Wallet, WalletSelector } from '@near-wallet-selector/core';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupHereWallet } from '@near-wallet-selector/here-wallet';

const NETWORK_ID = 'mainnet';
const CONTRACT_ID = 'whisper.kaizap.near';
const RPC_URL = `https://rpc.${NETWORK_ID}.near.org`;

let selector: WalletSelector | null = null;
let wallet: Wallet | null = null;

export async function initWalletSelector(): Promise<WalletSelector> {
  if (selector) return selector;
  
  selector = await setupWalletSelector({
    network: NETWORK_ID,
    modules: [
      setupMyNearWallet(),
      setupHereWallet(),
    ],
  });
  
  return selector;
}

export async function getWallet(): Promise<Wallet | null> {
  const sel = await initWalletSelector();
  const state = sel.store.getState();
  
  if (state.accounts.length === 0) return null;
  
  if (!wallet) {
    wallet = await sel.wallet();
  }
  return wallet;
}

export async function signIn(): Promise<void> {
  const sel = await initWalletSelector();
  const myNearWallet = await sel.wallet('my-near-wallet');
  await myNearWallet.signIn({ contractId: CONTRACT_ID } as any);
}

export async function signOut(): Promise<void> {
  const w = await getWallet();
  if (w) {
    await w.signOut();
    wallet = null;
    window.location.reload();
  }
}

export async function getAccountId(): Promise<string | null> {
  const sel = await initWalletSelector();
  const state = sel.store.getState();
  return state.accounts[0]?.accountId || null;
}

// Direct RPC call helper
async function viewCall<T>(methodName: string, args: object = {}): Promise<T | null> {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          account_id: CONTRACT_ID,
          method_name: methodName,
          args_base64: btoa(JSON.stringify(args)),
          finality: 'final',
        },
      }),
    });
    
    const data = await response.json();
    if (data.error) {
      console.error('RPC error:', data.error);
      return null;
    }
    
    const result = JSON.parse(
      new TextDecoder().decode(new Uint8Array(data.result.result))
    );
    return result;
  } catch (e) {
    console.error('View call failed:', e);
    return null;
  }
}

export interface Profile {
  public_key: string;
  registered_at: string;
}

export interface Stats {
  total_profiles: string;
  total_messages: string;
  total_groups: string;
}

// View methods (no wallet needed)
export async function getProfile(accountId: string): Promise<Profile | null> {
  return viewCall<Profile>('get_profile', { account_id: accountId });
}

export async function getStats(): Promise<Stats | null> {
  return viewCall<Stats>('get_stats', {});
}

// Helper to create function call action
function functionCall(methodName: string, args: object, gas: string, deposit: string) {
  return {
    type: 'FunctionCall',
    params: { methodName, args, gas, deposit },
  } as any;
}

// Change methods (require wallet)
export async function registerKey(publicKey: string): Promise<void> {
  const w = await getWallet();
  if (!w) throw new Error('Wallet not connected');
  
  const accountId = await getAccountId();
  if (!accountId) throw new Error('No account');
  
  await w.signAndSendTransaction({
    signerId: accountId,
    receiverId: CONTRACT_ID,
    actions: [functionCall('register_key', { public_key: publicKey }, '30000000000000', '10000000000000000000000')],
  });
}

export async function sendMessage(
  recipient: string,
  encryptedContent: string,
  nonce: string,
): Promise<void> {
  const w = await getWallet();
  if (!w) throw new Error('Wallet not connected');
  
  const accountId = await getAccountId();
  if (!accountId) throw new Error('No account');
  
  await w.signAndSendTransaction({
    signerId: accountId,
    receiverId: CONTRACT_ID,
    actions: [functionCall('send_message', { recipient, encrypted_content: encryptedContent, nonce }, '30000000000000', '0')],
  });
}

export async function sendMessageWithPayment(
  recipient: string,
  encryptedContent: string,
  nonce: string,
  amount: string, // in yoctoNEAR
): Promise<void> {
  const w = await getWallet();
  if (!w) throw new Error('Wallet not connected');
  
  const accountId = await getAccountId();
  if (!accountId) throw new Error('No account');
  
  await w.signAndSendTransaction({
    signerId: accountId,
    receiverId: CONTRACT_ID,
    actions: [functionCall('send_message_with_payment', { recipient, encrypted_content: encryptedContent, nonce }, '30000000000000', amount)],
  });
}

export { CONTRACT_ID, NETWORK_ID };
