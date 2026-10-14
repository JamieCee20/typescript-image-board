import type { CreatePostInput, Post, UpdatePostInput } from "../types/Post.js";

// In-memory "database". Fine while learning — it's wiped on every restart.
const posts: Post[] = [
    {
        id: 1,
        title: "First Post",
        image: "https://example.com/first-post.jpg",
        content: "This is the content of the first post."
    },
    {
        id: 2,
        title: "Second Post",
        image: "https://example.com/second-post.jpg",
        content: "This is the content of the second post."
    }
];

/** ID for the next post created — incremented so IDs are never reused. */
let nextPostId = 3;

export class PostService {
    /** Returns all posts. */
    getAllPosts(): Post[] {
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