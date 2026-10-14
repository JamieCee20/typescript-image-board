import type { CreatePostInput, Post, UpdatePostInput } from "../types/Post.js";
import type { PostRepository } from "../repositories/PostRepository.js";
import { FilePostRepository } from "../repositories/FilePostRepository.js";

/**
 * The storage backend, typed as the PostRepository INTERFACE — not the
 * concrete class. This is dependency inversion: the service never knows
 * a file is involved, and swapping to a database (or an in-memory fake
 * in tests) is a one-line change here.
 */
const postRepository: PostRepository =
    new FilePostRepository("data/posts.json");

// The "database": an in-memory array seeded by postRepository.load()
// at startup (see initialize) and persisted via postRepository.save()
// after every mutation (see savePosts) — so changes SURVIVE restarts.
// All disk I/O lives in the repository; this class keeps memory + rules.
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
 * Persists the in-memory store through the repository.
 *
 * The HOW (atomic temp-file write, write queue) lives in
 * FilePostRepository — this is just the bridge from the service's
 * memory to whatever storage backend is configured.
 *
 * @throws when persistence fails; the service methods let that
 *   rejection bubble up to the error handler as a 500.
 */
function savePosts(): Promise<void> {
    return postRepository.save(posts);
}

export class PostService {

    /**
     * Loads the store from the repository into memory. Must run once
     * BEFORE the server accepts requests — server.ts awaits it prior
     * to app.listen.
     *
     * Fail-fast by design: FilePostRepository.load() rejects on a
     * missing/malformed file or duplicate IDs, which aborts startup —
     * better than silently serving from an empty or half-valid store.
     *
     * @throws when the repository cannot produce valid data.
     */
    static async initialize(): Promise<void> {
        posts = await postRepository.load();

        // Derive the next ID from the loaded data instead of
        // hardcoding it: highest existing ID + 1, so new posts never
        // collide with anything already stored.
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
