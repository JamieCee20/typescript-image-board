import type { CreatePostInput, Post, UpdatePostInput } from "../types/Post.js";
import type { PostRepository } from "../repositories/PostRepository.js";

/**
 * Business logic for posts, with state held per-instance (no more
 * module globals): every PostService owns its own store and ID
 * counter, and receives its storage via constructor injection — so a
 * test could construct one with an in-memory repository and never
 * touch disk. The application's single shared instance is wired up in
 * src/container.ts.
 */
export class PostService {
    /** The in-memory store, seeded by initialize() and re-persisted by
     * savePosts() after every mutation. */
    private posts: Post[] = [];

    /** ID for the next post created — re-derived from the loaded data
     * (highest existing ID + 1), then incremented so IDs are never reused. */
    private nextPostId = 1;

    /** Storage backend — the PostRepository CONTRACT, injected rather
     * than constructed here (dependency inversion). `readonly` = set
     * once by the constructor, never reassigned. */
    private readonly repository: PostRepository;
    constructor(repository: PostRepository) {
        this.repository = repository;
    }

    /**
     * Persists the in-memory store through the injected repository.
     * @throws when persistence fails; callers let the rejection bubble
     *   up to the error handler as a 500.
     */
    private savePosts(): Promise<void> {
        return this.repository.save(this.posts);
    }

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
    async initialize(): Promise<void> {
        this.posts = await this.repository.load();

        // Derive the next ID from the loaded data instead of
        // hardcoding it: highest existing ID + 1, so new posts never
        // collide with anything already stored.
        this.nextPostId =
            this.posts.reduce((highestId, post) => {
                return Math.max(highestId, post.id);
            }, 0) + 1;
    }

    /**
     * Returns all posts.
     *
     * Async-shaped for the same reason as the mutations: callers are
     * written against I/O signatures, so swapping in a real database
     * requires no changes here. Reads stay in memory — Promise.resolve
     * just satisfies the declared contract.
     *
     * NOTE: this hands out the live internal array. Fine while the
     * service is the only writer; a hardened version would return a
     * copy so callers can't mutate the store from outside.
     */
    getAllPosts(): Promise<Post[]> {
        return Promise.resolve(this.posts);
    }

    /** Finds a post by ID, or returns undefined if it doesn't exist. */
    getPostById(id: number): Post | undefined {
        return this.posts.find(post => post.id === id);
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
            id: this.nextPostId++,
        };
        this.posts.push(newPost);
        await this.savePosts();
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

        await this.savePosts();
        return post;
    }

    /**
     * Deletes a post. Persists the change to disk before returning.
     * @returns true if a post was removed, false if the ID wasn't found.
     * @throws when persisting to disk fails.
     */
    async deletePost(id: number): Promise<boolean> {
        const index = this.posts.findIndex(post => post.id === id);

        if (index === -1) {
            return false;
        }

        this.posts.splice(index, 1);
        await this.savePosts();
        return true;
    }
}
