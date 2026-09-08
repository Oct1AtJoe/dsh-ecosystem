//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-subagent-custom`.
* @module @deepseek-ai/dsh-client-ui-subagent-custom/invariant
*/
const PACKAGE_NAME = "@deepseek-ai/dsh-client-ui-subagent-custom";
/** Cordis companion plugin name. */
const name = "client-ui-subagent-custom-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: the dictionary and slot registrations are
* effect-owned with disposal proven by their plugin specs; this package owns
* no mutable state.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
