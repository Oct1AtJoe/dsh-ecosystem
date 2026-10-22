/**
 * 自动化任务入口显隐偏好行：注册进 General 区的 item 槽。
 *
 * 交互：Switch 双态开关（开启/关闭左侧边栏工作区上方的自动化任务入口）。
 */
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { createScheduleEntryStore } from './settings-store.ts'
import css from './ScheduleEntryRow.module.css'

/** 注入的业务面。 */
export interface ScheduleEntryRowInjected {
  /** 写入自动化任务入口显隐状态。 */
  setScheduleEntryVisible: (visible: boolean) => void
}

/** 组件完整 props。 */
export type ScheduleEntryRowProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createScheduleEntryStore>>
  & PropsLocale<'settings.theme.custom'> & ScheduleEntryRowInjected

/**
 * 渲染自动化任务入口显隐偏好行。
 * @param props - 槽位组合 props。
 * @returns 该行的元素树。
 */
export function ScheduleEntryRow({ t, setScheduleEntryVisible, useStore }: ScheduleEntryRowProps) {
  const visible = useStore(s => s.visible)

  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{t('schedule-entry.title')}</div>
        <div className={css.desc}>{t('schedule-entry.description')}</div>
      </div>
      <div className={css.control}>
        <button
          type="button"
          role="switch"
          aria-checked={visible}
          aria-label={t('schedule-entry.title')}
          className={css.switch}
          onClick={() => { setScheduleEntryVisible(!visible) }}
        >
          <span className={css.thumb} />
        </button>
      </div>
    </div>
  )
}
