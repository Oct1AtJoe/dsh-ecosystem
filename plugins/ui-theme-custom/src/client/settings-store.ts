/**
 * Tech-theme row slot store: a mirror of the theme service snapshot, exactly
 * like the official Appearance row's store. The plugin's apply-world change
 * listener is the only writer; the row component reads via props.useStore.
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-store'
import type { ThemePreference } from '@deepseek-ai/dsh-client-ui-theme/client'
import { DEFAULT_SIDEBAR_FONT } from './sidebar-font.ts'

/** Store state mirrored from the theme snapshot. */
export interface TechThemeRowState {
  /** Persisted preference (selection state reads this, never the resolved active theme). */
  preference: ThemePreference
  /** Service revision; -1 until first sync so revision 0 lands as a change. */
  revision: number
}

/** Declared action shape giving the exported factory a stable return type. */
type TechThemeRowActions = {
  sync: (draft: TechThemeRowState, preference: ThemePreference, revision: number) => void
}

/**
 * Declares the tech-theme row state and write surface.
 * @returns the store handle.
 */
export function createTechThemeStore(): EngineStoreHandle<TechThemeRowState, TechThemeRowActions> {
  return defineStore({
    init: () => ({ preference: 'system', revision: -1 }),
    actions: {
      sync: (d, preference, revision) => {
        if (revision <= d.revision) return
        d.preference = preference
        d.revision = revision
      },
    },
  })
}

/** 侧边栏字号行的状态（独立于官方对话区字号）。 */
export interface SidebarFontRowState {
  /** 已持久化的侧边栏字号（px）。 */
  size: number
  /** 递增序号；-1 起，保证首次同步落地。 */
  revision: number
}

/** 侧边栏字号行的写面。 */
type SidebarFontRowActions = {
  sync: (draft: SidebarFontRowState, size: number, revision: number) => void
}

/**
 * 侧边栏字号行的 store。与主题行同样的「镜像 + revision 守卫」范式：
 * 唯一写入方是 apply-world 的同步调用，组件经 useStore 只读。
 * @returns store 句柄。
 */
export function createSidebarFontStore(): EngineStoreHandle<SidebarFontRowState, SidebarFontRowActions> {
  return defineStore({
    init: () => ({ size: DEFAULT_SIDEBAR_FONT, revision: -1 }),
    actions: {
      sync: (d, size, revision) => {
        if (revision <= d.revision) return
        d.size = size
        d.revision = revision
      },
    },
  })
}
