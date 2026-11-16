import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { createSidebarFontStore } from './settings-store.ts';
import type { TechThemeKey } from './locales.ts';
/** 注入的业务面。 */
export interface SidebarFontRowInjected {
    /** 写入侧边栏字号（px，越界由实现夹取）。 */
    setSidebarFont: (px: number) => void;
}
/** 组件完整 props。 */
export type SidebarFontRowProps = PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createSidebarFontStore>> & PropsLocale<'settings.theme.custom'> & SidebarFontRowInjected;
/**
 * 渲染侧边栏字号行。
 * @param props - 槽位组合 props。
 * @returns 该行的元素树。
 */
export declare function SidebarFontRow({ t, setSidebarFont, useStore }: SidebarFontRowProps): import("react").JSX.Element;
/** 供 index.ts 复用的文案键类型检查。 */
export type { TechThemeKey };
//# sourceMappingURL=SidebarFontRow.d.ts.map