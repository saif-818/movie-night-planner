import { RoomService } from '@/lib/services/room-service';
import { PreferenceService } from '@/lib/services/preference-service';
import PreferencesPageClient from './preferences-client';
import { notFound, redirect } from 'next/navigation';

export default async function PreferencesPage({
  params,
}: {
  params: { roomId: string };
}) {
  let room;
  const { roomId } = await params;
  try {
    room = await RoomService.getRoomById(roomId);
  } catch (error) {
    notFound();
  }

  // Check if room is in correct status
  if (room.status === 'completed') {
    redirect(`/room/${roomId}/results`);
  }

  // Get preference status
  const status = await PreferenceService.getPreferenceStatus(roomId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <PreferencesPageClient
          roomId={roomId}
          room={room}
          initialStatus={status}
        />
      </div>
    </div>
  );
}