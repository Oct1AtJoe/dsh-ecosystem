/**
 * 右侧边栏初始百分比宽度偏好行：注册进 General 区的 item 槽，紧随「输入框挂件」行之后。
 *
 * 交互：数字输入框（直接键入）+ 上下步进微调（±1%）。键入非法值在 blur 时夹取回合法值。
 */
import { useState, type ChangeEvent } from 'react'
import {
  IconChevronDownOutline14, IconChevronUpOutline14,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { RIGHTBAR_RATIO_MAX, RIGHTBAR_RATIO_MIN, normalizeRightbarRatio } from './rightbar-width.ts'
import type { createRightbarWidthStore } from './settings-store.ts'
import type { TechThemeKey } from './locales.ts'
import css from './RightbarWidthRow.module.css'

/** 注入的业务面。 */
export interface RightbarWidthRowInjected {
  /** 写入右侧边栏初始百分比（%，越界由实现夹取）。 */
  setRightbarRatio: (ratio: number) => void
}

/** 组件完整 props。 */
export type RightbarWidthRowProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createRightbarWidthStore>>
  & PropsLocale<'settings.theme.custom'> & RightbarWidthRowInjected

/**
 * 渲染右侧边栏初始百分比宽度行。
 * @param props - 槽位组合 props。
 * @returns 该行的元素树。
 */
export function RightbarWidthRow({ t, setRightbarRatio, useStore }: RightbarWidthRowProps) {
  const ratio = useStore(s => s.ratio)
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (next: number): void => {
    const clamped = normalizeRightbarRatio(next)
    setRightbarRatio(clamped)
    setDraft(null)
  }

  const onInput = (e: ChangeEvent<HTMLInputElement>): void => {
    const v = e.target.value.replace(/[^\d]/g, '').slice(0, 2)
    setDraft(v)
    if (v.length === 2) {
      const num = Number.parseInt(v, 10)
      if (!Number.isNaN(num) && num >= RIGHTBAR_RATIO_MIN && num <= RIGHTBAR_RATIO_MAX) {
        setRightbarRatio(num)
      }
    }
  }

  const onBlur = (): void => {
    if (draft === null) return
    if (draft === '') { setDraft(null); return }
    commit(Number.parseInt(draft, 10))
  }

  const onKeyDown = (e: { key: string; preventDefault: () => void }): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const v = draft ?? String(ratio)
      commit(v === '' ? ratio : Number.parseInt(v, 10))
    }
  }

  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{t('rightbar-width.title')}</div>
        <div className={css.desc}>{t('rightbar-width.description')}</div>
      </div>
      <div className={css.control}>
        <div className={css.stepper}>
          <input
            className={css.value}
            type="text"
            inputMode="numeric"
            aria-label={t('rightbar-width.title')}
            value={draft ?? String(ratio)}
            onChange={onInput}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
          />
          <span className={css.arrows}>
            <button
              type="button"
              className={css.arrow}
              aria-label={t('rightbar-width.increase')}
              disabled={ratio >= RIGHTBAR_RATIO_MAX}
              onClick={() => { commit(ratio + 1) }}
            >
              <IconChevronUpOutline14 size={9} />
            </button>
            <button
              type="button"
              className={css.arrow}
              aria-label={t('rightbar-width.decrease')}
              disabled={ratio <= RIGHTBAR_RATIO_MIN}
              onClick={() => { commit(ratio - 1) }}
            >
              <IconChevronDownOutline14 size={9} />
            </button>
          </span>
        </div>
        <span className={css.unit}>{t('rightbar-width.unit')}</span>
      </div>
    </div>
  )
}

export type { TechThemeKey }
