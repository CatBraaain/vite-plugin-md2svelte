import type { Parents, Root, RootContent } from "hast";
import { describe, expect, it } from "vitest";
import { compileChildren, type Raw } from "../src/rehype-sveltify.js";

type TestCase = {
  input: (Root | RootContent | Raw)[];
  output: string;
};

const testCases: TestCase[] = [
  {
    input: [],
    output: "",
  },
  {
    // input: [createText("Hello"), createText(" World")],
    input: [
      { type: "text", value: "Hello" },
      { type: "text", value: " World" },
    ],
    output: "Hello World",
  },
  {
    input: [
      { type: "text", value: "Before " },
      {
        type: "element",
        tagName: "strong",
        properties: {},
        children: [{ type: "text", value: "bold" }],
      },
      { type: "text", value: " after" },
    ],
    output: "Before <strong>bold</strong> after",
  },
  {
    input: [
      {
        type: "raw",
        value: "<!-- raw -->",
      },
    ],
    output: "<!-- raw -->",
  },
  {
    input: [
      { type: "text", value: "Text " },
      {
        type: "element",
        tagName: "strong",
        properties: {},
        children: [
          { type: "text", value: "nested " },
          {
            type: "element",
            tagName: "em",
            properties: {},
            children: [{ type: "text", value: "deep" }],
          },
        ],
      },
    ],
    output: "Text <strong>nested <em>deep</em></strong>",
  },
];

describe("compileChildren", () => {
  it.each(testCases)("$description", ({ input, output }) => {
    const parent = {
      type: "root",
      children: input,
    };
    const result = compileChildren(parent as Parents);
    expect(result).toBe(output);
  });
});
