import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { createHomeLayoutStore } from './settings-store.ts';
export interface HomeLayoutRowInjected {
    setLayout: (layout: 'classic' | 'studio') => void;
}
export type HomeLayoutRowProps = PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createHomeLayoutStore>> & PropsLocale<'settings.theme.custom'> & HomeLayoutRowInjected;
export declare function HomeLayoutRow({ t, setLayout, useStore }: HomeLayoutRowProps): import("react").JSX.Element;
//# sourceMappingURL=HomeLayoutRow.d.ts.map