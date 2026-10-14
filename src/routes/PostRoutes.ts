import { Router } from "express";
import { PostController } from "../controllers/PostController.js";

/**
 * Router for the "posts" resource.
 *
 * Paths here are relative to where this router is mounted (currently
 * "/posts" — see routes/index.ts), so "/" below actually means
 * "/api/posts" from the client's point of view.
 */
const postRouter = Router();

postRouter.get("/", PostController.getAllPosts);        // GET    /api/posts
postRouter.get("/:id", PostController.getPostById);     // GET    /api/posts/:id
postRouter.post("/", PostController.createPost);        // POST   /api/posts
postRouter.patch("/:id", PostController.updatePost);    // PATCH  /api/posts/:id
postRouter.delete("/:id", PostController.deletePost);   // DELETE /api/posts/:id

export default postRouter;
