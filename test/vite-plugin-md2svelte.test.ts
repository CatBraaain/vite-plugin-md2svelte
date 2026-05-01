import { describe, expect, it } from "vitest";
import { md2svelte } from "../src/vite-plugin-md2svelte.js";

const plugin = md2svelte();
const transform = plugin.transform! as (
  code: string,
  id: string,
) => Promise<{
  code: string;
  map: null;
}>;
function createScriptNodeString(content?: { meta?: string; import?: string }) {
  return [
    '<script lang="ts" context="module">',
    `export const meta = ${content?.meta || "{}"};`,
    content?.import ? content?.import : "",
    "</script>",
  ]
    .filter(Boolean)
    .join("\n");
}

type TestCase = {
  input: string;
  output: string;
};

const fileFilteringTestCases: (TestCase & {
  id: string;
})[] = [
  {
    id: "test.md",
    input: "# Hello World",
    output: "<h1>Hello World</h1>",
  },
  {
    id: "test.svelte",
    input: "# Should not transform",
    output: "",
  },
  {
    id: "test.js",
    input: "const x = 1;",
    output: "",
  },
];

describe("File Filtering", () => {
  it.each(fileFilteringTestCases)("id: $id", async ({ input, id, output }) => {
    const result = await transform(input, id);
    if (id.endsWith(".md")) {
      expect(result.code).toBe(`${createScriptNodeString()}\n${output}`);
    } else {
      expect(result).toBeUndefined();
    }
  });
});

const basicMarkdownTestCases: TestCase[] = [
  {
    input: "Hello World",
    output: "<p>Hello World</p>",
  },
  {
    input: "# Heading",
    output: "<h1>Heading</h1>",
  },
  {
    input: ["# Heading", "", "This is a paragraph."].join("\n"),
    output: ["<h1>Heading</h1>", "<p>This is a paragraph.</p>"].join("\n"),
  },
  {
    input: "**bold text** and *italic text*",
    output: "<p><strong>bold text</strong> and <em>italic text</em></p>",
  },
  {
    input: "- Item 1\n- Item 2\n- Item 3",
    output: ["<ul>", "<li>Item 1</li>", "<li>Item 2</li>", "<li>Item 3</li>", "</ul>"].join("\n"),
  },
  {
    input: "1. First\n2. Second\n3. Third",
    output: ["<ol>", "<li>First</li>", "<li>Second</li>", "<li>Third</li>", "</ol>"].join("\n"),
  },
  {
    input: "[Link text](https://example.com)",
    output: '<p><a href="https://example.com">Link text</a></p>',
  },
  {
    input: "> Blockquote content",
    output: ["<blockquote>", "<p>Blockquote content</p>", "</blockquote>"].join("\n"),
  },
  {
    input: '```js\nconsole.log("test");\n```',
    output: ['<pre><code class="language-js">', 'console.log("test");', "</code></pre>"].join("\n"),
  },
];

describe("Basic Markdown Transformation", () => {
  it.each(basicMarkdownTestCases)("$input", async ({ input, output }) => {
    const result = await transform(input, "test.md");
    expect(result?.code).toBe(`${createScriptNodeString()}\n${output}`);
  });
});

const frontmatterTestCases = [
  {
    name: "simple key-value",
    input: ["---", "title: Test", "---"].join("\n"),
    output: '{title:"Test"}',
  },
  {
    name: "multiple keys",
    input: ["---", "title: Test", "date: 2024-01-01", "author: John", "---"].join("\n"),
    output: '{title:"Test",date:new Date(1704067200000),author:"John"}',
  },
  {
    name: "arrays",
    input: ["---", "tags: [js, ts, vite]", "---"].join("\n"),
    output: '{tags:["js","ts","vite"]}',
  },
  {
    name: "boolean values",
    input: ["---", "published: true", "draft: false", "---"].join("\n"),
    output: "{published:true,draft:false}",
  },
  {
    name: "number values",
    input: ["---", "order: 1", "priority: 10", "---"].join("\n"),
    output: "{order:1,priority:10}",
  },
  {
    name: "no frontmatter",
    input: ["---", "---"].join("\n"),
    output: "{}",
  },
];

describe("Frontmatter Processing", () => {
  it.each(frontmatterTestCases)("$name", async ({ input, output }) => {
    const result = await transform(input, "test.md");
    expect(result.code).toEqual(createScriptNodeString({ meta: output }));
  });
});

const imageHandlingTestCases = [
  {
    name: "single image",
    input: "![Alt text](./image.png)",
    output: [
      createScriptNodeString({ import: 'import image1 from "./image.png";' }),
      '<p><img alt="Alt text" src={image1} /></p>',
    ].join("\n"),
  },
  {
    name: "multiple images",
    input: ["![Img1](./img1.png)", "", "![Img2](./img2.png)"].join("\n"),
    output: [
      createScriptNodeString({
        import: ['import image1 from "./img1.png";', 'import image2 from "./img2.png";'].join("\n"),
      }),
      '<p><img alt="Img1" src={image1} /></p>',
      '<p><img alt="Img2" src={image2} /></p>',
    ].join("\n"),
  },
  {
    name: "relative path",
    input: "![Image](../assets/photo.jpg)",
    output: [
      createScriptNodeString({ import: 'import image1 from "../assets/photo.jpg";' }),
      '<p><img alt="Image" src={image1} /></p>',
    ].join("\n"),
  },
  {
    name: "absolute path",
    input: "![Image](/absolute/path/image.png)",
    output: [
      createScriptNodeString({ import: 'import image1 from "/absolute/path/image.png";' }),
      '<p><img alt="Image" src={image1} /></p>',
    ].join("\n"),
  },
  {
    name: "URL image",
    input: "![Remote](https://example.com/image.png)",
    output: [
      createScriptNodeString(),
      '<p><img src="https://example.com/image.png" alt="Remote" /></p>',
    ].join("\n"),
  },
  {
    name: "frontmatter and image",
    input: ["---", "title: Test", "---", "", "![Img](./img.png)"].join("\n"),
    output: [
      createScriptNodeString({ meta: '{title:"Test"}', import: 'import image1 from "./img.png";' }),
      '<p><img alt="Img" src={image1} /></p>',
    ].join("\n"),
  },
];

describe("Image Import Handling", () => {
  it.each(imageHandlingTestCases)("$name", async ({ input, output }) => {
    const result = await transform(input, "test.md");
    expect(result.code).toBe(output);
  });
});

const integrationTestCases = [
  {
    name: "complete blog post",
    input: [
      "---",
      "title: My First Post",
      "date: 2024-01-15",
      "tags: [vite, svelte, blog]",
      "---",
      "",
      "# Welcome",
      "",
      "This is my first blog post with an image:",
      "",
      "![Blog image](./hero.png)",
      "",
      "## Introduction",
      "",
      "Some **bold** and *italic* text.",
    ].join("\n"),
    output: [
      createScriptNodeString({
        meta: '{title:"My First Post",date:new Date(1705276800000),tags:["vite","svelte","blog"]}',
        import: 'import image1 from "./hero.png";',
      }),
      "<h1>Welcome</h1>",
      "<p>This is my first blog post with an image:</p>",
      '<p><img alt="Blog image" src={image1} /></p>',
      "<h2>Introduction</h2>",
      "<p>Some <strong>bold</strong> and <em>italic</em> text.</p>",
    ].join("\n"),
  },
  {
    name: "image gallery",
    input: [
      "---",
      "title: Photo Gallery",
      "---",
      "",
      "# Gallery",
      "",
      "![Photo 1](./photos/1.jpg)",
      "",
      "![Photo 2](./photos/2.jpg)",
      "",
      "![Photo 3](./photos/3.jpg)",
    ].join("\n"),
    output: [
      createScriptNodeString({
        meta: '{title:"Photo Gallery"}',
        import: [
          'import image1 from "./photos/1.jpg";',
          'import image2 from "./photos/2.jpg";',
          'import image3 from "./photos/3.jpg";',
        ].join("\n"),
      }),
      "<h1>Gallery</h1>",
      '<p><img alt="Photo 1" src={image1} /></p>',
      '<p><img alt="Photo 2" src={image2} /></p>',
      '<p><img alt="Photo 3" src={image3} /></p>',
    ].join("\n"),
  },
  {
    name: "complex nested structure",
    input: [
      "---",
      "meta:",
      "  level1:",
      "    level2:",
      "      value: deep",
      "---",
      "",
      "# Main",
      "",
      "## Section",
      "",
      "- Item 1",
      "- Item 2",
      "",
      "![Icon](./icon.svg)",
    ].join("\n"),
    output: [
      createScriptNodeString({
        meta: '{meta:{level1:{level2:{value:"deep"}}}}',
        import: 'import image1 from "./icon.svg";',
      }),
      "<h1>Main</h1>",
      "<h2>Section</h2>",
      "<ul>",
      "<li>Item 1</li>",
      "<li>Item 2</li>",
      "</ul>",
      '<p><img alt="Icon" src={image1} /></p>',
    ].join("\n"),
  },
  {
    name: "document with lists and code",
    input: [
      "---",
      "title: Code Examples",
      "---",
      "",
      "# Examples",
      "",
      "```js",
      "const x = 1;",
      "```",
      "",
      "- Step 1",
      "- Step 2",
    ].join("\n"),
    output: [
      createScriptNodeString({ meta: '{title:"Code Examples"}' }),
      "<h1>Examples</h1>",
      '<pre><code class="language-js">',
      "const x = 1;",
      "</code></pre>",
      "<ul>",
      "<li>Step 1</li>",
      "<li>Step 2</li>",
      "</ul>",
    ].join("\n"),
  },
  {
    name: "document with links and blockquotes",
    input: [
      "---",
      "title: Linked Content",
      "---",
      "",
      "# Resources",
      "",
      "> Important note",
      "",
      "[Visit docs](https://example.com)",
    ].join("\n"),
    output: [
      createScriptNodeString({ meta: '{title:"Linked Content"}' }),
      "<h1>Resources</h1>",
      "<blockquote>",
      "<p>Important note</p>",
      "</blockquote>",
      '<p><a href="https://example.com">Visit docs</a></p>',
    ].join("\n"),
  },
];

describe("End-to-End Integration", () => {
  it.each(integrationTestCases)("$name", async ({ input, output }) => {
    const result = await transform(input, "test.md");
    expect(result.code).toBe(output);
  });
});
