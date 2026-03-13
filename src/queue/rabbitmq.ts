import amqp from "amqplib";
export const QUEUE_NAME = "submission_queue";

let channel: amqp.Channel;

export async function connectRabbitMQ() {

  const connection = await amqp.connect("amqp://localhost");

  channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, {
    durable: true
  });

  console.log("RabbitMQ connected");
}
export function getChannel() {
  if (!channel) {
    throw new Error("RabbitMQ not connected");
  }
  return channel;
}
export async function publishSubmissionJob(job: any) {

  channel.sendToQueue(
    QUEUE_NAME,
    Buffer.from(JSON.stringify(job)),
    { persistent: true }
  );

}