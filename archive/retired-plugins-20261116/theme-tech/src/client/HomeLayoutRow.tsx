import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { TechThemeKey } from './locales.ts'
import type { createHomeLayoutStore } from './settings-store.ts'
import css from './HomeLayoutRow.module.css'

export interface HomeLayoutRowInjected {
  setLayout: (layout: 'classic' | 'studio') => void
}

export type HomeLayoutRowProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createHomeLayoutStore>>
  & PropsLocale<'settings.theme.custom'> & HomeLayoutRowInjected

export function HomeLayoutRow({ t, setLayout, useStore }: HomeLayoutRowProps) {
  const current = useStore(s => s.layout)

  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{t('home-layout.title' as TechThemeKey)}</div>
        <div className={css.desc}>{t('home-layout.description' as TechThemeKey)}</div>
      </div>
      <div className={css.segmented}>
        <button
          type="button"
          className={css.segmentItem}
          data-active={current === 'classic' ? '' : undefined}
          aria-pressed={current === 'classic'}
          onClick={() => setLayout('classic')}
        >
          {t('home-layout.classic' as TechThemeKey)}
        </button>
        <button
          type="button"
          className={css.segmentItem}
          data-active={current === 'studio' ? '' : undefined}
          aria-pressed={current === 'studio'}
          onClick={() => setLayout('studio')}
        >
          {t('home-layout.studio' as TechThemeKey)}
        </button>
      </div>
    </div>
  )
}
