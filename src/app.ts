import express from "express";
import { PostController } from "./controllers/PostController.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello from TypeScript!");
});
app.get("/posts", PostController.getAllPosts);
app.get("/posts/:id", PostController.getPostById);
app.post("/posts", PostController.createPost);
app.patch("/posts/:id", PostController.updatePost);

export default app;