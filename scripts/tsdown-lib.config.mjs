// 复刻官方根 tsdown.config.ts 的普通库构建形态（非 client 包）。
// 用途：在隔离 worktree 中定向构建 ui-chat 客户端 bundle 需要内联的 workspace
// 依赖（dsh-brand / dsh-util-values / dsh-util-crypto / cosmokit）。
// 关键点：tsdown CLI 默认把 ESM 产物写成 .mjs，而各包 exports 指向 lib/index.js，
// 缺少 outExtensions 时 rolldown 会解析不到、进而把依赖当成 external。
export default {
  format: ['esm'],
  outDir: 'lib',
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  outExtensions: () => ({ js: '.js' }),
  dts: false,
  clean: false,
}
