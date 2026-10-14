import { Router } from "express";
import { PostController } from "../controllers/PostController.js";

const postRouter = Router();

postRouter.get("/", PostController.getAllPosts);
postRouter.get("/:id", PostController.getPostById);
postRouter.post("/", PostController.createPost);
postRouter.patch("/:id", PostController.updatePost);
postRouter.delete("/:id", PostController.deletePost);

export default postRouter;