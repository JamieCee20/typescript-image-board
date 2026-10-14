import express from "express";
import { PostController } from "./controllers/PostController.js";
import postRouter from "./routes/PostRoutes.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello from TypeScript!");
});
app.use("/posts", postRouter);

export default app;