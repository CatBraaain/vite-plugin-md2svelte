type TestCaseGroup = {
  groupName: string;
  testCases: TestCase[];
};

type TestCase = {
  name: string;
  fileName?: string;
  input: string;
  output: Output | null;
};

type Output = {
  meta?: string;
  import?: string;
  content?: string;
};

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
    name: "simple paragraph",
    input: "Hello World",
    output: { content: "<p>Hello World</p>" },
  },
  {
    name: "heading",
    input: "# Heading",
    output: { content: "<h1>Heading</h1>" },
  },
  {
    name: "heading and paragraph",
    input: ["# Heading", "", "This is a paragraph."].join("\n"),
    output: { content: ["<h1>Heading</h1>", "<p>This is a paragraph.</p>"].join("\n") },
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
    name: "simple key-value",
    input: ["---", "title: Test", "---"].join("\n"),
    output: { meta: '{title:"Test"}' },
  },
  {
    name: "multiple keys",
    input: ["---", "title: Test", "date: 2024-01-01", "author: John", "---"].join("\n"),
    output: { meta: '{title:"Test",date:new Date(1704067200000),author:"John"}' },
  },
  {
    name: "arrays",
    input: ["---", "tags: [js, ts, vite]", "---"].join("\n"),
    output: { meta: '{tags:["js","ts","vite"]}' },
  },
  {
    name: "boolean values",
    input: ["---", "published: true", "draft: false", "---"].join("\n"),
    output: { meta: "{published:true,draft:false}" },
  },
  {
    name: "number values",
    input: ["---", "order: 1", "priority: 10", "---"].join("\n"),
    output: { meta: "{order:1,priority:10}" },
  },
  {
    name: "no frontmatter",
    input: ["---", "---"].join("\n"),
    output: { meta: "{}" },
  },
];

const imageTestCases: TestCase[] = [
  {
    name: "single image",
    input: "![Alt text](./image.png)",
    output: {
      import: 'import image1 from "./image.png";',
      content: '<p><img alt="Alt text" src={image1} /></p>',
    },
  },
  {
    name: "multiple images",
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
    name: "URL image",
    input: "![Remote](https://example.com/image.png)",
    output: { content: '<p><img src="https://example.com/image.png" alt="Remote" /></p>' },
  },
  {
    name: "frontmatter and image",
    input: ["---", "title: Test", "---", "", "![Img](./img.png)"].join("\n"),
    output: {
      meta: '{title:"Test"}',
      import: 'import image1 from "./img.png";',
      content: '<p><img alt="Img" src={image1} /></p>',
    },
  },
];

const integrationTestCases: TestCase[] = [
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
    output: {
      meta: '{meta:{level1:{level2:{value:"deep"}}}}',
      import: 'import image1 from "./icon.svg";',
      content: [
        "<h1>Main</h1>",
        "<h2>Section</h2>",
        "<ul>",
        "<li>Item 1</li>",
        "<li>Item 2</li>",
        "</ul>",
        '<p><img alt="Icon" src={image1} /></p>',
      ].join("\n"),
    },
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
    output: {
      meta: '{title:"Code Examples"}',
      content: [
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
    output: {
      meta: '{title:"Linked Content"}',
      content: [
        "<h1>Resources</h1>",
        "<blockquote>",
        "<p>Important note</p>",
        "</blockquote>",
        '<p><a href="https://example.com">Visit docs</a></p>',
      ].join("\n"),
    },
  },
];

export const testCaseGroups: TestCaseGroup[] = [
  { groupName: "File Name", testCases: fileNameTestCases },
  { groupName: "Markdown", testCases: markdownTestCases },
  { groupName: "Frontmatter", testCases: frontmatterTestCases },
  { groupName: "Image", testCases: imageTestCases },
  { groupName: "Integration", testCases: integrationTestCases },
];
