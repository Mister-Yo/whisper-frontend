const NETWORK_ID = 'mainnet';
const CONTRACT_ID = 'whisper.kaizap.near';
const RPC_URL = `https://rpc.${NETWORK_ID}.near.org`;

// Direct RPC call helper for view methods
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

// Contract types matching lib.rs exactly
export interface Profile {
  x25519_pubkey: string; // base64
  key_version: number;
  registered_at: string; // u64 as string
  display_name: string | null;
}

export interface Stats {
  profile_count: number;
  message_count: number;
  owner: string;
}

// View methods (no wallet needed)
export async function getProfile(accountId: string): Promise<Profile | null> {
  return viewCall<Profile>('get_profile', { account_id: accountId });
}

export async function getStats(): Promise<Stats | null> {
  return viewCall<Stats>('get_stats', {});
}

// Function call action builders for HOT Kit transactions
export function buildRegisterKeyAction(x25519Pubkey: string, displayName?: string) {
  return {
    type: 'FunctionCall' as const,
    params: {
      methodName: 'register_key',
      args: { x25519_pubkey: x25519Pubkey, display_name: displayName ?? null },
      gas: '30000000000000',
      deposit: '10000000000000000000000', // 0.01 NEAR storage
    },
  };
}

export function buildSendMessageAction(
  to: string,
  encryptedBody: string,
  nonce: string,
  recipientKeyVersion: number,
  replyTo?: string,
) {
  return {
    type: 'FunctionCall' as const,
    params: {
      methodName: 'send_message',
      args: {
        to,
        encrypted_body: encryptedBody,
        nonce,
        recipient_key_version: recipientKeyVersion,
        reply_to: replyTo ?? null,
      },
      gas: '30000000000000',
      deposit: '0',
    },
  };
}

export function buildSendMessageWithPaymentAction(
  to: string,
  encryptedBody: string,
  nonce: string,
  recipientKeyVersion: number,
  amount: string, // yoctoNEAR
  replyTo?: string,
) {
  return {
    type: 'FunctionCall' as const,
    params: {
      methodName: 'send_message_with_payment',
      args: {
        to,
        encrypted_body: encryptedBody,
        nonce,
        recipient_key_version: recipientKeyVersion,
        reply_to: replyTo ?? null,
      },
      gas: '30000000000000',
      deposit: amount,
    },
  };
}

export { CONTRACT_ID, NETWORK_ID, RPC_URL };
