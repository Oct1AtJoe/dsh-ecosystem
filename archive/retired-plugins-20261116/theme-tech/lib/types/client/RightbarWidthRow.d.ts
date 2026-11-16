import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { createRightbarWidthStore } from './settings-store.ts';
import type { TechThemeKey } from './locales.ts';
/** 注入的业务面。 */
export interface RightbarWidthRowInjected {
    /** 写入右侧边栏初始百分比（%，越界由实现夹取）。 */
    setRightbarRatio: (ratio: number) => void;
}
/** 组件完整 props。 */
export type RightbarWidthRowProps = PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createRightbarWidthStore>> & PropsLocale<'settings.theme.custom'> & RightbarWidthRowInjected;
/**
 * 渲染右侧边栏初始百分比宽度行。
 * @param props - 槽位组合 props。
 * @returns 该行的元素树。
 */
export declare function RightbarWidthRow({ t, setRightbarRatio, useStore }: RightbarWidthRowProps): import("react").JSX.Element;
export type { TechThemeKey };
//# sourceMappingURL=RightbarWidthRow.d.ts.map