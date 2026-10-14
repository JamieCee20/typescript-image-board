import type { CreatePostInput, Post } from "../types/Post.js";

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

let nextPostId = 3;

export class PostService {
    getAllPosts(): Post[] {
        return posts;
    }

    getPostById(id: number): Post | undefined {
        return posts.find(post => post.id === id);
    }

    createPost(input: CreatePostInput): Post {
        const newPost: Post = {
            ...input,
            id: nextPostId++,
        };
        posts.push(newPost);
        return newPost;
    }
}