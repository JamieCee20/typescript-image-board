export interface Post {
    id: number;
    title: string;
    image: string;
    content: string;
}

export type CreatePostInput = Omit<Post, "id">;