import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "content-service",
  brokers: ["localhost:9092"],
});

const kafka_consumer = kafka.consumer({
  groupId: "content-created-consumer",
});

async function startConsumer() {
  await kafka_consumer.connect();

  await kafka_consumer.subscribe({
    topic: "content.created",
    fromBeginning: true,
  });

  await kafka_consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();

      console.log("Topic:", topic);
      console.log("Partition:", partition);
      console.log("Message:", value);

      if (value) {
        const data = JSON.parse(value);

        console.log("Content ID:", data.contentId);
        console.log("User ID:", data.userId);
      }
    },
  });
}

startConsumer();