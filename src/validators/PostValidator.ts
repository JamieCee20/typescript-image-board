import type { CreatePostInput } from '../types/Post.js'

export function isCreatePostInput(
    value: unknown
): value is CreatePostInput {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        "title" in value &&
        typeof value.title === "string" &&
        "image" in value &&
        typeof value.image === "string" &&
        "content" in value &&
        typeof value.content === "string"
    );
}