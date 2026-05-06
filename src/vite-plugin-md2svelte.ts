import { uneval } from "devalue";
import matter from "gray-matter";
import type { Element, Root, Text } from "hast";
import { h } from "hastscript";
import rehypeRaw from "rehype-raw";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import type { PluggableList } from "unified";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import type { Plugin } from "vite";
import type { ZodType } from "zod";
import { z } from "zod";
import { rehypeSveltify } from "./rehype-sveltify";

export interface Md2svelteOptions {
  components?: Record<string, string>;
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  frontmatterSchema?: ZodType<unknown>;
}

export function md2svelte(options: Md2svelteOptions = {}): Plugin {
  const {
    components = {},
    remarkPlugins = [],
    rehypePlugins = [],
    frontmatterSchema: schema,
  } = options;
  return {
    name: "vite-plugin-md2svelte",
    async transform(code: string, id: string) {
      if (!id.endsWith(".md")) return;

      const { content, data: frontmatter } = matter(code);
      const validatedFrontmatter = schema
        ? validateFrontmatter(frontmatter, schema, id)
        : frontmatter;

      const file = await unified()
        .use(remarkParse)
        .use(remarkPlugins)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypePlugins)
        .use(rehypeRaw)
        .use(exportMeta, validatedFrontmatter)
        .use(importImage)
        .use(customComponents, components)
        .use(rehypeSveltify)
        .process(content);
      return {
        code: String(file).trim(),
        map: null,
      };
    },
  };
}

function validateFrontmatter(frontmatter: unknown, schema: ZodType, id: string) {
  const result = schema.safeParse(frontmatter, { reportInput: true });
  if (!result.success) {
    throw new Error(`Frontmatter validation failed in ${id}\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

function getScriptNode(tree: Root): Element {
  let scriptNode: Element | undefined;
  visit(
    tree,
    {
      type: "element",
      tagName: "script",
    },
    (node) => {
      if (node.properties.lang === "ts" && node.properties.context === "module") {
        scriptNode = node;
      }
    },
  );
  if (scriptNode) {
    return scriptNode;
  } else {
    const newScriptNode = h("script", { lang: "ts", context: "module" });
    tree.children.unshift(newScriptNode);
    return newScriptNode;
  }
}

function exportMeta(frontmatter: any) {
  return (tree: Root) => {
    const scriptNode = getScriptNode(tree);
    scriptNode.children.push({
      type: "text",
      value: `export const meta = ${uneval(frontmatter)};`,
    });
  };
}

function importImage() {
  return (tree: any) => {
    const scriptNode = getScriptNode(tree);
    const imagePaths: string[] = [];
    visit(
      tree,
      {
        type: "element",
        tagName: "img",
      },
      (node) => {
        try {
          const url = new URL(node.properties.src);
          const isRemoteSource = url.protocol === "http:" || url.protocol === "https:";
          if (isRemoteSource) {
            return;
          }
        } catch {}

        imagePaths.push(node.properties.src);
        delete node.properties.src;
        node.properties["raw:src"] = `{image${imagePaths.length}}`;
      },
    );

    scriptNode.children.push({
      type: "text",
      value: imagePaths.map((filePath, i) => `\nimport image${i + 1} from "${filePath}";`).join(""),
    } satisfies Text);
  };
}

function customComponents(_components: Record<string, string>) {
  const components = Object.fromEntries(
    Object.entries(_components).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return (tree: Root) => {
    const usedComponents = new Set<string>();

    visit(tree, { type: "element" }, (node) => {
      const elementNode = node as Element;
      const importPath = components[elementNode.tagName.toLowerCase()];
      if (importPath) {
        usedComponents.add(elementNode.tagName);
        elementNode.tagName = `Custom${capitalize(elementNode.tagName)}`;
      }
    });

    if (usedComponents.size === 0) return;

    const scriptNode = getScriptNode(tree);

    const imports: string[] = [];
    usedComponents.forEach((tagName) => {
      const path = components[tagName];
      imports.push(`\nimport Custom${capitalize(tagName)} from "${path}";`);
    });
    scriptNode.children.push({ type: "text", value: imports.join("") });
  };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
