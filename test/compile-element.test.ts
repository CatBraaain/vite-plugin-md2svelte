import type { Element } from "hast";
import { describe, expect, it } from "vitest";
import { compileElement } from "../src/index.js";

type TestCase = {
  input: Element;
  output: string;
};

const testCases: TestCase[] = [
  {
    input: { type: "element", tagName: "br", properties: {}, children: [] },
    output: "<br />",
  },
  {
    input: {
      type: "element",
      tagName: "div",
      properties: { class: ["foo", "bar"] },
      children: [],
    },
    output: '<div class="foo bar"></div>',
  },
  {
    input: {
      type: "element",
      tagName: "img",
      properties: { src: "test.jpg", alt: "test" },
      children: [],
    },
    output: '<img src="test.jpg" alt="test" />',
  },
  {
    input: {
      type: "element",
      tagName: "p",
      properties: {},
      children: [
        {
          type: "text",
          value: "Hello",
        },
      ],
    },
    output: "<p>Hello</p>",
  },
  {
    input: {
      type: "element",
      tagName: "p",
      properties: {},
      children: [
        {
          type: "element",
          tagName: "span",
          properties: {},
          children: [
            {
              type: "text",
              value: "nested",
            },
          ],
        },
      ],
    },
    output: "<p><span>nested</span></p>",
  },
];

describe("compileElement", () => {
  it.each(testCases)("$description", ({ input, output }) => {
    const result = compileElement(input);
    expect(result).toBe(output);
  });
});
