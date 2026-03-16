import { NextRequest } from 'next/server';
import { createKafkaConsumer, TOPICS } from '@/lib/kafka/client';

export const dynamic = 'force-dynamic';

// SSE endpoint for real-time updates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
    
  const { roomId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      // Create Kafka consumer for this room
      const consumer = await createKafkaConsumer(`room-${roomId}-stream`);

      await consumer.subscribe({
        topics: [TOPICS.ROOM_EVENTS, TOPICS.USER_ACTIVITY],
      });

      // Handle connection close
      const closeHandler = () => {
        consumer.disconnect();
        controller.close();
      };

      request.signal.addEventListener('abort', closeHandler);

      // Process Kafka messages
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value?.toString() || '{}');

            // Only send events for this specific room
            if (event.roomId === roomId) {
              const sseMessage = `data: ${JSON.stringify(event)}\n\n`;
              controller.enqueue(encoder.encode(sseMessage));
            }
          } catch (error) {
            console.error('Error processing SSE message:', error);
          }
        },
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}