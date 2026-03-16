'use client';
import { Users, Crown } from 'lucide-react';

interface Participant {
  id: string;
  userId: string;
  name: string;
  joinedAt: Date;
}

interface ParticipantListProps {
  participants: Participant[];
  hostUserId: string;
  currentUserId?: string;
}

export default function ParticipantList({
  participants,
  hostUserId,
  currentUserId,
}: ParticipantListProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Participants ({participants.length})
        </h3>
      </div>

      <div className="space-y-2">
        {participants.map((participant) => {
          const isHost = participant.userId === hostUserId;
          const isCurrentUser = participant.userId === currentUserId;

          return (
            <div
              key={participant.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                isCurrentUser ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {participant.name}
                    {isCurrentUser && (
                      <span className="text-blue-600 text-sm ml-2">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    Joined {new Date(participant.joinedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {isHost && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <Crown className="w-4 h-4" />
                  <span className="text-xs font-medium">Host</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}