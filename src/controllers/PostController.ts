import type { Request, Response } from "express";
import { isCreatePostInput } from "../validators/PostValidator.js";
import { PostService } from "../services/PostService.js";
import type { Post } from "../types/Post.js";

type CreatePostResponse = Post | { error: string };
type GetPostResponse = Post | { error: string };
type GetPostSResponse = Post[] | { error: string };
type PostIdParams = {
    id: string;
};
const postService = new PostService();

export class PostController {
    static getAllPosts(req: Request<Record<string, never>, GetPostSResponse, unknown>, res: Response<GetPostSResponse>): void {
        const posts = postService.getAllPosts();
        res.json(posts);
    }

    static getPostById(req: Request<PostIdParams, GetPostResponse, unknown>, res: Response<GetPostResponse>): void {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
            res.status(400).json({ error: "Invalid post ID" });
            return;
        }

        const post = postService.getPostById(id);

        if (!post) {
            res.status(404).json({ error: "Post not found" });
            return;
        }

        res.json(post);
    }

    // static createPost(req: Request, res: Response): void {
    static createPost(req: Request<Record<string, never>, CreatePostResponse, unknown>, res: Response<CreatePostResponse>): void {
        const body = req.body;

        if (!isCreatePostInput(body)) {
            res.status(400).json({
                error: "Missing required fields or invalid field types"
            });
            return;
        }

        const title = body.title.trim();
        const image = body.image.trim();
        const content = body.content.trim();

        if (!title || !image || !content) {
            res.status(400).json({
                error: "All fields are required"
            });
            return;
        }

        const newPost = postService.createPost({ title, image, content });
        res.status(201).json(newPost);

    }
}