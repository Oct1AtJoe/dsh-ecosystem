/**
 * The plugin-registered "aurora" theme (极光): a violet-accented variant over the
 * dark base palette. Unlike light/dark — which are the unmodified base
 * palettes — aurora overrides the alias tokens with a purple-tinted surface
 * ramp and a light-violet brand accent, all chosen against the dark base
 * (primary text >= 4.5:1, secondary >= 3:1 on every surface it sits on).
 * The presenter applies these as inline body variables, so the values are
 * literal colors — no var() chains, no dependence on the static palette.
 */
import type { ThemeTokens } from '@deepseek-ai/dsh-client-ui-theme/client';
/** Alias-token overrides for the aurora theme (single values per token; the
 * theme pins its own color scheme, so one value per token is sufficient). */
export declare const AURORA_TOKENS: ThemeTokens;
//# sourceMappingURL=aurora.d.ts.map