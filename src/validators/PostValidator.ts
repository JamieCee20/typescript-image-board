import type { CreatePostInput, UpdatePostInput } from '../types/Post.js'

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

export function isUpdatePostInput(
    value: unknown
): value is UpdatePostInput {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        ("title" in value ? typeof value.title === "string" : true) &&
        ("image" in value ? typeof value.image === "string" : true) &&
        ("content" in value ? typeof value.content === "string" : true)
    );
}