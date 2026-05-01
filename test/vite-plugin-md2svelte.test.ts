import { describe, expect, it } from "vitest";
import { testCaseGroups } from "./test-cases.ts";
import { createScriptNodeString } from "./utils";
import { md2svelteString, validateSvelteSyntax } from "./utils.js";

for (const testCaseGroup of testCaseGroups) {
  const { groupName, testCases } = testCaseGroup;
  describe(groupName, () => {
    it.each(testCases)("$name", async ({ input, fileName, output }) => {
      const svelteString = await md2svelteString(input, fileName);
      if (output !== null) {
        expect(svelteString).toBe(
          createScriptNodeString({ meta: output.meta, import: output.import }) +
            (output.content ? `\n${output.content}` : ""),
        );
        expect(svelteString && validateSvelteSyntax(svelteString).isValid).toBe(true);
      } else {
        expect(svelteString).toBe(output);
      }
    });
  });
}
