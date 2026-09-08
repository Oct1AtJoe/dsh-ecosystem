import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
// ProducedFiles: the produced-file row a finished turn ends with. The paths
// come pre-matched by the turn-tail chain from the mutation tools'
// follow-along locations, never from the closing prose. Clicking a chip's
// name goes through the same openFile the tool rows use — the Host's own
// opener, on the Host machine. The row wraps to multiple lines when chips
// overflow the available width, so all files remain visible without
// single-line truncation.
import { useEffect, useState } from 'react';
import { IconChevronDownOutline14, IconChevronUpOutline14 } from '@deepseek-ai/dsh-client-ui-primitives';
import { DiffBlock } from "./DiffBlock.js";
import { basename, diffStats, dirname } from "./turn-deliverables.js";
import css from './ProducedFiles.module.css';
/** Cap for produced-file chips. The row wraps to multiple lines, so this
 *  limit exists mainly to bound measurement and prevent pathological counts;
 *  30 covers all realistic single-turn file sets. */
const SHOWN_LIMIT = 30;
/**
 * Select the largest prefix whose measured chips and exact remainder fit.
 * @param available - usable width of the one-line file lane.
 * @param gap - computed flex gap between adjacent visible items.
 * @param chipWidths - measured widths for the candidate file chips.
 * @param moreWidthsByShown - exact localized remainder width for each shown count.
 * @returns Number of leading chips to render.
 */
export function fitProducedFiles(available, gap, chipWidths, moreWidthsByShown) {
    if (available <= 0)
        return chipWidths.length;
    const prefix = [0];
    let prefixWidth = 0;
    for (const width of chipWidths) {
        prefixWidth += width;
        prefix.push(prefixWidth);
    }
    let largestFit = 0;
    for (const [shown, width] of prefix.entries()) {
        const more = moreWidthsByShown[shown];
        const items = shown + (more === undefined ? 0 : 1);
        const needed = width + (more ?? 0) + Math.max(0, items - 1) * gap;
        if (needed <= available)
            largestFit = shown;
    }
    return largestFit;
}
function moreLabel(t, count) {
    return count === 1 ? t('produced.moreOne') : t('produced.more', { count: String(count) });
}
/** The `+A -R` badge of one chip's conversation totals. */
function Stats({ added, removed }) {
    return (_jsxs("span", { className: css.stats, children: [_jsxs("span", { className: css.added, children: ["+", added] }), _jsxs("span", { className: css.removed, children: ["-", removed] })] }));
}
/**
 * The expanded change below the row: one card, a title bar over the diff
 * primitive's body. The bar carries the path (name plus dimmed directory, both
 * ellipsized; like every path in this row it opens the file), the +/- totals,
 * and its own collapse control; the primitive's path headers and footer stay
 * off inside the panel.
 */
function ChangePanel({ match, openFile, t, close }) {
    const stats = diffStats(match.hunks);
    return (_jsxs("div", { className: css.diff, "data-produced-diff": true, children: [_jsxs("div", { className: css.diffHeader, children: [_jsxs("button", { type: "button", className: css.diffPath, title: match.path, "aria-label": t('produced.open', { name: match.path }), onClick: () => { openFile(match.path); }, children: [_jsx("span", { className: css.diffName, children: basename(match.path) }), dirname(match.path) !== '' && _jsx("span", { className: css.diffDir, children: dirname(match.path) })] }), _jsx(Stats, { added: stats.added, removed: stats.removed }), _jsx("button", { type: "button", className: css.diffCollapse, "aria-label": t('produced.collapsePanel'), onClick: close, children: _jsx(IconChevronUpOutline14, { size: 12 }) })] }), _jsx(DiffBlock, { diffs: match.hunks.map(hunk => ({ path: match.path, ...hunk })), showPathHeaders: false, showFooter: false, className: css.diffBody })] }));
}
/**
 * Render one turn's produced files as openable chips.
 * @param props - selector-matched paths, the chat view's file opener, and the locale seat.
 * @returns The produced-files row.
 */
export function ProducedFiles({ matched: paths, openFile, isLoopback, ensureWorkspacePathOpen, useWorkspacePathOpen, t, }) {
    useEffect(() => { ensureWorkspacePathOpen(); }, [ensureWorkspacePathOpen]);
    const hostCanOpenPath = useWorkspacePathOpen(available => available === true);
    const canOpenPath = isLoopback && hostCanOpenPath;
    const [expandedPath, setExpandedPath] = useState(null);
    const shown = paths.slice(0, SHOWN_LIMIT);
    const hidden = paths.length - shown.length;
    const expanded = paths.find(match => match.path === expandedPath) ?? null;
    // One chip: the name opens the file; the cumulative badge (totalHunks)
    // shows the conversation's total +/- for the file, and the chevron
    // (visible only when this turn has its own hunks) expands the turn's
    // change below the row.
    const chip = (match) => {
        const { path, hunks, totalHunks } = match;
        const stats = totalHunks.length === 0 ? null : diffStats(totalHunks);
        const open = expandedPath === path;
        return (_jsxs("span", { className: css.chip, children: [_jsx("button", { type: "button", className: css.file, 
                    // The full path is the disambiguator when two turns produce files
                    // that share a basename; the chip itself stays short.
                    title: path, "aria-label": t('produced.open', { name: path }), onClick: () => { openFile(path); }, children: basename(path) }), stats !== null && (_jsxs(_Fragment, { children: [_jsx(Stats, { added: stats.added, removed: stats.removed }), hunks.length > 0 && (_jsx("button", { type: "button", className: css.toggle, "aria-expanded": open, "aria-label": t(open ? 'produced.collapse' : 'produced.expand', { name: path }), onClick: () => { setExpandedPath(open ? null : path); }, children: open ? _jsx(IconChevronUpOutline14, { size: 12 }) : _jsx(IconChevronDownOutline14, { size: 12 }) }))] }))] }, path));
    };
    return (_jsxs("div", { className: css.root, children: [_jsx("span", { className: css.label, children: t('produced.label') }), _jsxs("div", { className: css.row, "data-produced-files-row": true, children: [shown.map(chip), hidden > 0 && _jsx("span", { className: css.more, children: moreLabel(t, hidden) })] }), expanded !== null && expanded.hunks.length > 0 && (_jsx(ChangePanel, { match: expanded, openFile: openFile, t: t, close: () => { setExpandedPath(null); } })), paths.length > 0 && canOpenPath && (_jsx("button", { type: "button", className: css.showFolder, onClick: () => { openFile('.'); }, children: t('produced.showInFolder') }))] }));
}
//# sourceMappingURL=ProducedFiles.js.map