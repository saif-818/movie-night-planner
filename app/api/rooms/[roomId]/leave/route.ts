import { NextRequest, NextResponse } from 'next/server';
import { RoomService } from '@/lib/services/room-service';

// POST /api/rooms/:roomId/leave - Leave a room
export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await RoomService.leaveRoom(roomId, userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to leave room' },
      { status: 500 }
    );
  }
}