/**
 * Tech-theme row dictionaries. A separate namespace from the official
 * 'settings.theme' pair: this plugin owns its own cubes' copy.
 */
export const zh = {
  'tech-theme.title': '科技主题',
  'tech-theme.mocha': '栖木',
  'tech-theme.nebula': '星云',
  'tech-theme.void': '冥夜',
  'tech-theme.jade': '银曜',
  'tech-theme.solar': '灼日',
  'tech-theme.parchment': '缃素',
} satisfies Record<string, string>

/** English dictionary checked against the Chinese key set. */
export const en = {
  'tech-theme.title': 'Tech themes',
  'tech-theme.mocha': 'Mocha',
  'tech-theme.nebula': 'Nebula',
  'tech-theme.void': 'Void',
  'tech-theme.jade': 'Argent',
  'tech-theme.solar': 'Solar',
  'tech-theme.parchment': 'Parchment',
} satisfies Record<TechThemeKey, string>

/** Copy keys shared by both dictionaries. */
export type TechThemeKey = keyof typeof zh
