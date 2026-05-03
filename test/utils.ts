import { compile } from "svelte/compiler";
import { type Md2svelteOptions, md2svelte } from "../src/vite-plugin-md2svelte.js";

export async function md2svelteString(
  md: string,
  id: string = "test.md",
  options: Md2svelteOptions = {},
): Promise<string | null> {
  const transform = md2svelte(options).transform! as (
    code: string,
    id: string,
  ) => Promise<
    | {
        code: string;
        map: null;
      }
    | undefined
  >;
  const result = await transform(md, id);
  return result ? result.code : null;
}

export function validateSvelteSyntax(code: string): { isValid: boolean; errors: string[] } {
  try {
    compile(code, {
      generate: "server",
    });
    return {
      isValid: true,
      errors: [],
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        isValid: false,
        errors: [error.message],
      };
    }
    return {
      isValid: false,
      errors: ["Unknown compilation error"],
    };
  }
}

export function createScriptNodeString(content?: { meta?: string; import?: string }) {
  return [
    '<script lang="ts" context="module">',
    `export const meta = ${content?.meta || "{}"};`,
    content?.import ? content?.import : "",
    "</script>",
  ]
    .filter(Boolean)
    .join("\n");
}
