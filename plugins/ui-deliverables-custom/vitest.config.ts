/**
 * Vitest config for this plugin's browser-half specs.
 *
 * Why this exists at all: the spec used to import the engine from
 * `@deepseek-ai/dsh-client-runtime/client`, a package that no longer exists, so
 * the suite could not even load. The successor symbols live in
 * `@deepseek-ai/dsh-client-ui-conversation/client` and
 * `@deepseek-ai/dsh-client-ui-renderer/client`.
 *
 * Two resolution facts drive this file:
 *
 * 1. The ecosystem root's `node_modules/@deepseek-ai/*` entries cannot serve
 *    these imports. Their `lib/client.js` are browser bundles opening with
 *    `window.__ModuleLoader__.load` (unimportable by Node), and their plain
 *    `lib/index.js` files re-export `@deepseek-ai/<pkg>/src/...` specifiers that
 *    only resolve through the harness's own tsconfig paths facade. So every
 *    harness package is aliased to the DEEPSEEK HARNESS SOURCE — the same
 *    source-level resolution that repo's own vitest run performs. The harness
 *    checkout stays read-only: only resolution is borrowed, never a file.
 *
 * 2. Aliases only apply to modules Vite actually TRANSFORMS. Packages left
 *    external are handed to Node, which then walks the broken ecosystem tree.
 *    `server.deps.inline` therefore pulls in the published packages that carry
 *    such specifiers, so the aliases above can take effect.
 *
 * Plain object, no `vitest/config` import: that specifier resolves to the
 * ecosystem root's incomplete vitest install and fails before any test runs.
 * Run with the harness vitest:
 *   E:/vibeCoding/deepseek-harness/node_modules/.bin/vitest run
 */
const H = 'E:/vibeCoding/deepseek-harness'
const src = (rel) => `${H}/${rel}`
/** Harness pnpm store root, for intact copies of packages broken at the root. */
const store = (pkg) => `${H}/node_modules/.pnpm/${pkg}/node_modules`

/**
 * Ordered — the first match wins, and a plain string alias also swallows any
 * subpath (`@deepseek-ai/pkg` would capture `@deepseek-ai/pkg/src/…`), so the
 * `/src/` regexes must precede the exact package aliases.
 *
 * The groups are likewise most-specific-first: `dsh-` last, or it would swallow
 * `dsh-typert-…`, `dsh-session-…`, and the rest. The npm name carries a group
 * prefix (`dsh-client-<dir>`), so the captured segment is the directory name.
 */
const groups = [
  ['dsh-client', 'client'],
  ['dsh-host', 'host'],
  ['dsh-api', 'api'],
  ['dsh-session', 'session'],
  ['dsh-typert', 'typert'],
  ['dsh-', 'core'],
]

const exact = [
  // Longest subpaths first.
  ['@deepseek-ai/dsh-client-ui-conversation/client', src('packages/client/ui-conversation/src/client/index.ts')],
  ['@deepseek-ai/dsh-client-ui-conversation', src('packages/client/ui-conversation/src/index.ts')],
  ['@deepseek-ai/dsh-client-ui-renderer/client', src('packages/client/ui-renderer/src/client/index.ts')],
  ['@deepseek-ai/dsh-client-ui-renderer', src('packages/client/ui-renderer/src/index.ts')],
  ['@deepseek-ai/dsh-client-ui-chat/client', src('packages/client/ui-chat/src/client/index.ts')],
  ['@deepseek-ai/dsh-client-ui-chat', src('packages/client/ui-chat/src/index.ts')],
  ['@deepseek-ai/dsh-client-ui-session/client', src('packages/client/ui-session/src/client/index.ts')],
  ['@deepseek-ai/dsh-client-ui-session', src('packages/client/ui-session/src/index.ts')],
  ['@deepseek-ai/dsh-client-ui-layout/client', src('packages/client/ui-layout/src/client/index.ts')],
  ['@deepseek-ai/dsh-client-ui-layout', src('packages/client/ui-layout/src/index.ts')],
  ['@deepseek-ai/dsh-client-ui-tool/client', src('packages/client/ui-tool/src/client/index.ts')],
  ['@deepseek-ai/dsh-client-ui-tool', src('packages/client/ui-tool/src/index.ts')],
  ['@deepseek-ai/dsh-api-session-controller/client', src('packages/api/session-controller/src/client/index.ts')],
  ['@deepseek-ai/dsh-api-session-controller', src('packages/api/session-controller/src/index.ts')],
  ['@deepseek-ai/dsh-client-connection/client', src('packages/client/connection/src/client/index.ts')],
  ['@deepseek-ai/dsh-client-connection', src('packages/client/connection/src/index.ts')],
  ['@deepseek-ai/dsh-client-file-upload/client', src('packages/client/file-upload/src/client/index.ts')],
  ['@deepseek-ai/dsh-client-file-upload', src('packages/client/file-upload/src/index.ts')],
  ['@deepseek-ai/dsh-session/surface', src('packages/core/session/src/surface.ts')],
  ['@deepseek-ai/dsh-session/types', src('packages/core/session/src/types.ts')],
  ['@deepseek-ai/dsh-session', src('packages/core/session/src/index.ts')],
  ['@deepseek-ai/dsh-agent/types', src('packages/core/agent/src/types.ts')],
  ['@deepseek-ai/dsh-agent', src('packages/core/agent/src/index.ts')],
  ['@deepseek-ai/dsh-client-ui-slots', src('packages/client/ui-slots/src/index.ts')],
  ['@deepseek-ai/dsh-client-ui-primitives', src('packages/client/ui-primitives/src/index.ts')],
  ['@deepseek-ai/dsh-client-locale/client', src('packages/client/locale/src/client/index.ts')],
  ['@deepseek-ai/dsh-client-locale', src('packages/client/locale/src/index.ts')],
  // `dsh-client-test-runtime` is intentionally left to the ecosystem's published
  // lib: that lib is plain ESM and its internal bare specifiers route through the
  // aliases above once it is inlined (see `test.server.deps.inline`). Aliasing it
  // to source instead drags the whole harness source graph in.
  ['@deepseek-ai/dsh-client-store', src('packages/client/store/src/index.ts')],
  ['@deepseek-ai/dsh-invariants', src('packages/runtime-diagnostics/invariants/src/index.ts')],
  ['@deepseek-ai/dsh-typert-protocol/types', src('packages/typert/protocol/src/types.ts')],
  ['@deepseek-ai/dsh-typert-protocol', src('packages/typert/protocol/src/index.ts')],
  ['@deepseek-ai/schemastery', src('vendor/schemastery/src/index.ts')],
  ['@deepseek-ai/cosmokit', src('vendor/cosmokit/src/index.ts')],
  ['@deepseek-ai/cordis', src('vendor/cordis/src/index.ts')],
  // React, react-dom and the testing-library pair all come from the HARNESS pnpm
  // store, which is one internally-consistent dependency closure. Mixing roots
  // breaks in two ways seen here: a second React leaves the component dispatcher
  // null (`Cannot read properties of null (reading 'useEffect')`), and the
  // ecosystem copy of @testing-library/dom is missing its `dist/queries` tree.
  ['react-dom/client', store('react-dom@18.3.1_react@18.3.1') + '/react-dom/client.js'],
  ['react-dom', store('react-dom@18.3.1_react@18.3.1') + '/react-dom/index.js'],
  ['react/jsx-runtime', store('react@18.3.1') + '/react/jsx-runtime.js'],
  ['react/jsx-dev-runtime', store('react@18.3.1') + '/react/jsx-dev-runtime.js'],
  ['react', store('react@18.3.1') + '/react/index.js'],
  ['@testing-library/dom', store('@testing-library+dom@10.4.1') + '/@testing-library/dom/dist/index.js'],
  ['@testing-library/react', store('@testing-library+react@16.3_b0bbe147884ef4cbbf95e64a97c782e8') + '/@testing-library/react/dist/index.js'],
]

const aliases = groups
  .map(([prefix, dir]) => ({
    find: new RegExp(`^@deepseek-ai/${prefix}-(.+?)/src/(.*)$`),
    replacement: `${H}/packages/${dir}/$1/src/$2`,
  }))
  .concat(exact.map(([find, replacement]) => ({ find, replacement })))

export default {
  resolve: {
    // React, react-dom, the JSX runtimes and testing-library are all pinned in
    // `exact` above to the harness store, so one closure serves every module.
    alias: aliases,
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    server: {
      deps: {
        // Packages that must be transformed for the aliases above to apply:
        // left external, Node resolves them through the ecosystem tree, whose
        // @deepseek-ai entries are bundles or carry unresolvable `/src/` specs.
        inline: [
          /@deepseek-ai\/dsh-client-test-runtime/,
          /@deepseek-ai\/dsh-api-session-controller/,
          /@deepseek-ai\/dsh-client-ui-/,
          // Both halves of the testing-library pair must be transformed: the
          // ecosystem root's copy is missing `dist/queries`, so the alias above
          // has to apply to every module that imports it (including the nested
          // `@testing-library/react`).
          /@testing-library\//,
        ],
      },
    },
  },
}
