/**
 * Tech-theme row dictionaries. A separate namespace from the official
 * 'settings.theme' pair: this plugin owns its own cubes' copy.
 */
export const zh = {
  'tech-theme.title': '科技主题',
  'tech-theme.sequoia': '液态',
  'tech-theme.sonoma': '曜黑',
  'tech-theme.void': '冥夜',
  'tech-theme.jade': '银曜',
  'tech-theme.solar': '灼日',
  'tech-theme.parchment': '缃素',
  'sidebar-font.title': '侧边栏字号',
  'sidebar-font.description': '仅影响两侧边栏。默认比对话区小一档，避免导航与正文抢视觉重量',
  'sidebar-font.unit': 'px',
  'sidebar-font.increase': '增大侧边栏字号',
  'sidebar-font.decrease': '减小侧边栏字号',
} satisfies Record<string, string>

/** English dictionary checked against the Chinese key set. */
export const en = {
  'tech-theme.title': 'Tech themes',
  'tech-theme.sequoia': 'Liquid',
  'tech-theme.sonoma': 'Obsidian',
  'tech-theme.void': 'Void',
  'tech-theme.jade': 'Argent',
  'tech-theme.solar': 'Solar',
  'tech-theme.parchment': 'Parchment',
  'sidebar-font.title': 'Sidebar font size',
  'sidebar-font.description': 'Affects both sidebars only. Sits one step below the chat area so navigation never competes with the content',
  'sidebar-font.unit': 'px',
  'sidebar-font.increase': 'Increase sidebar font size',
  'sidebar-font.decrease': 'Decrease sidebar font size',
} satisfies Record<TechThemeKey, string>

/** Copy keys shared by both dictionaries. */
export type TechThemeKey = keyof typeof zh
