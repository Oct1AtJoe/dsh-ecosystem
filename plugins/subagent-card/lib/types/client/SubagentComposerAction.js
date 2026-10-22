import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Subagent composer action: the tool-row button next to the send button
 * (official `conversation.input.right` list seat). Renders the robot avatar
 * with a live running-subagent count badge; clicking opens the sidebar's
 * subagent tab through the dsh-better-sidebar service (`ctx.betterSidebar`),
 * which owns the subagent topology view. Without that service (plugin not
 * mounted) the button renders but the click is a no-op. Reads only the
 * session-list snapshot (zero RPC), same as the official header lineage.
 */
import { useMemo } from 'react';
import clsx from 'clsx';
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import { indexSubagentDescendants } from "./subagent-lineage.js";
import css from './SubagentComposerAction.module.css';
const NO_DESCENDANTS = { count: 0, runningCount: 0 };
/** 16px robot head: the subagent button avatar. */
function RobotIcon({ className }) {
    return (_jsxs("svg", { viewBox: "0 0 16 16", width: "16", height: "16", className: className, "aria-hidden": "true", children: [_jsx("path", { d: "M8 1.4c.55 0 1 .45 1 1v1.05c1.7.35 2.95 1.8 3.08 3.55h.42c.83 0 1.5.67 1.5 1.5v3.5c0 .83-.67 1.5-1.5 1.5H3.5c-.83 0-1.5-.67-1.5-1.5V8.5c0-.83.67-1.5 1.5-1.5h.42c.13-1.75 1.38-3.2 3.08-3.55V2.4c0-.55.45-1 1-1Z", fill: "none", stroke: "currentColor", strokeWidth: "1.1", strokeLinejoin: "round" }), _jsx("circle", { cx: "5.7", cy: "9.1", r: "0.9", fill: "currentColor" }), _jsx("circle", { cx: "10.3", cy: "9.1", r: "0.9", fill: "currentColor" }), _jsx("path", { d: "M5.4 11.6h5.2", stroke: "currentColor", strokeWidth: "1.1", strokeLinecap: "round" })] }));
}
/**
 * Render the subagent affordance in the composer tool row.
 * @param props - session standard kit, the injected sidebar-tab opener, and
 * the plugin's localized copy.
 * @returns the button.
 */
export function SubagentComposerAction({ sessionId, useSessions, openSubagentTab, t }) {
    const byId = useSessions(state => state.byId);
    const descendants = useMemo(() => indexSubagentDescendants(byId).get(sessionId) ?? NO_DESCENDANTS, [sessionId, byId]);
    const running = descendants.runningCount;
    const label = running > 0
        ? t(running === 1 ? 'button.running.one' : 'button.running.other', { count: running })
        : t('button.open');
    return (_jsx(Tooltip, { label: label, side: "top", delayMs: 500, children: _jsxs("button", { type: "button", className: clsx(css.button, running > 0 && css.live), "aria-label": label, onClick: () => openSubagentTab(), children: [_jsx("span", { className: css.avatar, children: _jsx(RobotIcon, {}) }), running > 0 && _jsx("span", { className: css.badge, children: running })] }) }));
}
//# sourceMappingURL=SubagentComposerAction.js.map