import type { Properties } from "hast";
import { describe, expect, it } from "vite-plus/test";

import { serializeAttribute } from "../src/rehype-sveltify.js";

type TestCase = {
  input: Properties;
  output: string;
};

const testCases: TestCase[] = [
  {
    input: { "raw:key": "{raw value}" },
    output: "key={raw value}",
  },
  {
    input: { key: null },
    output: "",
  },
  {
    input: { key: undefined },
    output: "",
  },
  {
    input: { key: NaN },
    output: "",
  },
  {
    input: { key: true },
    output: "key",
  },
  {
    input: { key: [1, 2, 3] },
    output: 'key="1 2 3"',
  },
  {
    input: { key: ["foo", "bar"] },
    output: 'key="foo bar"',
  },
  {
    input: { key: [1, 2, 3, "foo", "bar"] },
    output: 'key="1 2 3 foo bar"',
  },
  {
    input: { key: "normal string" },
    output: 'key="normal string"',
  },
  {
    input: { key: 1 },
    output: "key=1",
  },
  {
    input: { key: '"need escape"' },
    output: 'key="&quot;need escape&quot;"',
  },
  {
    input: { key: "&need escape" },
    output: 'key="&amp;need escape"',
  },
  {
    input: { key: "{need escape}" },
    output: 'key="&#x7B;need escape&#x7D;"',
  },
];

describe("serializeAttribute", () => {
  it.each(testCases)("$input -> $output", ({ input, output }) => {
    const key = Object.keys(input)[0]!;
    const value = input[key];
    expect(serializeAttribute(key, value as any)).toBe(output);
  });
});
