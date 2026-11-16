import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { ThemePreference } from '@deepseek-ai/dsh-client-ui-theme/client';
import type { createTechThemeStore } from './settings-store.ts';
/** Locale namespace registered by this plugin (see src/client/index.ts). */
export declare const SETTINGS_NS = "settings.theme.custom";
/** Injected business face: the preference write (t rides the standard locale seat). */
export interface TechThemeRowInjected {
    /** Switch the theme preference. */
    setTheme: (id: ThemePreference) => void;
}
/** Full component props: runtime share + store share + locale seat + injected face. */
export type TechThemeRowProps = PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createTechThemeStore>> & PropsLocale<typeof SETTINGS_NS> & TechThemeRowInjected;
/**
 * Render the tech-theme row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export declare function TechThemeRow({ t, setTheme, useStore }: TechThemeRowProps): import("react").JSX.Element;
//# sourceMappingURL=TechThemeRow.d.ts.map