/**
 * Tech-theme row slot store: a mirror of the theme service snapshot, exactly
 * like the official Appearance row's store. The plugin's apply-world change
 * listener is the only writer; the row component reads via props.useStore.
 */
import { type EngineStoreHandle } from '@deepseek-ai/dsh-client-store';
import type { ThemePreference } from '@deepseek-ai/dsh-client-ui-theme/client';
/** Store state mirrored from the theme snapshot. */
export interface TechThemeRowState {
    /** Persisted preference (selection state reads this, never the resolved active theme). */
    preference: ThemePreference;
    /** Service revision; -1 until first sync so revision 0 lands as a change. */
    revision: number;
}
/** Declared action shape giving the exported factory a stable return type. */
type TechThemeRowActions = {
    sync: (draft: TechThemeRowState, preference: ThemePreference, revision: number) => void;
};
/**
 * Declares the tech-theme row state and write surface.
 * @returns the store handle.
 */
export declare function createTechThemeStore(): EngineStoreHandle<TechThemeRowState, TechThemeRowActions>;
/** 侧边栏字号行的状态（独立于官方对话区字号）。 */
export interface SidebarFontRowState {
    /** 已持久化的侧边栏字号（px）。 */
    size: number;
    /** 递增序号；-1 起，保证首次同步落地。 */
    revision: number;
}
/** 侧边栏字号行的写面。 */
type SidebarFontRowActions = {
    sync: (draft: SidebarFontRowState, size: number, revision: number) => void;
};
/** 侧边栏字号行的 store。与主题行同样的「镜像 + revision 守卫」范式：
 * 唯一写入方是 apply-world 的同步调用，组件经 useStore 只读。
 * @returns store 句柄。
 */
export declare function createSidebarFontStore(): EngineStoreHandle<SidebarFontRowState, SidebarFontRowActions>;
/** Mascot 挂件开关行的状态。 */
export interface MascotRowState {
    enabled: boolean;
    revision: number;
}
/** Mascot 挂件开关行的写面。 */
type MascotRowActions = {
    sync: (draft: MascotRowState, enabled: boolean, revision: number) => void;
};
/**
 * Mascot 挂件开关行的 store。
 * @returns store 句柄。
 */
export declare function createMascotStore(): EngineStoreHandle<MascotRowState, MascotRowActions>;
/** 右侧边栏初始百分比宽度行的状态。 */
export interface RightbarWidthRowState {
    /** 已持久化的百分比（%）。 */
    ratio: number;
    /** 递增序号；-1 起，保证首次同步落地。 */
    revision: number;
}
/** 右侧边栏初始百分比宽度行的写面。 */
type RightbarWidthRowActions = {
    sync: (draft: RightbarWidthRowState, ratio: number, revision: number) => void;
};
/**
 * 右侧边栏初始百分比宽度行的 store。
 * @returns store 句柄。
 */
export declare function createRightbarWidthStore(): EngineStoreHandle<RightbarWidthRowState, RightbarWidthRowActions>;
/** 新会话版面设置行的状态。 */
export interface HomeLayoutRowState {
    layout: 'classic' | 'studio';
    revision: number;
}
type HomeLayoutRowActions = {
    sync: (draft: HomeLayoutRowState, layout: 'classic' | 'studio', revision: number) => void;
};
export declare function createHomeLayoutStore(): EngineStoreHandle<HomeLayoutRowState, HomeLayoutRowActions>;
/** 侧边栏入口显隐开关行的状态（自动化任务入口与「更多」入口共用形状）。 */
export interface EntryVisibilityRowState {
    visible: boolean;
    revision: number;
}
type EntryVisibilityRowActions = {
    sync: (draft: EntryVisibilityRowState, visible: boolean, revision: number) => void;
};
/**
 * 自动化任务入口显隐开关行的 store。
 * @returns store 句柄。
 */
export declare function createScheduleEntryStore(): EngineStoreHandle<EntryVisibilityRowState, EntryVisibilityRowActions>;
/**
 * 面板列表「更多」入口显隐开关行的 store。
 * @returns store 句柄。
 */
export declare function createMoreEntryStore(): EngineStoreHandle<EntryVisibilityRowState, EntryVisibilityRowActions>;
export {};
//# sourceMappingURL=settings-store.d.ts.map