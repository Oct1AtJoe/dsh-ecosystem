/**
 * 侧边栏字号偏好行：注册进 General 区的 item 槽，紧邻官方「字号大小」行之后。
 *
 * 为什么单独一行而不是改官方那行：官方 FontSizeRow 属 ui-theme 包，且官方源码
 * 零修改是架构铁律（AGENTS.md 铁律 1）。插件经 settings.general.item 槽位新增
 * 自己的行，与官方行共用同一套视觉节奏。
 *
 * 交互：数字输入框（直接键入）+ 上下步进（微调）。键入非法值在 blur 时夹取回合法值，
 * 因此不会出现空值或越界持久化。
 */
import { useState, type ChangeEvent } from 'react'
import {
  IconChevronDownOutline14, IconChevronUpOutline14,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { SIDEBAR_FONT_MAX, SIDEBAR_FONT_MIN, normalizeSidebarFont } from './sidebar-font.ts'
import type { createSidebarFontStore } from './settings-store.ts'
import type { TechThemeKey } from './locales.ts'
import css from './SidebarFontRow.module.css'

/** 注入的业务面。 */
export interface SidebarFontRowInjected {
  /** 写入侧边栏字号（px，越界由实现夹取）。 */
  setSidebarFont: (px: number) => void
}

/** 组件完整 props。 */
export type SidebarFontRowProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createSidebarFontStore>>
  & PropsLocale<'settings.theme.custom'> & SidebarFontRowInjected

/**
 * 渲染侧边栏字号行。
 * @param props - 槽位组合 props。
 * @returns 该行的元素树。
 */
export function SidebarFontRow({ t, setSidebarFont, useStore }: SidebarFontRowProps) {
  const size = useStore(s => s.size)
  // 键入中的草稿：为 null 时显示持久化值。这样用户能清空重打，而不会被
  // 受控值强行回填打断输入。
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (next: number): void => {
    const clamped = normalizeSidebarFont(next)
    setSidebarFont(clamped)
    setDraft(null)
  }

  const onInput = (e: ChangeEvent<HTMLInputElement>): void => {
    // 只接受数字字符，避免出现 NaN 草稿
    const v = e.target.value.replace(/[^\d]/g, '').slice(0, 2)
    setDraft(v)
  }

  const onBlur = (): void => {
    if (draft === null) return
    if (draft === '') { setDraft(null); return }
    commit(Number.parseInt(draft, 10))
  }

  const onKeyDown = (e: { key: string; preventDefault: () => void }): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const v = draft ?? String(size)
      commit(v === '' ? size : Number.parseInt(v, 10))
    }
  }

  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{t('sidebar-font.title')}</div>
        <div className={css.desc}>{t('sidebar-font.description')}</div>
      </div>
      <div className={css.control}>
        <input
          className={css.input}
          type="text"
          inputMode="numeric"
          aria-label={t('sidebar-font.title')}
          value={draft ?? String(size)}
          onChange={onInput}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        <span className={css.unit}>{t('sidebar-font.unit')}</span>
        <span className={css.arrows}>
          <button
            type="button"
            className={css.arrow}
            aria-label={t('sidebar-font.increase')}
            disabled={size >= SIDEBAR_FONT_MAX}
            onClick={() => { commit(size + 1) }}
          >
            <IconChevronUpOutline14 size={9} />
          </button>
          <button
            type="button"
            className={css.arrow}
            aria-label={t('sidebar-font.decrease')}
            disabled={size <= SIDEBAR_FONT_MIN}
            onClick={() => { commit(size - 1) }}
          >
            <IconChevronDownOutline14 size={9} />
          </button>
        </span>
      </div>
    </div>
  )
}

/** 供 index.ts 复用的文案键类型检查。 */
export type { TechThemeKey }
