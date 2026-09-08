//#region lib/types/invariant.js
/** Package-owned invariant companion. @module @deepseek-ai/dsh-client-ui-kanye-pet/invariant */
const PACKAGE_NAME = "@deepseek-ai/dsh-client-ui-kanye-pet";
/** Cordis companion plugin name. */
const name = "client-ui-kanye-pet-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/** No runtime invariant: this package owns a settings card over the kanye-pet namespace. */
const install = () => {};
/** Register this package's invariant companion. */
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
