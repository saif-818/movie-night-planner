import { getKafkaProducer, KafkaEvent, TOPICS } from './client';

export async function publishEvent(
  topic: string,
  event: KafkaEvent
): Promise<void> {
  const producer = await getKafkaProducer();
  
  await producer.send({
    topic,
    messages: [
      {
        key: event.roomId,
        value: JSON.stringify(event),
        timestamp: Date.now().toString(),
      },
    ],
  });
  
  console.log(`📤 Published event: ${event.type} to ${topic}`);
}

export { TOPICS };
