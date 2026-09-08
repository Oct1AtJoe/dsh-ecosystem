/** `subagent-composer` namespace dictionaries. */
/** Dictionary namespace owned by this plugin (distinct from official ui-subagent's `subagent`). */
export declare const NS = "subagent-composer";
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    readonly 'button.open': "查看子智能体工作过程";
    readonly 'button.running.one': "{count} 个子智能体运行中，点击查看";
    readonly 'button.running.other': "{count} 个子智能体运行中，点击查看";
};
/** English dictionary, key-identical to the Chinese source of truth. */
export declare const en: Record<SubagentComposerKey, string>;
/** Key domain of the `subagent-composer` namespace (zh is the source of truth). */
export type SubagentComposerKey = keyof typeof zh;
//# sourceMappingURL=locales.d.ts.map