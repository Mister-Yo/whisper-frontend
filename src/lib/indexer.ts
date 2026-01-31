// Indexer API client for fetching messages
// TODO: Replace with actual indexer URL when deployed

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || 'http://localhost:3001';

export interface Message {
  id: string;
  sender: string;
  recipient: string;
  encrypted_content: string;
  nonce: string;
  attached_amount: string;
  timestamp: string;
  block_height: string;
}

export interface Profile {
  account_id: string;
  public_key: string;
  registered_at: string;
}

export async function getMessages(accountId: string): Promise<Message[]> {
  try {
    const response = await fetch(`${INDEXER_URL}/api/messages?recipient=${accountId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.messages || [];
  } catch {
    console.warn('Indexer not available, messages will be empty');
    return [];
  }
}

export async function getSentMessages(accountId: string): Promise<Message[]> {
  try {
    const response = await fetch(`${INDEXER_URL}/api/messages?sender=${accountId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.messages || [];
  } catch {
    return [];
  }
}

export async function getProfile(accountId: string): Promise<Profile | null> {
  try {
    const response = await fetch(`${INDEXER_URL}/api/profiles/${accountId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  try {
    const response = await fetch(`${INDEXER_URL}/api/profiles?search=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.profiles || [];
  } catch {
    return [];
  }
}
