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
  'mascot.title': '输入框挂件',
  'mascot.description': '在输入框上方显示灵动像素小伙伴挂件',
  'rightbar-width.title': '右侧边栏初始百分比宽度',
  'rightbar-width.description': '右侧栏首次展开时的默认宽度占窗口宽度的百分比',
  'rightbar-width.unit': '%',
  'rightbar-width.increase': '增大右侧边栏宽度百分比',
  'rightbar-width.decrease': '减小右侧边栏宽度百分比',
  'sidebar-font.title': '侧边栏字号',
  'sidebar-font.description': '仅影响两侧边栏。默认比对话区小一档，避免导航与正文抢视觉重量',
  'sidebar-font.unit': 'px',
  'sidebar-font.increase': '增大侧边栏字号',
  'sidebar-font.decrease': '减小侧边栏字号',
  'home-layout.title': '新会话版面',
  'home-layout.description': '工作室版面在中央展示模型用量面板，输入框贴底；经典版面保持居中',
  'home-layout.classic': '经典',
  'home-layout.studio': '工作室',
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
  'mascot.title': 'Composer Pet',
  'mascot.description': 'Show a pixel companion above the composer',
  'rightbar-width.title': 'Right sidebar initial width',
  'rightbar-width.description': 'Initial width of the right sidebar as a percentage of window width',
  'rightbar-width.unit': '%',
  'rightbar-width.increase': 'Increase right sidebar width ratio',
  'rightbar-width.decrease': 'Decrease right sidebar width ratio',
  'sidebar-font.title': 'Sidebar font size',
  'sidebar-font.description': 'Affects both sidebars only. Sits one step below the chat area so navigation never competes with the content',
  'sidebar-font.unit': 'px',
  'sidebar-font.increase': 'Increase sidebar font size',
  'sidebar-font.decrease': 'Decrease sidebar font size',
  'home-layout.title': 'New conversation layout',
  'home-layout.description': 'Studio layout displays the usage panel in center with docked composer; Classic keeps centered',
  'home-layout.classic': 'Classic',
  'home-layout.studio': 'Studio',
} satisfies Record<TechThemeKey, string>

/** Copy keys shared by both dictionaries. */
export type TechThemeKey = keyof typeof zh
