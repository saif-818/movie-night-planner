import { publishEvent, TOPICS } from '../lib/kafka/producer';

async function testKafka() {
  try {
    await publishEvent(TOPICS.ROOM_EVENTS, {
      type: 'ROOM_CREATED',
      roomId: 'test-room-123',
      timestamp: Date.now(),
      data: { hostUserId: 'user-1' },
    });
    
    console.log('✅ Kafka test successful');
    process.exit(0);
  } catch (error) {
    console.error('❌ Kafka test failed:', error);
    process.exit(1);
  }
}

testKafka();