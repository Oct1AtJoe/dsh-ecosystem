import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from './locales.ts';
/** Injected business face of the composer subagent action. */
export interface SubagentComposerInjected {
    /** Open the sidebar's subagent tab (dsh-better-sidebar `openTab`). */
    openSubagentTab: () => void;
}
/** Full props for the composer subagent action entry. */
export type SubagentComposerActionProps = PropsRuntime<'conversation.input.right'> & SubagentComposerInjected & PropsLocale<typeof NS>;
/**
 * Render the subagent affordance in the composer tool row.
 * @param props - session standard kit, the injected sidebar-tab opener, and
 * the plugin's localized copy.
 * @returns the button.
 */
export declare function SubagentComposerAction({ sessionId, useSessions, openSubagentTab, t }: SubagentComposerActionProps): import("react").JSX.Element;
//# sourceMappingURL=SubagentComposerAction.d.ts.map