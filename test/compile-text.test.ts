import type { Parents, Text } from "hast";
import { describe, expect, it } from "vitest";
import { compileText } from "../src/rehype-sveltify.js";

type TestCase = {
  parentTag: string;
  input: string;
  output: string;
};

const testCases: TestCase[] = [
  {
    parentTag: "script",
    input: 'const x = { y: "1" }; const a = b && c;',
    output: 'const x = { y: "1" }; const a = b && c;',
  },
  {
    parentTag: "style",
    input: "body {color: red;}",
    output: "body {color: red;}",
  },
  {
    parentTag: "div",
    input: "Hello {world}",
    output: "Hello &#x7B;world&#x7D;",
  },
  {
    parentTag: "div",
    input: "<div>",
    output: "&lt;div>",
  },
  {
    parentTag: "div",
    input: "a&b",
    output: "a&b",
  },
];

describe("compileText", () => {
  it.each(testCases)("$description", ({ parentTag, input, output }) => {
    const node = { type: "text", value: input } as Text;
    const parent = {
      type: "element",
      tagName: parentTag,
    } as Parents;
    const result = compileText(node, parent);
    expect(result).toBe(output);
  });
});
