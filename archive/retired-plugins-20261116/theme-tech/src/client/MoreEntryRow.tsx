/**
 * 面板列表「更多」入口显隐偏好行：注册进 General 区的 item 槽。
 *
 * 「更多」是官方 ui-sidebar 的 `PanelMoreMenu`，只要 `sidebar.panellist.actions`
 * 槽有注册项就渲染。它管的是面板固定/取消固定，与具体业务面板无关，
 * 所以与「自动化任务入口」分成两个独立开关。
 *
 * 交互：Switch 双态开关。几何与 `ScheduleEntryRow` 一致，复用同一份 CSS module。
 */
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { createMoreEntryStore } from './settings-store.ts'
import css from './ScheduleEntryRow.module.css'

/** 注入的业务面。 */
export interface MoreEntryRowInjected {
  /** 写入「更多」入口显隐状态。 */
  setMoreEntryVisible: (visible: boolean) => void
}

/** 组件完整 props。 */
export type MoreEntryRowProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createMoreEntryStore>>
  & PropsLocale<'settings.theme.custom'> & MoreEntryRowInjected

/**
 * 渲染「更多」入口显隐偏好行。
 * @param props - 槽位组合 props。
 * @returns 该行的元素树。
 */
export function MoreEntryRow({ t, setMoreEntryVisible, useStore }: MoreEntryRowProps) {
  const visible = useStore(s => s.visible)

  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{t('more-entry.title')}</div>
        <div className={css.desc}>{t('more-entry.description')}</div>
      </div>
      <div className={css.control}>
        <button
          type="button"
          role="switch"
          aria-checked={visible}
          aria-label={t('more-entry.title')}
          className={css.switch}
          onClick={() => { setMoreEntryVisible(!visible) }}
        >
          <span className={css.thumb} />
        </button>
      </div>
    </div>
  )
}
