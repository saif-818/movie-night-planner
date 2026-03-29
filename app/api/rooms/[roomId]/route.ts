import { NextRequest, NextResponse } from 'next/server';
import { RoomService } from '@/lib/services/room-service';

// GET /api/rooms/:roomId - Get room details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = await RoomService.getRoomById(roomId);

    return NextResponse.json({ room });
  } catch (error: any) {
    const status = error.message === 'Room not found' ? 404 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to fetch room' },
      { status }
    );
  }
}

// DELETE /api/rooms/:roomId - Delete room (host only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = await params;
    const { userId } = await request.json();

    const room = await RoomService.getRoomById(roomId);

    if (room.hostUserId !== userId) {
      return NextResponse.json(
        { error: 'Only the host can delete the room' },
        { status: 403 }
      );
    }

    await RoomService.leaveRoom(roomId, userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete room' },
      { status: 500 }
    );
  }
}