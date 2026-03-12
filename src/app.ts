import express from "express";
import submissionRoutes from "./routes/submissionRoutes"
const app = express();

app.use(express.json());
app.use("/api", submissionRoutes)
app.get("/", (_req, res) => {
  res.send("Coderun Judge API running");
});

export default app;