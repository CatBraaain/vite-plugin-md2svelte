import { visit } from "unist-util-visit";
import { z } from "zod";

import type { Md2svelteOptions } from "../src/vite-plugin-md2svelte";

type TestCaseGroup = {
  groupName: string;
  testCases: TestCase[];
};

type TestCase = {
  name: string;
  fileName?: string;
  input: string;
  output: Output | null | Error;
  options?: Md2svelteOptions;
};

export type Output = {
  meta?: string;
  import?: string;
  content?: string;
};

const attributeTestCases: TestCase[] = [
  {
    name: "raw attribute with variable 1",
    input: "<div raw:key={variableName}></div>",
    output: { content: "<div key={variableName}></div>" },
  },
  {
    name: "raw attribute with variable 2",
    input: '<div raw:key="{variableName}"></div>',
    output: { content: "<div key={variableName}></div>" },
  },
  {
    name: "raw attribute with expression",
    input: '<div raw:key="{1 + 1}"></div>',
    output: { content: "<div key={1 + 1}></div>" },
  },
  {
    name: "boolean true",
    input: "<div hidden></div>",
    output: { content: "<div hidden></div>" },
  },
  {
    name: "string value",
    input: '<div key="normal string"></div>',
    output: { content: '<div key="normal string"></div>' },
  },
  {
    name: "number value",
    input: "<div key=1></div>",
    output: { content: '<div key="1"></div>' },
  },
  {
    name: "escape quotes",
    input: "<div key='\"need escape\"'></div>",
    output: { content: '<div key="&quot;need escape&quot;"></div>' },
  },
  {
    name: "escape ampersand",
    input: '<div key="&need escape"></div>',
    output: { content: '<div key="&amp;need escape"></div>' },
  },
  {
    name: "escape brace",
    input: '<div key="{need escape}"></div>',
    output: { content: '<div key="&#x7B;need escape&#x7D;"></div>' },
  },
];

const textTestCases: TestCase[] = [
  {
    name: "not escape in script tag",
    input: '<script>const x = { y: "1" }; const a = b && c;</script>',
    output: { content: '<script>\nconst x = { y: "1" }; const a = b && c;\n</script>' },
  },
  {
    name: "not escape in style tag",
    input: "<style>body {color: red;}</style>",
    output: { content: "<style>body {color: red;}</style>" },
  },
  {
    name: "escape braces",
    input: "<div>Hello {world}</div>",
    output: { content: "<div>Hello &#x7B;world&#x7D;</div>" },
  },
  {
    name: "escape ampersand",
    input: "<div>a&b</div>",
    output: { content: "<div>a&b</div>" },
  },
  {
    name: "escape less than",
    input: "<div>1 < 2</div>",
    output: { content: "<div>1 &lt; 2</div>" },
  },
];

const elementTestCases: TestCase[] = [
  {
    name: "open close",
    input: "<div></div>",
    output: { content: "<div></div>" },
  },
  {
    name: "self close",
    input: "<br />",
    output: { content: "<br />" },
  },
  {
    name: "attribute",
    input: '<div class="foo 1 bar"></div>',
    output: { content: '<div class="foo 1 bar"></div>' },
  },
  {
    name: "text child",
    input: "<p>Hello</p>",
    output: { content: "<p>Hello</p>" },
  },
  {
    name: "nested element",
    input: "<p><span>nested</span></p>",
    output: { content: "<p><span>nested</span></p>" },
  },
  {
    name: "text child with nested element",
    input: "<div>Before <strong>bold</strong> after</div>",
    output: { content: "<div>Before <strong>bold</strong> after</div>" },
  },
  {
    name: "deep nested",
    input: "<div>Text <strong>nested <em>deep</em></strong></div>",
    output: { content: "<div>Text <strong>nested <em>deep</em></strong></div>" },
  },
];

const fileNameTestCases: TestCase[] = [
  {
    name: "md file",
    fileName: "test.md",
    input: "# Hello World",
    output: { content: "<h1>Hello World</h1>" },
  },
  {
    name: "svelte file",
    fileName: "test.svelte",
    input: "# Should not transform",
    output: null,
  },
  {
    name: "js file",
    fileName: "test.js",
    input: "const x = 1;",
    output: null,
  },
];

const markdownTestCases: TestCase[] = [
  {
    name: "paragraph",
    input: "Hello World",
    output: { content: "<p>Hello World</p>" },
  },
  {
    name: "heading",
    input: "# Heading",
    output: { content: "<h1>Heading</h1>" },
  },
  {
    name: "bold and italic",
    input: "**bold text** and *italic text*",
    output: { content: "<p><strong>bold text</strong> and <em>italic text</em></p>" },
  },
  {
    name: "unordered list",
    input: "- Item 1\n- Item 2\n- Item 3",
    output: {
      content: ["<ul>", "<li>Item 1</li>", "<li>Item 2</li>", "<li>Item 3</li>", "</ul>"].join(
        "\n",
      ),
    },
  },
  {
    name: "ordered list",
    input: "1. First\n2. Second\n3. Third",
    output: {
      content: ["<ol>", "<li>First</li>", "<li>Second</li>", "<li>Third</li>", "</ol>"].join("\n"),
    },
  },
  {
    name: "link",
    input: "[Link text](https://example.com)",
    output: { content: '<p><a href="https://example.com">Link text</a></p>' },
  },
  {
    name: "blockquote",
    input: "> Blockquote content",
    output: { content: ["<blockquote>", "<p>Blockquote content</p>", "</blockquote>"].join("\n") },
  },
  {
    name: "code block",
    input: '```js\nconsole.log("test");\n```',
    output: {
      content: ['<pre><code class="language-js">', 'console.log("test");', "</code></pre>"].join(
        "\n",
      ),
    },
  },
];

const frontmatterTestCases: TestCase[] = [
  {
    name: "single",
    input: ["---", "title: Test", "---"].join("\n"),
    output: { meta: '{title:"Test"}' },
  },
  {
    name: "multiple",
    input: ["---", "title: Test", "date: 2024-01-01", "author: John", "---"].join("\n"),
    output: { meta: '{title:"Test",date:new Date(1704067200000),author:"John"}' },
  },
  {
    name: "array",
    input: ["---", "tags: [js, ts, vite]", "---"].join("\n"),
    output: { meta: '{tags:["js","ts","vite"]}' },
  },
  {
    name: "boolean",
    input: ["---", "published: true", "draft: false", "---"].join("\n"),
    output: { meta: "{published:true,draft:false}" },
  },
  {
    name: "number",
    input: ["---", "order: 1", "priority: 10", "---"].join("\n"),
    output: { meta: "{order:1,priority:10}" },
  },
  {
    name: "empty",
    input: ["---", "---"].join("\n"),
    output: { meta: "{}" },
  },

  {
    name: "nested",
    input: ["---", "meta:", "  level1:", "    level2:", "      value: deep", "---"].join("\n"),
    output: {
      meta: '{meta:{level1:{level2:{value:"deep"}}}}',
    },
  },
];

const imageTestCases: TestCase[] = [
  {
    name: "single",
    input: "![Alt text](./image.png)",
    output: {
      import: 'import image1 from "./image.png";',
      content: '<p><img alt="Alt text" src={image1} /></p>',
    },
  },
  {
    name: "multiple",
    input: ["![Img1](./img1.png)", "", "![Img2](./img2.png)"].join("\n"),
    output: {
      import: ['import image1 from "./img1.png";', 'import image2 from "./img2.png";'].join("\n"),
      content: [
        '<p><img alt="Img1" src={image1} /></p>',
        '<p><img alt="Img2" src={image2} /></p>',
      ].join("\n"),
    },
  },
  {
    name: "relative path",
    input: "![Image](../assets/photo.jpg)",
    output: {
      import: 'import image1 from "../assets/photo.jpg";',
      content: '<p><img alt="Image" src={image1} /></p>',
    },
  },
  {
    name: "absolute path",
    input: "![Image](/absolute/path/image.png)",
    output: {
      import: 'import image1 from "/absolute/path/image.png";',
      content: '<p><img alt="Image" src={image1} /></p>',
    },
  },
  {
    name: "URL",
    input: "![Remote](https://example.com/image.png)",
    output: { content: '<p><img src="https://example.com/image.png" alt="Remote" /></p>' },
  },
];

const integrationTestCases: TestCase[] = [
  {
    name: "simple document",
    input: [
      "# Main Title",
      "",
      "## Subsection",
      "",
      "This is **bold** and *italic* text.",
      "",
      "- Item 1",
      "- Item 2",
      "  - Nested item",
      "",
      "[Link text](https://example.com)",
    ].join("\n"),
    output: {
      content: [
        "<h1>Main Title</h1>",
        "<h2>Subsection</h2>",
        "<p>This is <strong>bold</strong> and <em>italic</em> text.</p>",
        "<ul>",
        "<li>Item 1</li>",
        "<li>Item 2",
        "<ul>",
        "<li>Nested item</li>",
        "</ul>",
        "</li>",
        "</ul>",
        '<p><a href="https://example.com">Link text</a></p>',
      ].join("\n"),
    },
  },
  {
    name: "blog post",
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
    output: {
      meta: '{title:"My First Post",date:new Date(1705276800000),tags:["vite","svelte","blog"]}',
      import: 'import image1 from "./hero.png";',
      content: [
        "<h1>Welcome</h1>",
        "<p>This is my first blog post with an image:</p>",
        '<p><img alt="Blog image" src={image1} /></p>',
        "<h2>Introduction</h2>",
        "<p>Some <strong>bold</strong> and <em>italic</em> text.</p>",
      ].join("\n"),
    },
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
    output: {
      meta: '{title:"Photo Gallery"}',
      import: [
        'import image1 from "./photos/1.jpg";',
        'import image2 from "./photos/2.jpg";',
        'import image3 from "./photos/3.jpg";',
      ].join("\n"),
      content: [
        "<h1>Gallery</h1>",
        '<p><img alt="Photo 1" src={image1} /></p>',
        '<p><img alt="Photo 2" src={image2} /></p>',
        '<p><img alt="Photo 3" src={image3} /></p>',
      ].join("\n"),
    },
  },
];

const customComponentTestCases: TestCase[] = [
  {
    name: "single",
    input: "```js\nconst x = 1;\n```",
    output: {
      import: 'import CustomCode from "@/components/Code.svelte";',
      content: '<pre><CustomCode class="language-js">const x = 1;\n</CustomCode></pre>',
    },
    options: { components: { code: "@/components/Code.svelte" } },
  },
  {
    name: "multiple",
    input: "[Link](https://example.com)\n\n```js\nconst x = 1;\n```",
    output: {
      import:
        'import CustomA from "@/components/Link.svelte";\nimport CustomCode from "@/components/Code.svelte";',
      content: [
        '<p><CustomA href="https://example.com">Link</CustomA></p>',
        '<pre><CustomCode class="language-js">const x = 1;\n</CustomCode></pre>',
      ].join("\n"),
    },
    options: {
      components: {
        a: "@/components/Link.svelte",
        code: "@/components/Code.svelte",
      },
    },
  },
  {
    name: "no mapping",
    input: "Test",
    output: { content: "<p>Test</p>" },
    options: { components: { a: "@/components/Link.svelte" } },
  },
  {
    name: "no options",
    input: "Test",
    output: { content: "<p>Test</p>" },
    options: {},
  },
];

const pluginTestCases: TestCase[] = [
  {
    name: "remark plugin",
    input: "Hello World",
    output: { content: "<p>Hi World</p>" },
    options: {
      remarkPlugins: [
        () => (tree: any) => {
          visit(tree, "paragraph", (node: any) => {
            node.children[0].value = node.children[0].value.replace("Hello", "Hi");
          });
        },
      ],
    },
  },
  {
    name: "rehype plugin",
    input: "# Heading",
    output: { content: '<h1 class="custom-heading">Heading</h1>' },
    options: {
      rehypePlugins: [
        () => (tree: any) => {
          visit(tree, { type: "element", tagName: "h1" }, (node: any) => {
            node.properties = { class: "custom-heading" };
          });
        },
      ],
    },
  },
];

const zodSchemaTestCases: TestCase[] = [
  {
    name: "valid schema",
    input: [
      "---",
      "title: Test Post",
      "date: 2024-01-15",
      "tags: [vite, svelte]",
      "---",
      "",
      "# Content",
    ].join("\n"),
    output: {
      meta: '{title:"Test Post",date:new Date(1705276800000),tags:["vite","svelte"]}',
      content: "<h1>Content</h1>",
    },
    options: {
      frontmatterSchema: z.object({
        title: z.string(),
        date: z.coerce.date(),
        tags: z.array(z.string()),
      }),
    },
  },
  {
    name: "invalid field",
    input: ["---", "title: Test Post", "invalidField: value", "---", "", "# Content"].join("\n"),
    output: new Error(
      [
        "Frontmatter validation failed in test.md",
        "✖ Invalid input: expected date, received Date",
        "  → at date",
      ].join("\n"),
    ),
    options: {
      frontmatterSchema: z.object({
        title: z.string(),
        date: z.coerce.date(),
      }),
    },
  },
  {
    name: "invalid date",
    input: ["---", "title: Test", "date: invalid-date", "---", "", "# Content"].join("\n"),
    output: new Error(
      [
        "Frontmatter validation failed in test.md",
        "✖ Invalid input: expected date, received Date",
        "  → at date",
        "✖ Invalid input: expected array, received undefined",
        "  → at tags",
      ].join("\n"),
    ),
    options: {
      frontmatterSchema: z.object({
        title: z.string(),
        date: z.coerce.date(),
        tags: z.array(z.string()),
      }),
    },
  },
  {
    name: "no schema",
    input: ["---", "title: Test Post", "date: 2024-01-15", "---", "", "# Content"].join("\n"),
    output: {
      meta: '{title:"Test Post",date:new Date(1705276800000)}',
      content: "<h1>Content</h1>",
    },
    options: {},
  },
  {
    name: "nested objects",
    input: [
      "---",
      "title: Nested Test",
      "meta:",
      "  author: John Doe",
      "  category: Testing",
      "---",
      "",
      "# Content",
    ].join("\n"),
    output: {
      meta: '{title:"Nested Test",meta:{author:"John Doe",category:"Testing"}}',
      content: "<h1>Content</h1>",
    },
    options: {
      frontmatterSchema: z.object({
        title: z.string(),
        meta: z.object({
          author: z.string(),
          category: z.string(),
        }),
      }),
    },
  },
  {
    name: "complex transformations",
    input: [
      "---",
      "title: Complex Test",
      "description: This is a description",
      "count: 42",
      "---",
      "",
      "# Content",
    ].join("\n"),
    output: {
      meta: '{title:"Complex Test",description:"This is a description",count:42}',
      content: "<h1>Content</h1>",
    },
    options: {
      frontmatterSchema: z.object({
        title: z.string(),
        description: z.string(),
        count: z.number().positive(),
      }),
    },
  },
];

export const testCaseGroups: TestCaseGroup[] = [
  { groupName: "Attributes", testCases: attributeTestCases },
  { groupName: "Text", testCases: textTestCases },
  { groupName: "Element", testCases: elementTestCases },
  { groupName: "File Name", testCases: fileNameTestCases },
  { groupName: "Markdown", testCases: markdownTestCases },
  { groupName: "Frontmatter", testCases: frontmatterTestCases },
  { groupName: "Image", testCases: imageTestCases },
  { groupName: "Integration", testCases: integrationTestCases },
  { groupName: "Custom Component", testCases: customComponentTestCases },
  { groupName: "Plugin", testCases: pluginTestCases },
  { groupName: "Zod Schema", testCases: zodSchemaTestCases },
];
