import { uneval } from "devalue";
import matter from "gray-matter";
import type { Element, Root, Text } from "hast";
import { h } from "hastscript";
import rehypeRaw from "rehype-raw";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import type { Plugin } from "vite";
import { rehypeSveltify } from "./rehype-sveltify";

export function md2svelte(): Plugin {
  return {
    name: "vite-plugin-md2svelte",
    async transform(code: string, id: string) {
      if (!id.endsWith(".md")) return;

      const { content, data: frontmatter } = matter(code);
      const file = await unified()
        .use(remarkParse)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(exportMeta, frontmatter)
        .use(importImage)
        // .use(importCustomComponent)
        .use(rehypeSveltify)
        .process(content);
      return {
        code: String(file).trim(),
        map: null,
      };
    },
  };
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

// function importCustomComponent() {
//   return (tree: any) => {
//     const scriptNode = getScriptNode(tree);
//     const customComponents: Set<string> = new Set();
//     visit(
//       tree,
//       {
//         type: "element",
//         tagName: "CodeBlock",
//       },
//       (node) => {
//         customComponents.add("CodeBlock");
//       },
//     );

//     if (customComponents.size > 0) {
//       scriptNode.children.push({
//         type: "text",
//         value: `import CodeBlock from "$lib/components/CodeBlock.svelte";`,
//       } satisfies Text);
//     }
//   };
// }
