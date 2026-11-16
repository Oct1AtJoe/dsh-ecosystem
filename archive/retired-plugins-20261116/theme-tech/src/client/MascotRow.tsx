/**
 * 输入框挂件偏好行：注册进 General 区的 item 槽，紧随科技主题区块之后。
 *
 * 交互：Switch 双态开关（开启/关闭输入框上方的像素小伙伴挂件）。
 */
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { createMascotStore } from './settings-store.ts'
import css from './MascotRow.module.css'

/** 注入的业务面。 */
export interface MascotRowInjected {
  /** 写入挂件开关状态。 */
  setMascotEnabled: (enabled: boolean) => void
}

/** 组件完整 props。 */
export type MascotRowProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createMascotStore>>
  & PropsLocale<'settings.theme.custom'> & MascotRowInjected

/**
 * 渲染输入框挂件偏好行。
 * @param props - 槽位组合 props。
 * @returns 该行的元素树。
 */
export function MascotRow({ t, setMascotEnabled, useStore }: MascotRowProps) {
  const enabled = useStore(s => s.enabled)

  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{t('mascot.title')}</div>
        <div className={css.desc}>{t('mascot.description')}</div>
      </div>
      <div className={css.control}>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={t('mascot.title')}
          className={css.switch}
          onClick={() => { setMascotEnabled(!enabled) }}
        >
          <span className={css.thumb} />
        </button>
      </div>
    </div>
  )
}
