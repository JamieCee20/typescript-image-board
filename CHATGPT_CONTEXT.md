# Context for ChatGPT: My TypeScript Learning Project

I'm learning TypeScript by building a small "image board" (like a minimal forum where users post images with titles and content). Below is the complete current state of the project. Please use this as context when answering my questions — assume this codebase unless I say otherwise.

## What the project is

An Express.js REST API written in TypeScript. It's intentionally small and hand-rolled (no framework abstractions beyond Express) so I can learn TypeScript fundamentals. It runs with Node.js.

## Tech stack & tooling

- **TypeScript** v7 (the new native compiler) with `"strict": true`
- **Express** v5 (the current major version)
- **tsx** for dev — `npm run dev` runs `tsx watch src/server.ts` (auto-restart on save)
- **Module setup:** `"module": "NodeNext"` + `"type": "commonjs"` in package.json — that's why my local imports use `.js` extensions (e.g. `./app.js`) even though the source files are `.ts`
- No database yet — data is a hardcoded in-memory array
- No tests, no linting yet

## Project structure

```
typescript-image-board/
├── package.json
├── tsconfig.json
└── src/
    ├── server.ts        # Entry point: starts the HTTP server
    ├── app.ts           # Creates & configures the Express app
    ├── controllers/
    │   └── PostController.ts
    └── services/
        └── PostService.ts
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

## Source code (complete)

### src/app.ts

```ts
import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello from TypeScript!");
});

export default app;
```

### src/server.ts

```ts
import app from "./app.js";

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
```

### src/controllers/PostController.ts

```ts
import type { Request, Response } from "express";
import { PostService } from "../services/PostService.js";

const postService = new PostService();

export class PostController {
    static getAllPosts(req: Request, res: Response) {
        const posts = postService.getAllPosts();
        res.json(posts);
    }

    static getPostById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const post = postService.getPostById(id);
        if (post) {
            res.json(post);
        } else {
            res.status(404).send("Post not found");
        }
    }
}
```

### src/services/PostService.ts

```ts
const posts = [
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

export class PostService {
    getAllPosts() {
        return posts;
    }

    getPostById(id: number) {
        return posts.find(post => post.id === id);
    }
}
```

## Current state (important!)

- Only one route is actually mounted: `GET /` returning "Hello from TypeScript!".
- **`PostController` is written but NOT wired into the Express app yet** — there are no routes for `/posts`. Wiring it up is the natural next step.
- The controller follows a layered pattern: route → controller → service → data. The service holds the in-memory `posts` array and the lookup logic.
- There's no create/update/delete endpoint yet, no request validation, and no `Post` type/interface — the post objects are currently inferred from the array literal.

## What I'm trying to learn

TypeScript fundamentals in a real backend context: typing function parameters and returns, `interface`/`type` definitions, `import type`, classes and static methods, working with `strict` mode, how ES module syntax maps to Node's module systems, and typing Express `Request`/`Response` (and later, typed request params/bodies).

## How I'd like you to help

- Explain TypeScript concepts using THIS code as the example whenever possible.
- When suggesting changes, show small diffs against my actual files rather than rewrites from scratch.
- If I ask "how do I add X", prefer the idiomatic modern TypeScript way (and mention why).
