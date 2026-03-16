import { NextRequest, NextResponse } from 'next/server';
import { RoomService } from '@/lib/services/room-service';
import { v4 as uuidv4 } from 'uuid';

// GET /api/rooms - Get all active rooms (optional, for testing)
export async function GET() {
  try {
    const rooms = await RoomService.getActiveRooms();
    return NextResponse.json({ rooms });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

// POST /api/rooms - Create a new room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hostName } = body;

    if (!hostName || hostName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Host name is required' },
        { status: 400 }
      );
    }

    // Generate a unique user ID for the host
    const hostUserId = uuidv4();

    const room = await RoomService.createRoom({
      hostUserId,
      hostName: hostName.trim(),
      expiresInHours: 24,
    });

    return NextResponse.json({
      success: true,
      room,
      shareableLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room/${room.id}`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/rooms:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create room' },
      { status: 500 }
    );
  }
}