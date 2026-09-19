/**
 * Tech-theme row slot store: a mirror of the theme service snapshot, exactly
 * like the official Appearance row's store. The plugin's apply-world change
 * listener is the only writer; the row component reads via props.useStore.
 */
import { defineStore } from '@deepseek-ai/dsh-client-store';
import { DEFAULT_SIDEBAR_FONT } from "./sidebar-font.js";
/**
 * Declares the tech-theme row state and write surface.
 * @returns the store handle.
 */
export function createTechThemeStore() {
    return defineStore({
        init: () => ({ preference: 'system', revision: -1 }),
        actions: {
            sync: (d, preference, revision) => {
                if (revision <= d.revision)
                    return;
                d.preference = preference;
                d.revision = revision;
            },
        },
    });
}
/**
 * 侧边栏字号行的 store。与主题行同样的「镜像 + revision 守卫」范式：
 * 唯一写入方是 apply-world 的同步调用，组件经 useStore 只读。
 * @returns store 句柄。
 */
export function createSidebarFontStore() {
    return defineStore({
        init: () => ({ size: DEFAULT_SIDEBAR_FONT, revision: -1 }),
        actions: {
            sync: (d, size, revision) => {
                if (revision <= d.revision)
                    return;
                d.size = size;
                d.revision = revision;
            },
        },
    });
}
//# sourceMappingURL=settings-store.js.map