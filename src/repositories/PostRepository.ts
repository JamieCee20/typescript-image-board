import type { Post } from "../types/Post.js";

/**
 * The storage contract for posts (the Repository pattern).
 *
 * PostService depends on THIS interface, not on any concrete class —
 * so the storage backend can be swapped (JSON file today, SQLite or
 * Postgres tomorrow, an in-memory fake for tests) without touching
 * service, controller, or route code.
 *
 * Implementations must guarantee:
 *  - load(): resolve with validated posts, or reject if the source is
 *    unusable (missing, malformed, duplicate IDs).
 *  - save(): durably persist the given array before resolving.
 */
export interface PostRepository {
    load(): Promise<Post[]>;
    save(posts: readonly Post[]): Promise<void>;
}
