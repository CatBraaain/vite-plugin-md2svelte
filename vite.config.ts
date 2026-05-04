import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    dts: {
      sourcemap: true,
    },
    deps: {
      skipNodeModulesBundle: true,
    },
  },
});
