import { NextRequest } from 'next/server';
import { createKafkaConsumer, TOPICS } from '@/lib/kafka/client';

export const dynamic = 'force-dynamic';

// Global consumers map to reuse Kafka consumers across connections
const activeConsumers = new Map<string, {
  consumer: any;
  listeners: Set<(event: any) => void>;
  isRunning: boolean;
}>();

// SSE endpoint for real-time updates
export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      console.log(`🔌 SSE connection opened for room: ${roomId}`);

      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', roomId })}\n\n`)
      );

      // Create event listener for this connection
      const eventListener = (event: any) => {
        try {
          const sseMessage = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(sseMessage));
        } catch (error) {
          console.error('Error sending SSE message:', error);
        }
      };

      // Get or create consumer for this room
      let consumerData = activeConsumers.get(roomId);

      if (!consumerData) { 
        console.log(`📡 Creating new Kafka consumer for room: ${roomId}`);
        
        const consumer = await createKafkaConsumer(`room-${roomId}-stream`);
        consumerData = {
          consumer,
          listeners: new Set(),
          isRunning: false,
        };
        activeConsumers.set(roomId, consumerData);

        // Subscribe to topics
        await consumer.subscribe({
          topics: [TOPICS.ROOM_EVENTS, TOPICS.USER_ACTIVITY, TOPICS.SUGGESTIONS],
          fromBeginning: false,
        });

        // Start consuming if not already running
        if (!consumerData.isRunning) {
          consumerData.isRunning = true;

          consumer.run({
            eachMessage: async ({ topic, partition, message }: any) => {
              try {
                const event = JSON.parse(message.value?.toString() || '{}');

                // Only broadcast events for this specific room
                if (event.roomId === roomId) {
                  console.log(`📨 Broadcasting event to ${consumerData!.listeners.size} clients:`, event.type);
                  
                  // Broadcast to all listeners
                  consumerData!.listeners.forEach((listener) => {
                    listener(event);
                  });
                }
              } catch (error) {
                console.error('Error processing Kafka message:', error);
              }
            },
          }).catch((error) => {
            console.error('Kafka consumer error:', error);
            consumerData!.isRunning = false;
          });
        }
      }

      // Add this connection's listener
      consumerData.listeners.add(eventListener);
      console.log(`👥 Active listeners for room ${roomId}: ${consumerData.listeners.size}`);

      // Handle connection close
      const cleanup = async () => {
        console.log(`🔌 SSE connection closed for room: ${roomId}`);
        
        if (consumerData) {
          consumerData.listeners.delete(eventListener);
          console.log(`👥 Remaining listeners for room ${roomId}: ${consumerData.listeners.size}`);

          // If no more listeners, disconnect consumer after a delay
          if (consumerData.listeners.size === 0) {
            console.log(`⏱️ Scheduling consumer cleanup for room ${roomId} in 30 seconds`);
            
            setTimeout(async () => {
              const currentData = activeConsumers.get(roomId);
              if (currentData && currentData.listeners.size === 0) {
                console.log(`🧹 Cleaning up consumer for room ${roomId}`);
                try {
                  await currentData.consumer.disconnect();
                  activeConsumers.delete(roomId);
                } catch (error) {
                  console.error('Error disconnecting consumer:', error);
                }
              }
            }, 30000); // 30 second delay
          }
        }

        try {
          controller.close();
        } catch (error) {
          // Controller already closed
        }
      };

      // Listen for abort signal
      request.signal.addEventListener('abort', cleanup);

      // Return cleanup function
      return cleanup;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  });
}