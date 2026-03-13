import app from "./app.js";
import { connectRabbitMQ } from "./queue/rabbitmq.js";

const PORT = 5000;

async function startServer() {
  await connectRabbitMQ();
  app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
}

startServer();
