import type { Request, Response } from "express";
import type { Post, UpdatePostInput } from "../types/Post.js";
import { isCreatePostInput, isUpdatePostInput } from "../validators/PostValidator.js";
import { PostService } from "../services/PostService.js";
import { HttpError } from "../errors/HttpError.js";
import { parsePositiveId } from "../utils/parsePositiveId.js";

// Union types: each endpoint responds with Post (or Post[]) on success,
// or { error: string } on failure.
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
    /**
     * Returns every post as JSON.
     *
     * Async handler: awaits the service, returns Promise<void> —
     * handlers respond via `res`, they don't return data. In Express 5
     * a rejected promise from an async handler is forwarded to the
     * error middleware automatically, so no try/catch is needed here
     * (in Express 4 that was a manual chore).
     */
    static async getAllPosts(req: Request<Record<string, never>, GetPostSResponse, unknown>, res: Response<GetPostSResponse>): Promise<void> {
        const posts = await postService.getAllPosts();
        res.json(posts);
    }

    /**
     * Returns a single post by ID.
     * @throws HttpError 400 if :id is not a positive integer.
     * @throws HttpError 404 if no post has that ID.
     */
    static getPostById(req: Request<PostIdParams, GetPostResponse, unknown>, res: Response<GetPostResponse>): void {
        const id = parsePositiveId(req.params.id);

        const post = postService.getPostById(id);

        if (!post) {
            throw new HttpError(404, "Post not found.");
        }

        res.json(post);
    }

    /**
     * Validates and creates a new post, returning it with 201 Created.
     * @throws HttpError 400 when the body fails the type guard or a field is blank.
     */
    static createPost(req: Request<Record<string, never>, CreatePostResponse, unknown>, res: Response<CreatePostResponse>): void {
        const body = req.body;

        if (!isCreatePostInput(body)) {
            throw new HttpError(400, "Missing required fields or invalid field types");
        }

        const title = body.title.trim();
        const image = body.image.trim();
        const content = body.content.trim();

        if (!title || !image || !content) {
            throw new HttpError(400, "All fields are required");
        }

        const newPost = postService.createPost({ title, image, content });
        res.status(201).json(newPost);

    }

    /**
     * Partially updates a post (PATCH semantics): only the supplied
     * fields change; omitted fields keep their current value.
     * @throws HttpError 400 for a bad ID, bad body, no fields, or empty values.
     * @throws HttpError 404 when the post doesn't exist.
     */
    static updatePost(
        req: Request<PostIdParams, UpdatePostResponse, unknown>,
        res: Response<UpdatePostResponse>
    ): void {
        const id = parsePositiveId(req.params.id);

        const body = req.body;

        if (!isUpdatePostInput(body)) {
            throw new HttpError(400, "Request body must be an object, and supplied post fields must be strings.");
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
            throw new HttpError(400, "Supply at least one field: title, image or content.");
        }

        if (
            input.title === "" ||
            input.image === "" ||
            input.content === ""
        ) {
            throw new HttpError(400, "Supplied fields must not be empty.");
        }

        const post = postService.updatePost(id, input);

        if (!post) {
            throw new HttpError(404, "Post not found.");
        }

        res.json(post);
    }

    /**
     * Deletes a post, responding 204 No Content on success.
     * @throws HttpError 400 if :id is not a positive integer.
     * @throws HttpError 404 if no post has that ID.
     */
    static deletePost(
        req: Request<PostIdParams, DeletePostResponse, unknown>,
        res: Response<DeletePostResponse>
    ): void {
        const id = parsePositiveId(req.params.id);

        const deleted = postService.deletePost(id);

        if (!deleted) {
            throw new HttpError(404, "Post not found.");
        }

        res.status(204).send();
    }
}