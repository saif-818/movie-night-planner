import { Kafka, Producer, Consumer } from 'kafkajs';

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'movie-night-planner',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

let producer: Producer | null = null;

export async function getKafkaProducer(): Promise<Producer> {
  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
    console.log('✅ Kafka producer connected');
  }
  return producer;
}

export async function createKafkaConsumer(groupId: string): Promise<Consumer> {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  console.log(`✅ Kafka consumer connected (group: ${groupId})`);
  return consumer;
}

export const TOPICS = {
  ROOM_EVENTS: 'room-events',
  USER_ACTIVITY: 'user-activity',
  VOTES: 'votes',
  SUGGESTIONS: 'suggestions',
  REAL_TIME_UPDATES: 'real-time-updates',
} as const;

export type EventType =
  | 'ROOM_CREATED'
  | 'USER_JOINED_ROOM'
  | 'USER_LEFT_ROOM'
  | 'PREFERENCE_UPDATED'
  | 'VOTE_CAST'
  | 'SUGGESTION_REQUESTED'
  | 'SUGGESTIONS_GENERATED'
  | 'MOVIE_SELECTED';

export interface KafkaEvent<T = any> {
  type: EventType;
  roomId: string;
  userId?: string;
  timestamp: number;
  data: T;
}