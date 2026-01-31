'use client';

import { useState, useEffect } from 'react';
import { getConversations, Conversation } from '@/lib/indexer';
import { ContactItem } from './ContactItem';

interface ContactListProps {
  accountId: string;
  selectedPeer: string | null;
  onSelectPeer: (peer: string) => void;
}

export function ContactList({ accountId, selectedPeer, onSelectPeer }: ContactListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetch = async () => {
      const convos = await getConversations(accountId);
      if (mounted) {
        setConversations(convos);
        setIsLoading(false);
      }
    };

    fetch();
    const interval = setInterval(fetch, 15000);
    return () => { mounted = false; clearInterval(interval); };
  }, [accountId]);

  const filtered = search
    ? conversations.filter((c) => c.peer.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search */}
      <div className="p-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500 text-sm">Loading conversations...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {search ? 'No matches found' : 'No conversations yet. Start a new chat!'}
          </div>
        ) : (
          filtered.map((convo) => (
            <ContactItem
              key={convo.peer}
              peer={convo.peer}
              lastMessageAt={convo.last_message_at}
              isSelected={selectedPeer === convo.peer}
              onClick={() => onSelectPeer(convo.peer)}
            />
          ))
        )}
      </div>
    </div>
  );
}
