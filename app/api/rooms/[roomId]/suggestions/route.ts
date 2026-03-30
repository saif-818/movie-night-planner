import { NextRequest, NextResponse } from 'next/server';
import { SuggestionService } from '@/lib/services/suggestion-service';
import { PreferenceService } from '@/lib/services/preference-service';

// GET /api/rooms/:roomId/suggestions - Get suggestions
export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;

    const suggestions = await SuggestionService.getLatestSuggestions(roomId);

    if (!suggestions) {
      return NextResponse.json(
        { error: 'No suggestions found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

// POST /api/rooms/:roomId/suggestions - Generate suggestions
export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;

    // Check if all preferences are set
    const allSet = await PreferenceService.allPreferencesSet(roomId);

    if (!allSet) {
      return NextResponse.json(
        { error: 'Not all participants have set their preferences' },
        { status: 400 }
      );
    }

    // Generate suggestions
    const suggestions = await SuggestionService.generateSuggestionsForRoom(roomId);

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error('Error in POST /api/rooms/:roomId/suggestions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}