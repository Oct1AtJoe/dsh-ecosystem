/**
 * Placeholder library face for the tsdown client preset.
 *
 * The Node host half is hand-written ESM (`lib/index.mjs`) and published as-is:
 * it owns the HTTP routes, the settings `Config` schema and the notification
 * queue, none of which want a bundle step. This entry only satisfies the shared
 * preset's need for a lib entry; `lib/index.js` and `lib/types` are build
 * byproducts and are absent from `package.json` `files`.
 */
export {};
//# sourceMappingURL=index.d.ts.map