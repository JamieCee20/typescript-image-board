/**
 * A post as it is stored and returned by the API.
 */
export interface Post {
    id: number;
    title: string;
    image: string;
    content: string;
}

/**
 * Body of POST /api/posts.
 *
 * `Omit` builds a new type from Post, dropping "id" — the server
 * assigns ids, so clients must not send one.
 */
export type CreatePostInput = Omit<Post, "id">;

/**
 * Body of PATCH /api/posts.
 *
 * `Partial` makes every field optional — that's what makes it a
 * "partial update". Note: fields may be *omitted*, but not null.
 */
export type UpdatePostInput = Partial<CreatePostInput>;
