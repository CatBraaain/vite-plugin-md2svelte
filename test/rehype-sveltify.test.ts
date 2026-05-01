import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import { rehypeSveltify } from "../src/rehype-sveltify.js";

type TestCase = {
  input: string;
  output: string;
};

const testCases: TestCase[] = [
  {
    input: "Hello World",
    output: "<p>Hello World</p>",
  },
  {
    input: ["# Heading", "", "This is a paragraph."].join("\n"),
    output: ["<h1>Heading</h1>", "<p>This is a paragraph.</p>"].join("\n"),
  },
  {
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
    output: [
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
  {
    input: "",
    output: "",
  },
  {
    input: [
      "> Blockquote",
      ">> Nested blockquote",
      ">>> Deep nested",
      "",
      "Code block:",
      "```",
      'console.log("test");',
      "```",
    ].join("\n"),
    output: [
      "<blockquote>",
      "<p>Blockquote</p>",
      "<blockquote>",
      "<p>Nested blockquote</p>",
      "<blockquote>",
      "<p>Deep nested</p>",
      "</blockquote>",
      "</blockquote>",
      "</blockquote>",
      "<p>Code block:</p>",
      '<pre><code>console.log("test");',
      "</code></pre>",
    ].join("\n"),
  },
];

describe("rehypeSveltify", () => {
  it.each(testCases)("$input", async ({ input, output }) => {
    const processor = unified().use(remarkParse).use(remarkRehype).use(rehypeSveltify);
    const result = await processor.process(input);
    expect(result.toString()).toBe(output);
  });
});
