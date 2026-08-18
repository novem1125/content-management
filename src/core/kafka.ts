import { Kafka, Producer } from "kafkajs";
import config from "../config/appsetting";

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
});

let producer: Producer | null = null;
let isConnecting = false;

/**
 * Initializes and connects the Kafka producer.
 */
export async function connectKafkaProducer(): Promise<Producer> {
  if (producer) {
    return producer;
  }

  if (isConnecting) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (producer) return producer;
  }

  try {
    isConnecting = true;
    const p = kafka.producer();
    await p.connect();
    producer = p;
    console.log(`[Kafka] Producer connected successfully (Client ID: ${config.kafka.clientId})`);
    return producer;
  } catch (error) {
    console.error("[Kafka] Failed to connect Kafka producer:", error);
    throw error;
  } finally {
    isConnecting = false;
  }
}

/**
 * Disconnects the Kafka producer gracefully.
 */
export async function disconnectKafkaProducer(): Promise<void> {
  if (producer) {
    try {
      await producer.disconnect();
      console.log("[Kafka] Producer disconnected gracefully");
    } catch (error) {
      console.error("[Kafka] Error disconnecting Kafka producer:", error);
    } finally {
      producer = null;
    }
  }
}

export interface ContentCreatedEventPayload {
  id: number;
  title: string;
  photo?: string[] | null;
  ownerId: string | null;
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * Publishes a content created event to Kafka.
 */
export async function publishContentCreatedEvent(content: ContentCreatedEventPayload): Promise<void> {
  try {
    const currentProducer = producer || (await connectKafkaProducer());
    const topic = config.kafka.topicContentCreated;

    const messagePayload = {
      event: "CONTENT_CREATED",
      timestamp: new Date().toISOString(),
      data: content,
    };

    await currentProducer.send({
      topic,
      messages: [
        {
          key: String(content.id),
          value: JSON.stringify(messagePayload),
        },
      ],
    });

    console.log(`[Kafka] Event published to topic '${topic}' for Content ID: ${content.id}`);
  } catch (error) {
    console.error(`[Kafka] Failed to publish event for Content ID: ${content.id}`, error);
  }
}
