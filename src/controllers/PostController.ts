import type { Request, Response } from "express";
import { isCreatePostInput, isUpdatePostInput } from "../validators/PostValidator.js";
import { PostService } from "../services/PostService.js";
import type { Post, UpdatePostInput } from "../types/Post.js";

type CreatePostResponse = Post | { error: string };
type GetPostResponse = Post | { error: string };
type UpdatePostResponse = Post | { error: string };
type GetPostSResponse = Post[] | { error: string };
type DeletePostResponse = { error: string };

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

    static updatePost(
        req: Request<PostIdParams, UpdatePostResponse, unknown>,
        res: Response<UpdatePostResponse>
    ): void {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            res.status(400).json({
                error: "Post ID must be a positive integer."
            });
            return;
        }

        const body = req.body;

        if (!isUpdatePostInput(body)) {
            res.status(400).json({
                error: "Request body must be an object, and supplied post fields must be strings."
            });
            return;
        }

        const input: UpdatePostInput = {};

        if (body.title !== undefined) {
            input.title = body.title.trim();
        }

        if (body.image !== undefined) {
            input.image = body.image.trim();
        }

        if (body.content !== undefined) {
            input.content = body.content.trim();
        }

        if (Object.keys(input).length === 0) {
            res.status(400).json({
                error: "Supply at least one field: title, image or content."
            });
            return;
        }

        if (
            input.title === "" ||
            input.image === "" ||
            input.content === ""
        ) {
            res.status(400).json({
                error: "Supplied fields must not be empty."
            });
            return;
        }

        const post = postService.updatePost(id, input);

        if (!post) {
            res.status(404).json({
                error: "Post not found."
            });
            return;
        }

        res.json(post);
    }

    static deletePost(
        req: Request<PostIdParams, DeletePostResponse, unknown>,
        res: Response<DeletePostResponse>
    ): void {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            res.status(400).json({
                error: "Post ID must be a positive integer."
            });
            return;
        }

        const deleted = postService.deletePost(id);

        if (!deleted) {
            res.status(404).json({
                error: "Post not found."
            });
            return;
        }

        res.status(204).send();
    }
}