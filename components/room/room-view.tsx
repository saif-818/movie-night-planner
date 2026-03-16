'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ParticipantList from './participant-list';
import { useRoomUpdates } from '../../hooks/useRoomUpdates';
import { Copy, Share2, Wifi, WifiOff } from 'lucide-react';

interface RoomViewProps {
  initialRoom: any;
  shareableLink: string;
}

export default function RoomView({ initialRoom, shareableLink }: RoomViewProps) {
  const [room, setRoom] = useState(initialRoom);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { events, isConnected } = useRoomUpdates(initialRoom.id);
  const router = useRouter();

  // Get current user from localStorage
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    setCurrentUserId(userId);
  }, []);

  // Handle real-time events
  useEffect(() => {
    if (events.length === 0) return;

    const latestEvent = events[events.length - 1];

    switch (latestEvent.type) {
      case 'USER_JOINED_ROOM':
      case 'USER_LEFT_ROOM':
        // Refresh room data
        fetch(`/api/rooms/${room.id}`)
          .then((res) => res.json())
          .then((data) => setRoom(data.room))
          .catch((error) => console.error('Error refreshing room:', error));
        break;

      default:
        break;
    }
  }, [events, room.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    alert('Link copied to clipboard!');
  };

  const handleLeaveRoom = async () => {
    if (!currentUserId) return;

    try {
      const response = await fetch(`/api/rooms/${room.id}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (response.ok) {
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        router.push('/');
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const isHost = room.hostUserId === currentUserId;
  const isInRoom = room.participants.some(
    (p: any) => p.userId === currentUserId
  );

  return (
    <div>
      {/* Room Header */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Movie Night Room
            </h1>
            <p className="text-gray-600">
              Room ID: <span className="font-mono">{room.id.slice(0, 8)}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
                isConnected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {isConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              {isConnected ? 'Live' : 'Disconnected'}
            </div>
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                room.status === 'waiting'
                  ? 'bg-yellow-100 text-yellow-800'
                  : room.status === 'voting'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
            </div>
          </div>
        </div>

        {/* Share Link */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Invite Friends
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareableLink}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        </div>

        {/* Participants */}
        <ParticipantList
          participants={room.participants}
          hostUserId={room.hostUserId}
          currentUserId={currentUserId || undefined}
        />

        {/* Actions */}
        {isInRoom && (
          <div className="mt-6 flex gap-3">
            {isHost && (
              <button
                onClick={() => alert('Phase 3: Start preferences coming soon!')}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Start Setting Preferences
              </button>
            )}
            <button
              onClick={handleLeaveRoom}
              className="px-6 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
            >
              Leave Room
            </button>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-semibold">✓</span>
            </div>
            <p className="text-gray-800">Room created and participants joined</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-400 font-semibold">2</span>
            </div>
            <p className="text-gray-400">Set preferences - Coming in Phase 3</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-400 font-semibold">3</span>
            </div>
            <p className="text-gray-400">Get AI suggestions - Coming in Phase 4</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-400 font-semibold">4</span>
            </div>
            <p className="text-gray-400">Vote on movies - Coming in Phase 5</p>
          </div>
        </div>
      </div>

      {/* Debug: Recent Events (only in development) */}
      {process.env.NODE_ENV === 'development' && events.length > 0 && (
        <div className="mt-6 bg-gray-900 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">
            Recent Events (Debug)
          </h3>
          <div className="space-y-2 text-xs font-mono">
            {events.slice(-5).map((event, idx) => (
              <div key={idx} className="bg-gray-800 p-2 rounded">
                <span className="text-green-400">{event.type}</span>
                {' - '}
                {new Date(event.timestamp).toLocaleTimeString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}