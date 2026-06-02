# vite-plugin-md2svelte

A Vite plugin that converts Markdown files to Svelte components with frontmatter support, custom components, and plugin extensibility.

## Features

- 📝 Markdown to Svelte: Import `.md` files as Svelte components directly in your code
- 📋 Frontmatter Support: Access YAML frontmatter metadata via module export
- 🖼️ Image Handling: Automatic image imports for relative image references
- 🎨 Custom Components: Replace Markdown elements with custom Svelte components
- 🔌 Plugin Extensibility: Add custom remark/rehype plugins for advanced processing
- ⚡ Vite Integration: Seamless integration with Vite's build system
- 🔒 TypeScript Support: Full TypeScript type inference from source

## Installation

```bash
npm install vite-plugin-md2svelte
# or
pnpm add vite-plugin-md2svelte
# or
bun add vite-plugin-md2svelte
```

## Usage

### Basic Setup

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { md2svelte } from "vite-plugin-md2svelte";

export default defineConfig({
  plugins: [md2svelte(), svelte()],
});
```

### Import Markdown as Svelte Component

Create a Markdown file with frontmatter:

```markdown
---
title: My First Post
date: 2025-05-04
tags: [vite, svelte, markdown]
---

# Hello, World!

This is markdown converted to a Svelte component.
```

Import and use it in your Svelte component:

```svelte
<script lang="ts">
  import Post, { meta } from './posts/hello-world.md'
</script>

<Post />

<h2>Frontmatter:</h2>
<pre>{JSON.stringify(meta, null, 2)}</pre>
```

### Import Multiple Markdown as Svelte Components

Load all markdown files and render them dynamically:

```svelte
<script lang="ts">
  const modules = import.meta.glob('./posts/*.md', {
    eager: true
  })

  const posts = Object.values(modules)
</script>

{#each posts as post}
  <article>
    <h2>{post.meta.title}</h2>

    <post.default />
  </article>
{/each}
```

## Advanced Configuration

### Custom Components

Replace Markdown elements with custom Svelte components:

```typescript
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { md2svelte } from "vite-plugin-md2svelte";
import CustomBlockquote from "./src/components/CustomBlockquote.svelte";

export default defineConfig({
  plugins: [
    md2svelte({
      customComponents: {
        blockquote: "$lib/components/CustomBlockquote.svelte",
      },
    }),
    svelte(),
  ],
});
```

### Custom Remark/Rehype Plugins

Extend functionality with custom plugins:

```typescript
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { md2svelte } from "vite-plugin-md2svelte";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

export default defineConfig({
  plugins: [
    svelte(),
    md2svelte({
      remarkPlugins: [remarkBreaks, remarkGfm],
      rehypePlugins: [rehypeSlug],
    }),
  ],
});
```

### Frontmatter Validation with Zod

Validate frontmatter using Zod schemas:

```typescript
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { md2svelte } from "vite-plugin-md2svelte";
import { z } from "zod";

const postSchema = z.object({
  title: z.string(),
  date: z.string().transform((val) => new Date(val)),
  tags: z.array(z.string()).optional(),
  published: z.boolean().default(true),
});

export default defineConfig({
  plugins: [
    svelte(),
    md2svelte({
      frontmatterSchema: postSchema,
    }),
  ],
});
```

When a Markdown file has invalid frontmatter, the build will fail with a detailed error message:

```markdown
---
title: My Post
date: 2025-05-04
tags: "not-an-array"  // ❌ This will cause a validation error
---

# Content here
```

## Md2svelteOptions

Configuration options for the md2svelte plugin.

```typescript
interface Md2svelteOptions {
  /** Zod schema for validating frontmatter */
  frontmatterSchema?: ZodType;

  /** Custom remark plugins for markdown processing */
  remarkPlugins?: PluggableList;

  /** Custom rehype plugins for HTML transformation */
  rehypePlugins?: PluggableList;

  /** Map of element names to custom component paths */
  customComponents?: Record<string, string>;
}
```
