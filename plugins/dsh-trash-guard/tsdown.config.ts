import { defineConfig } from 'tsdown'

// Host-only Cordis plugin: plain ESM, no client bundle, no type declarations
// (the profile loader executes lib/index.js directly).
export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: 'esm',
  platform: 'node',
  target: 'node20',
  dts: false,
  clean: true,
  outExtensions: () => ({ js: '.js' }),
  deps: { neverBundle: [/^@deepseek-ai\//, /^node:/] },
})
