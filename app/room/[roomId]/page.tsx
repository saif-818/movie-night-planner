import { RoomService } from '@/lib/services/room-service';
import JoinRoomForm from '@/components/room/join-room-form';
import RoomView from '@/components/room/room-view';
import { notFound } from 'next/navigation';

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  let room;
  const { roomId } = await params;
  try {
    room = await RoomService.getRoomById(roomId);
  } catch (error) {
    notFound();
  }

  const shareableLink = `${process.env.NEXT_PUBLIC_APP_URL}/room/${room.id}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <RoomView initialRoom={room} shareableLink={shareableLink} />

        {/* Join Form */}
        <div className="mt-6">
          <JoinRoomForm roomId={room.id} />
        </div>
      </div>
    </div>
  );
}