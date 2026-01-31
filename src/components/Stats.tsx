'use client';

import { useWallet } from '@/context/WalletContext';

export function Stats() {
  const { stats } = useWallet();

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
        <p className="text-2xl font-bold text-white">{stats.total_profiles}</p>
        <p className="text-sm text-gray-400">Registered Users</p>
      </div>
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
        <p className="text-2xl font-bold text-white">{stats.total_messages}</p>
        <p className="text-sm text-gray-400">Messages Sent</p>
      </div>
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
        <p className="text-2xl font-bold text-white">{stats.total_groups}</p>
        <p className="text-sm text-gray-400">Groups Created</p>
      </div>
    </div>
  );
}
