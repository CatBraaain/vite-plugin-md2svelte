# vite-plugin-md2svelte

A Vite plugin that converts Markdown files to Svelte components with frontmatter support, custom components, and plugin extensibility.

## Features

- 📝 Markdown to Svelte: Import `.md` files as Svelte components directly in your code
- 📋 Frontmatter Support: Access YAML frontmatter metadata as typed props
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
import md2svelte from "vite-plugin-md2svelte";

export default defineConfig({
  plugins: [svelte(), md2svelte()],
});
```

### Import Markdown as Svelte Components

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
  import Post from './posts/hello-world.md'
</script>

<Post />

<h2>Frontmatter:</h2>
<pre>{JSON.stringify($props.title)}</pre>
```

## Advanced Configuration

### Custom Components

Replace Markdown elements with custom Svelte components:

```typescript
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import md2svelte from "vite-plugin-md2svelte";
import CustomBlockquote from "./src/components/CustomBlockquote.svelte";

export default defineConfig({
  plugins: [
    svelte(),
    md2svelte({
      components: {
        // Replace blockquotes with custom component
        blockquote: "./src/components/CustomBlockquote.svelte",

        // Replace code blocks
        pre: "./src/components/CodeBlock.svelte",

        // Replace inline code
        code: "./src/components/InlineCode.svelte",
      },
    }),
  ],
});
```

### Custom Remark/Rehype Plugins

Extend functionality with custom plugins:

```typescript
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import md2svelte from "vite-plugin-md2svelte";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

export default defineConfig({
  plugins: [
    svelte(),
    md2svelte({
      plugins: {
        remark: [
          [remarkGfm, {}],
          // Add custom remark plugins
        ],
        rehype: [
          [rehypeSlug, {}],
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
          // Add custom rehype plugins
        ],
      },
    }),
  ],
});
```

## API Documentation

### Md2svelteOptions

```typescript
interface Md2svelteOptions {
  /** Map of element names to custom component paths */
  components?: Record<string, string>;

  /** Custom remark and rehype plugins */
  plugins?: {
    remark?: Array<[Plugin, any]>;
    rehype?: Array<[Plugin, any]>;
  };
}
```

### Components

The `components` option allows you to replace specific Markdown elements with custom Svelte components:

| Element                | Default Tag          | Description      |
| ---------------------- | -------------------- | ---------------- |
| `p`                    | `<p>`                | Paragraphs       |
| `blockquote`           | `<blockquote>`       | Block quotes     |
| `pre`                  | `<pre>`              | Code blocks      |
| `code`                 | `<code>`             | Inline code      |
| `h1`, `h2`, `h3`, etc. | `<h1>`, `<h2>`, etc. | Headings         |
| `ul`, `ol`             | `<ul>`, `<ol>`       | Lists            |
| `li`                   | `<li>`               | List items       |
| `a`                    | `<a>`                | Links            |
| `img`                  | `<img>`              | Images           |
| `strong`               | `<strong>`           | Bold text        |
| `em`                   | `<em>`               | Italic text      |
| `hr`                   | `<hr>`               | Horizontal rules |

### Custom Component Props

Custom components receive the original element's attributes as props:

```svelte
<!-- CodeBlock.svelte -->
<script lang="ts">
  export let className: string
  export let children: any
</script>

<pre class={className}>{@html children}</pre>
```

## How It Works

1. Parse: Uses `remark-parse` to convert Markdown to an Abstract Syntax Tree (AST)
2. Transform: Applies frontmatter extraction with `gray-matter`
3. Enhance: Applies custom remark/rehype plugins
4. Generate: Converts the AST to Svelte component syntax
5. Import: Vite processes the generated Svelte component as a module

The plugin generates TypeScript-compatible Svelte components with typed frontmatter props.

## License

MIT © 2025

## Requirements

- Node.js >= 18.0.0
- Vite >= 5.0.0
- TypeScript >= 5.0.0 (optional, for type inference)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please use the [GitHub Issues](https://github.com/yourusername/rehype-sveltify/issues) page.
