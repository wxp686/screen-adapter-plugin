import terser from "@rollup/plugin-terser";
import { defineConfig } from 'rollup';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';

export default defineConfig({
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.js",
      format: "esm",
      plugins: [
        getBabelOutputPlugin({ presets: ['@babel/preset-env'] }),
        terser(),
      ],
    },
  ],
  plugins: [typescript(),],
});