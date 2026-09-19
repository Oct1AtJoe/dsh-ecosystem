/**
 * Tech-theme preference row registered into the General section item slot
 * beside the official Appearance row (id `appearance-custom`, after it).
 * Six cubes rendered only when this plugin mounts, so the official ui-theme
 * package never references the custom theme ids. Selection follows the persisted
 * preference, never the resolved active theme; the ids persist through the official
 * settings scope because `THEME_PREFERENCES` includes them.
 */
import clsx from 'clsx'
import type { ComponentType } from 'react'
import {
  IconAgentPresetOutline16,
  IconBrowseOutline16,
  IconGoalOutline16,
  IconListPenOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: the settings section's SlotMap entry behind PropsRuntime.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ThemePreference } from '@deepseek-ai/dsh-client-ui-theme/client'
import type { TechThemeKey } from './locales.ts'
import type { createTechThemeStore } from './settings-store.ts'
import css from './TechThemeRow.module.css'

/** 液态 (Liquid Frost) 主题专有图标：透光液态水滴，带镜面反射微弧 */
function IconLiquid16({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2.2C8 2.2 3.8 7.4 3.8 10.2C3.8 12.5 5.7 14.4 8 14.4C10.3 14.4 12.2 12.5 12.2 10.2C12.2 7.4 8 2.2 8 2.2Z" />
      <path d="M6.2 9.8C6.3 11.2 7.4 12.2 8.6 12.3" strokeWidth="1.1" strokeLinecap="round" opacity="0.65" />
    </svg>
  )
}

/** 曜黑 (Dark Obsidian) 主题专有图标：黑曜石多面体切面晶石棱镜 */
function IconObsidian16({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="8,1.8 13.8,6 11.6,13.8 4.4,13.8 2.2,6" />
      <polyline points="8,1.8 8,13.8" strokeWidth="1" opacity="0.6" />
      <polyline points="2.2,6 8,8.2 13.8,6" strokeWidth="1" opacity="0.6" />
    </svg>
  )
}

/** Locale namespace registered by this plugin (see src/client/index.ts). */
export const SETTINGS_NS = 'settings.theme.custom'

/** Injected business face: the preference write (t rides the standard locale seat). */
export interface TechThemeRowInjected {
  /** Switch the theme preference. */
  setTheme: (id: ThemePreference) => void
}

/** Full component props: runtime share + store share + locale seat + injected face. */
export type TechThemeRowProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createTechThemeStore>>
  & PropsLocale<typeof SETTINGS_NS> & TechThemeRowInjected

/** Cube order and icons. Id must match a registered theme id. */
const CUBES: readonly { id: string; labelKey: TechThemeKey; Icon: ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'sequoia', labelKey: 'tech-theme.sequoia', Icon: IconLiquid16 },
  { id: 'sonoma', labelKey: 'tech-theme.sonoma', Icon: IconObsidian16 },
  { id: 'void', labelKey: 'tech-theme.void', Icon: IconAgentPresetOutline16 },
  { id: 'jade', labelKey: 'tech-theme.jade', Icon: IconBrowseOutline16 },
  { id: 'solar', labelKey: 'tech-theme.solar', Icon: IconGoalOutline16 },
  { id: 'parchment', labelKey: 'tech-theme.parchment', Icon: IconListPenOutline16 },
]

/**
 * Render the tech-theme row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export function TechThemeRow({ t, setTheme, useStore }: TechThemeRowProps) {
  const preference = useStore(s => s.preference)
  return (
    <div className={css.group}>
      <div className={css.title}>{t('tech-theme.title')}</div>
      <div className={css.cubeRow}>
        {CUBES.map(({ id, labelKey, Icon }) => (
          <button
            key={id}
            type="button"
            className={clsx(css.themeCube, preference === id && css.selected)}
            aria-pressed={preference === id}
            onClick={() => { setTheme(id as ThemePreference) }}
          >
            <Icon />
            {t(labelKey)}
          </button>
        ))}
      </div>
    </div>
  )
}
