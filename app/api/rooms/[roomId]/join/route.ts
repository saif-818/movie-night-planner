import { NextRequest, NextResponse } from 'next/server';
import { RoomService } from '@/lib/services/room-service';
import { v4 as uuidv4 } from 'uuid';

// POST /api/rooms/:roomId/join - Join a room
export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = await params;
    console.log(`Params logged : ${params}`);
    console.log(`Passing roomId from server : ${roomId}`);
    const body = await request.json();
    const { userName, userId } = body;

    if (!userName || userName.trim().length === 0) {
      return NextResponse.json(
        { error: 'User name is required' },
        { status: 400 }
      );
    }

    // Use provided userId or generate a new one
    const finalUserId = userId || uuidv4();

    const result = await RoomService.joinRoom({
      roomId,
      userId: finalUserId,
      userName: userName.trim(),
    });

    return NextResponse.json({
      success: true,
      room: result.room,
      participant: result.participant,
      userId: finalUserId,
      isNewParticipant: result.isNewParticipant,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to join room' },
      { status }
    );
  }
}