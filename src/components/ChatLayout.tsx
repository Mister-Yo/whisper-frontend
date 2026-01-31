'use client';

import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { ContactList } from './ContactList';
import { ChatView } from './ChatView';
import { NewChatDialog } from './NewChatDialog';
import { ProfileSetup } from './ProfileSetup';

export function ChatLayout() {
  const { accountId, isRegistered } = useWallet();
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [mobileView, setMobileView] = useState<'contacts' | 'chat'>('contacts');

  if (!isRegistered) {
    return <ProfileSetup />;
  }

  const handleSelectPeer = (peer: string) => {
    setSelectedPeer(peer);
    setMobileView('chat');
  };

  const handleBack = () => {
    setMobileView('contacts');
    setSelectedPeer(null);
  };

  const handleNewChat = (peerId: string) => {
    setShowNewChat(false);
    handleSelectPeer(peerId);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar — contacts list */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-gray-800 flex flex-col ${
        mobileView === 'chat' ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Sidebar header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Chats</h2>
          <button
            onClick={() => setShowNewChat(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
            title="New chat"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <ContactList
          accountId={accountId!}
          selectedPeer={selectedPeer}
          onSelectPeer={handleSelectPeer}
        />
      </div>

      {/* Main chat area */}
      <div className={`flex-1 flex flex-col ${
        mobileView === 'contacts' ? 'hidden md:flex' : 'flex'
      }`}>
        {selectedPeer ? (
          <ChatView
            peer={selectedPeer}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg">Select a chat or start a new conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* New chat dialog */}
      {showNewChat && (
        <NewChatDialog
          onSelect={handleNewChat}
          onClose={() => setShowNewChat(false)}
        />
      )}
    </div>
  );
}
