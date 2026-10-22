/** `subagent-composer` namespace dictionaries. */

/** Dictionary namespace owned by this plugin (distinct from official ui-subagent's `subagent`). */
export const NS = 'subagent-composer'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'button.open': '查看子智能体工作过程',
  'button.running.one': '{count} 个子智能体运行中，点击查看',
  'button.running.other': '{count} 个子智能体运行中，点击查看',
} as const

/** English dictionary, key-identical to the Chinese source of truth. */
export const en: Record<SubagentComposerKey, string> = {
  'button.open': 'View subagent work',
  'button.running.one': '{count} subagent running, click to view',
  'button.running.other': '{count} subagents running, click to view',
}

/** Key domain of the `subagent-composer` namespace (zh is the source of truth). */
export type SubagentComposerKey = keyof typeof zh
