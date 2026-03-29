import { getKafkaProducer, KafkaEvent, TOPICS } from "./client";

export async function publishEvent(
  topic: string,
  event: KafkaEvent,
  retries = 3
): Promise<void> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
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

      console.log(`📤 Published event (attempt ${attempt}/${retries}): ${event.type} to ${topic}`);
      return; // Success!
      
    } catch (error) {
      lastError = error;
      console.error(
        `❌ Failed to publish event (attempt ${attempt}/${retries}):`,
        error
      );

      if (attempt < retries) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 100)
        );
      }
    }

    // All retries failed
    console.error(
      `❌ Failed to publish event after ${retries} attempts:`,
      lastError
    );
    throw new Error(`Failed to publish event: ${lastError.message}`);
  }
}

export { TOPICS };
