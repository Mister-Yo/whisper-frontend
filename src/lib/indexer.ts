const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || 'http://localhost:3002';

// Types matching contract NEP-297 events
export interface IndexedMessage {
  id: number;
  tx_hash: string;
  block_height: number;
  timestamp_ns: string;
  event_type: string; // message_sent | message_sent_with_payment
  sender: string;
  recipient: string;
  encrypted_body: string;
  nonce: string;
  recipient_key_version: number;
  reply_to: string | null;
  amount: string | null; // yoctoNEAR, present for payment messages
}

export interface Conversation {
  peer: string;
  last_message_at: string;
  last_message_preview: string; // encrypted, just for ordering
  unread_count: number;
}

export interface IndexedProfile {
  account_id: string;
  x25519_pubkey: string;
  key_version: number;
  display_name: string | null;
  registered_at: string;
}

// Get messages between current user and a specific peer
export async function getMessages(
  account: string,
  peer?: string,
  after?: number,
  limit = 50,
): Promise<IndexedMessage[]> {
  try {
    const params = new URLSearchParams({ account, limit: String(limit) });
    if (peer) params.set('with', peer);
    if (after) params.set('after', String(after));
    const response = await fetch(`${INDEXER_URL}/messages?${params}`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    console.warn('Indexer not available');
    return [];
  }
}

// Get list of conversations for an account
export async function getConversations(account: string): Promise<Conversation[]> {
  try {
    const response = await fetch(`${INDEXER_URL}/messages/conversations?account=${account}`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

// Get profile from indexer
export async function getIndexedProfile(accountId: string): Promise<IndexedProfile | null> {
  try {
    const response = await fetch(`${INDEXER_URL}/profiles/${accountId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Search profiles
export async function searchProfiles(query: string): Promise<IndexedProfile[]> {
  try {
    const response = await fetch(`${INDEXER_URL}/profiles/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

// Health check
export async function getIndexerHealth(): Promise<{ ok: boolean; lastBlock?: number } | null> {
  try {
    const response = await fetch(`${INDEXER_URL}/health`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
