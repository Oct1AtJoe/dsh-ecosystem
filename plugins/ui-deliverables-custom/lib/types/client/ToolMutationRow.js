import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { DisclosureRow, IconEditOutline16, IconInspectOutline12, StateDot, } from '@deepseek-ai/dsh-client-ui-primitives';
import { DiffBlock } from "./DiffBlock.js";
import { diffStats } from "./turn-deliverables.js";
import css from './ToolMutationRow.module.css';
function leadingFor(state, icon) {
    switch (state) {
        case 'error': return _jsx(StateDot, { state: "error" });
        case 'stopped': return _jsx(StateDot, { state: "warning" });
        default: return icon;
    }
}
function relativizePath(path, cwd) {
    if (!cwd)
        return path;
    const normalizedCwd = cwd.replace(/\\/g, '/').replace(/\/$/, '');
    const normalizedPath = path.replace(/\\/g, '/');
    if (normalizedPath.startsWith(`${normalizedCwd}/`)) {
        return normalizedPath.slice(normalizedCwd.length + 1);
    }
    return path;
}
function firstLine(text) {
    const newline = text.indexOf('\n');
    return newline === -1 ? text : text.slice(0, newline);
}
export function ToolMutationRow({ toolName, block, cwd, openFile, inspect, t, }) {
    const [expanded, setExpanded] = useState(false);
    const done = block.kind !== undefined;
    const isInterrupted = done && block.error?.code === 'interrupted';
    const isError = done && Boolean(block.isError);
    const state = !done
        ? 'running'
        : isInterrupted
            ? 'stopped'
            : isError
                ? 'error'
                : 'ok';
    const argsRaw = (done ? block.call?.argsRaw : block.argsRaw) ?? '';
    const args = useMemo(() => {
        try {
            return JSON.parse(argsRaw) ?? {};
        }
        catch {
            return {};
        }
    }, [argsRaw]);
    const filePath = typeof args.file_path === 'string' && args.file_path.trim().length > 0
        ? args.file_path
        : undefined;
    const outputText = done ? (block.resultText ?? null) : null;
    const errorSummary = isError && outputText !== null ? firstLine(outputText) : null;
    // Applied diffs or fallback to tool arguments
    const diffs = useMemo(() => {
        if (isError)
            return [];
        if (done) {
            const metaDiffs = block.meta?.diffs;
            if (Array.isArray(metaDiffs) && metaDiffs.length > 0) {
                return metaDiffs;
            }
        }
        if (!filePath)
            return [];
        if (toolName === 'write' && typeof args.content === 'string') {
            return [{ path: filePath, oldText: null, newText: args.content }];
        }
        if (toolName === 'edit' && typeof args.old_string === 'string' && typeof args.new_string === 'string') {
            return [{ path: filePath, oldText: args.old_string, newText: args.new_string }];
        }
        return [];
    }, [done, isError, block, filePath, toolName, args]);
    // Compute accurate line stats using our LCS + punctuation tolerance algorithm
    const stats = useMemo(() => diffStats(diffs), [diffs]);
    const diffStat = useMemo(() => {
        if (stats.added === 0 && stats.removed === 0)
            return null;
        return `+${stats.added} -${stats.removed}`;
    }, [stats]);
    const summaryText = errorSummary ?? (filePath ? relativizePath(filePath, cwd) : block.callId);
    const title = t === undefined ? (toolName === 'write' ? '写入' : '编辑') : t(`tool.title.${toolName}`);
    const fileLink = filePath !== undefined && errorSummary === null;
    const expandable = (diffs.length > 0) || (outputText !== null);
    const open = expanded && expandable;
    const toggleExpand = () => {
        setExpanded(v => !v);
    };
    const handleOpenFile = (event) => {
        event.stopPropagation();
        if (filePath !== undefined)
            openFile(filePath);
    };
    const handleLinkKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ')
            event.stopPropagation();
    };
    return (_jsx("div", { className: css.root, "data-variant": toolName, "data-tool": toolName, "data-state": state, children: _jsx(DisclosureRow, { rowClassName: css.row, leadingClassName: css.leading, titleClassName: css.title, chevronClassName: css.chevron, icon: leadingFor(state, _jsx(IconEditOutline16, { size: 14 })), title: title, open: open, expandable: expandable, expandOnRowClick: true, keepContentWhenOpen: true, onToggle: toggleExpand, collapsedContent: (_jsxs(_Fragment, { children: [_jsx("span", { className: css.sep, "aria-hidden": true }), fileLink ? (_jsx("button", { type: "button", className: css.fileLink, onClick: handleOpenFile, onKeyDown: handleLinkKeyDown, title: filePath, children: summaryText })) : (_jsx("span", { className: clsx(css.summary, errorSummary !== null && css.errorSummary), children: summaryText })), diffStat !== null && (_jsx("span", { className: css.diffStat, children: diffStat }))] })), children: _jsxs("div", { className: css.bodyWrap, children: [isError && outputText !== null ? (_jsx("div", { className: css.errorBody, children: outputText })) : diffs.length > 0 ? (_jsx(DiffBlock, { diffs: diffs, maxLines: 8, showPathHeaders: false, showFooter: true, className: css.diffBody })) : null, inspect !== undefined && (_jsxs("button", { type: "button", className: css.inspectButton, onClick: inspect, children: [_jsx(IconInspectOutline12, { size: 12 }), _jsx("span", { children: t === undefined ? '查看' : t('row.inspect') })] }))] }) }) }));
}
//# sourceMappingURL=ToolMutationRow.js.map