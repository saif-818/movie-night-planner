import { NextRequest, NextResponse } from 'next/server';
import { PreferenceService } from '@/lib/services/preference-service';

// GET /api/rooms/:roomId/preferences - Get aggregated preferences
export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // If userId provided, get individual preferences
    if (userId) {
      const preferences = await PreferenceService.getUserPreferences(roomId, userId);
      return NextResponse.json({ preferences });
    }

    // Otherwise, get aggregated preferences
    const aggregated = await PreferenceService.aggregatePreferences(roomId);
    const status = await PreferenceService.getPreferenceStatus(roomId);

    return NextResponse.json({
      aggregated,
      status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// POST /api/rooms/:roomId/preferences - Save user preferences
export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences are required' },
        { status: 400 }
      );
    }

    const participant = await PreferenceService.savePreferences(
      roomId,
      userId,
      preferences
    );

    const status = await PreferenceService.getPreferenceStatus(roomId);

    return NextResponse.json({
      success: true,
      participant,
      status,
    });
  } catch (error: any) {
    console.error('Error in POST /api/rooms/:roomId/preferences:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save preferences' },
      { status: 500 }
    );
  }
}