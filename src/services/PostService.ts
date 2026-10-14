import type { CreatePostInput, Post, UpdatePostInput } from "../types/Post.js";
import { readFile, writeFile, rename } from "node:fs/promises";
import { isPost } from "../validators/PostValidator.js";

// The "database": an in-memory array seeded from data/posts.json at
// startup (see initialize). API changes live only in memory — they are
// NOT written back to the file, so a restart resets to the file's
// contents. Swapping in a real database later means replacing the
// storage inside this class; every caller keeps the same signatures.
let posts: Post[] = [];

/** ID for the next post created — re-derived from the data at startup
 * (highest existing ID + 1), then incremented so IDs are never reused. */
let nextPostId = 1;

let writeQueue: Promise<void> = Promise.resolve();

function savePosts(): Promise<void> {
    const contents = JSON.stringify(posts, null, 2)
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

    /** Creates a post from already-validated input, stamping the next ID. */
    createPost(input: CreatePostInput): Post {
        const newPost: Post = {
            ...input,
            id: nextPostId++,
        };
        posts.push(newPost);
        return newPost;
    }

    /**
     * Partially updates a post in place — fields left undefined keep
     * their current value.
     * @returns the updated Post, or undefined if the ID doesn't exist.
     */
    updatePost(id: number, input: UpdatePostInput): Post | undefined {
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

        return post;
    }

    /**
     * Deletes a post.
     * @returns true if a post was removed, false if the ID wasn't found.
     */
    deletePost(id: number): boolean {
        const index = posts.findIndex(post => post.id === id);

        if (index === -1) {
            return false;
        }

        posts.splice(index, 1);

        return true;
    }
}