import type { CreatePostInput, Post, UpdatePostInput } from "../types/Post.js";
import { readFile, writeFile, rename } from "node:fs/promises";
import { isPost } from "../validators/PostValidator.js";

// The "database": an in-memory array seeded from data/posts.json at
// startup (see initialize) and written back to that file after every
// mutation (see savePosts) — so changes now SURVIVE restarts.
// Swapping in a real database later means replacing the storage inside
// this class; every caller keeps the same signatures.
let posts: Post[] = [];

/** ID for the next post created — re-derived from the data at startup
 * (highest existing ID + 1), then incremented so IDs are never reused. */
let nextPostId = 1;

/**
 * Serializes disk writes. Every save chains onto the previous one, so
 * two concurrent requests can never interleave half-written files.
 * Starts resolved so the very first save runs immediately.
 */
let writeQueue: Promise<void> = Promise.resolve();

/**
 * Persists the in-memory store to data/posts.json.
 *
 * Atomic-write pattern: content goes to a temporary file first, then a
 * single rename() swaps it into place. rename is atomic, so a crash
 * mid-write can never leave a half-written posts.json behind.
 *
 * The save is appended to writeQueue (one write at a time). A FAILURE
 * is swallowed for the queue itself (`save.catch(() => {})`) so one
 * failed save never blocks the next — but the error is still returned
 * to THIS call's caller via `save`.
 *
 * @throws when the file cannot be written; the service methods let
 *   that rejection bubble up to the error handler as a 500.
 */
function savePosts(): Promise<void> {
    const contents = JSON.stringify(posts, null, 4);

    // Chain this save after all previous ones. `.catch(() => {})`
    // keeps the QUEUE healthy if this save fails — the error still
    // reaches this save's own caller through `save`.
    const save = writeQueue.then(async () => {
        // Write-then-rename: readers only ever see the old or the new
        // file, never a partial one.
        await writeFile("data/posts.json.tmp", contents, "utf8");
        await rename("data/posts.json.tmp", "data/posts.json");
    });

    writeQueue = save.catch(() => { });

    return save;
}

export class PostService {

    /**
     * Loads and validates data/posts.json into memory. Must run once
     * BEFORE the server accepts requests — server.ts awaits it prior
     * to app.listen.
     *
     * Fail-fast by design: a malformed file, a non-post entry, or
     * duplicate IDs throws and startup aborts — better than silently
     * serving from an empty or half-valid store.
     *
     * @throws Error when the file is missing, is not an array of
     *   valid posts, or contains duplicate IDs.
     */
    static async initialize(): Promise<void> {
        // NOTE: this path is relative to the process's working
        // directory — run npm commands from the project root. (A more
        // robust version would resolve the path from this module's URL.)
        const contents = await readFile("data/posts.json", "utf8");
        // JSON.parse returns untrusted data — its type cannot be known
        // from the file alone, so treat it as `unknown` and validate.
        const data: unknown = JSON.parse(contents);

        // data.every(isPost): the type guard narrows every entry to
        // Post before anything is assigned to the store.
        if (!Array.isArray(data) || !data.every(isPost)) {
            throw new Error("Post data must be an array of valid posts.");
        }

        // A Set drops duplicate values — if it's smaller than the
        // array, some IDs were reused.
        const ids = new Set(data.map(post => post.id));

        if (ids.size !== data.length) {
            throw new Error("Post data contains duplicate IDs.");
        }

        posts = data;

        // Derive the next ID from the data instead of hardcoding it:
        // highest existing ID + 1, so new posts never collide.
        nextPostId =
            posts.reduce((highestId, post) => {
                return Math.max(highestId, post.id);
            }, 0) + 1;
    }

    /**
     * Returns all posts.
     *
     * Async because the store is loaded from disk at startup (and may
     * become a real database later): callers are already written for
     * I/O-shaped signatures. Reads themselves stay synchronous — the
     * data lives in memory after initialize().
     */
    async getAllPosts(): Promise<Post[]> {
        return posts;
    }

    /** Finds a post by ID, or returns undefined if it doesn't exist. */
    getPostById(id: number): Post | undefined {
        return posts.find(post => post.id === id);
    }

    /**
     * Creates a post from already-validated input, stamps the next ID
     * and persists the store to disk.
     *
     * NOTE: memory is mutated before the save — if savePosts() rejects,
     * memory and file can diverge while the request still fails with a
     * 500. Real databases solve this with transactions; a fine future
     * exercise would be rolling back the push on save failure.
     * @throws when persisting to disk fails.
     */
    async createPost(input: CreatePostInput): Promise<Post> {
        const newPost: Post = {
            ...input,
            id: nextPostId++,
        };
        posts.push(newPost);
        await savePosts();
        return newPost;
    }

    /**
     * Partially updates a post in place — fields left undefined keep
     * their current value. Persists the change to disk before returning.
     * @returns the updated Post, or undefined if the ID doesn't exist.
     * @throws when persisting to disk fails.
     */
    async updatePost(id: number, input: UpdatePostInput): Promise<Post | undefined> {
        const post = this.getPostById(id);

        if (!post) {
            return undefined;
        }

        if (input.title !== undefined) {
            post.title = input.title;
        }
        if (input.image !== undefined) {
            post.image = input.image;
        }
        if (input.content !== undefined) {
            post.content = input.content;
        }

        await savePosts();
        return post;
    }

    /**
     * Deletes a post. Persists the change to disk before returning.
     * @returns true if a post was removed, false if the ID wasn't found.
     * @throws when persisting to disk fails.
     */
    async deletePost(id: number): Promise<boolean> {
        const index = posts.findIndex(post => post.id === id);

        if (index === -1) {
            return false;
        }

        posts.splice(index, 1);
        await savePosts();
        return true;
    }
}
