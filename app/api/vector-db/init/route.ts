import { NextResponse } from 'next/server';
import { VectorService } from '@/lib/services/vector-service';

export async function POST() {
  try {
    await VectorService.initializeWithPopularMovies(100);

    return NextResponse.json({
      success: true,
      message: 'Vector database initialized with 100 movies',
    });
  } catch (error: any) {
    console.error('Error initializing vector DB:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize vector database' },
      { status: 500 }
    );
  }
}