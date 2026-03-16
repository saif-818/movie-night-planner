'use client';

import { useEffect, useState } from 'react';

export interface RoomEvent {
  type: string;
  roomId: string;
  userId?: string;
  timestamp: number;
  data: any;
}

export function useRoomUpdates(roomId: string) {
  const [events, setEvents] = useState<RoomEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    let eventSource: EventSource;

    const connect = () => {
      eventSource = new EventSource(`/api/rooms/${roomId}/stream`);

      eventSource.onopen = () => {
        console.log('✅ SSE Connected');
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            console.log('SSE connection established');
            return;
          }

          console.log('📨 Received event:', data);
          setEvents((prev) => [...prev, data]);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE Error:', error);
        setIsConnected(false);
        eventSource.close();

        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [roomId]);

  return { events, isConnected };
}