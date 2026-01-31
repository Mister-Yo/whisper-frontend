'use client';

interface ContactItemProps {
  peer: string;
  lastMessageAt: string;
  isSelected: boolean;
  onClick: () => void;
}

function formatTime(ts: string): string {
  const date = new Date(Number(ts) / 1_000_000); // timestamp_ns to ms
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 86400_000) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 604800_000) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(accountId: string): string {
  const parts = accountId.split('.');
  const name = parts[0];
  return name.slice(0, 2).toUpperCase();
}

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 50%, 40%)`;
}

export function ContactItem({ peer, lastMessageAt, isSelected, onClick }: ContactItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-800/60 transition ${
        isSelected ? 'bg-gray-800 border-l-2 border-emerald-500' : 'border-l-2 border-transparent'
      }`}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
        style={{ backgroundColor: hashColor(peer) }}
      >
        {getInitials(peer)}
      </div>

      {/* Name + time */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white truncate">{peer}</span>
          {lastMessageAt && (
            <span className="text-xs text-gray-500 shrink-0 ml-2">{formatTime(lastMessageAt)}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">Encrypted message</p>
      </div>
    </button>
  );
}
