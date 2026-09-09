import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// DiffBlock: the inline-diff surface for a file mutation (write/edit) — a copy
// control over one or more per-file hunks, each a bold path header followed by
// the changed rows (`-`, error color; `+`, success color), with a dim
// `└ +A -R · N file(s)` footer. The two sides compare through a
// common-prefix/suffix trim, so unchanged lines pair away and a pure
// append shows as additions only. Unlike the TUI's exact changed-row
// comparison this is not a full LCS — an interior edit shows its whole
// trimmed span. Both front ends share the line-terminator rule and
// distinct-path file count. Output never soft-wraps — an aligned source line
// keeps its indentation and scrolls horizontally instead of folding. Colors
// resolve through --dsw-* tokens; geometry mirrors CodeBlock.
//
// Local fork: carries the `showPathHeaders`/`showFooter` chrome toggles the
// ChangePanel needs (its title bar owns the path and the totals); the official
// ui-primitives DiffBlock stays upstream. writeClipboard comes from the
// official package entry.
/* jscpd:ignore-start */
import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { writeClipboard } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './DiffBlock.module.css';
/**
 * Output lines shown before the height cap collapses the middle. Matches
 * {@link DEFAULT_TERMINAL_MAX_LINES} so a diff card and a terminal card cut a
 * long body at the same place.
 */
export const DEFAULT_DIFF_MAX_LINES = 16;
/** Local exhaustiveness helper — this package does not depend on `dsh-llm`. */
/* v8 ignore next 3 -- closed-union backstop; only reached if a row kind is forged */
function assertNever(value) {
    throw new Error(`unreachable diff row kind: ${String(value)}`);
}
/** The dim class per row kind (path/gap chrome vs the diff's own +/- colors). */
const ROW_CLASS = {
    path: css.path,
    del: css.del,
    add: css.add,
    gap: css.gap,
};
/**
 * Flatten the hunks into the body's rows plus the footer counts. A path header
 * opens each new file; a same-file second hunk (a scattered edit) opens with a
 * `⋯` gap instead of repeating the path. In headerless mode (ChangePanel),
 * same-file second hunks also separate with a `⋯` gap so non-adjacent edits
 * never appear contiguous. Each hunk's sides compare through {@link diffLines},
 * which interleaves -/+ at change sites and inserts `⋯` gaps across untouched lines.
 * @param diffs - the hunks to render.
 * @param showPathHeaders - whether path and gap rows join the body.
 * @returns the body rows, the +/- totals, and the distinct-file count.
 */
function buildRows(diffs, showPathHeaders) {
    const rows = [];
    const paths = new Set();
    let added = 0;
    let removed = 0;
    let prevPath;
    for (let i = 0; i < diffs.length; i++) {
        const diff = diffs[i];
        paths.add(diff.path);
        if (showPathHeaders) {
            if (diff.path !== prevPath) {
                rows.push({ kind: 'path', text: diff.path });
            }
            else if (rows.length > 0 && rows[rows.length - 1]?.kind !== 'gap') {
                rows.push({ kind: 'gap', text: '⋯' });
            }
        }
        else if (i > 0 && rows.length > 0 && rows[rows.length - 1]?.kind !== 'gap') {
            rows.push({ kind: 'gap', text: '⋯' });
        }
        prevPath = diff.path;
        const change = diffLines(diff.oldText, diff.newText);
        for (const row of change.rows) {
            if (row.kind === 'gap' && rows.length > 0 && rows[rows.length - 1]?.kind === 'gap') {
                continue;
            }
            rows.push(row);
        }
        added += change.added.length;
        removed += change.removed.length;
    }
    while (rows.length > 0 && rows[rows.length - 1]?.kind === 'gap') {
        rows.pop();
    }
    return { rows, added, removed, files: paths.size };
}
/**
 * Normalize a line for similarity matching: strip trailing punctuation (comma, semicolon)
 * and trailing whitespace, keeping context lines from falsely reporting as additions/deletions.
 */
function normalizeLine(line) {
    const stripped = line.trimEnd().replace(/[,;]+$/, '').trimEnd();
    return stripped === '' ? line.trim() : stripped;
}
function matchWeight(a, b, allowNormalized) {
    if (a === b)
        return 2;
    if (allowNormalized) {
        const na = normalizeLine(a);
        const nb = normalizeLine(b);
        if (na !== '' && na === nb)
            return 1;
    }
    return 0;
}
function computeLcsDiff(oldMid, newMid, allowNormalized) {
    const m = oldMid.length;
    const n = newMid.length;
    // Defensive guard against pathological hunk sizes
    if (m * n > 250_000) {
        const rows = [
            ...oldMid.map(text => ({ kind: 'del', text })),
            ...newMid.map(text => ({ kind: 'add', text })),
        ];
        return { removed: [...oldMid], added: [...newMid], rows };
    }
    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const w = matchWeight(oldMid[i - 1], newMid[j - 1], allowNormalized);
            if (w > 0) {
                dp[i][j] = dp[i - 1][j - 1] + w;
            }
            else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    const ops = [];
    let i = m;
    let j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0) {
            const w = matchWeight(oldMid[i - 1], newMid[j - 1], allowNormalized);
            if (w > 0 && dp[i][j] === dp[i - 1][j - 1] + w) {
                ops.unshift({ type: 'match', oldText: oldMid[i - 1], newText: newMid[j - 1] });
                i--;
                j--;
                continue;
            }
        }
        if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            ops.unshift({ type: 'add', text: newMid[j - 1] });
            j--;
        }
        else if (i > 0) {
            ops.unshift({ type: 'del', text: oldMid[i - 1] });
            i--;
        }
    }
    const rows = [];
    const removed = [];
    const added = [];
    let currentBlockDel = [];
    let currentBlockAdd = [];
    const flushBlock = () => {
        if (currentBlockDel.length === 0 && currentBlockAdd.length === 0)
            return;
        if (rows.length > 0 && rows[rows.length - 1]?.kind !== 'gap') {
            rows.push({ kind: 'gap', text: '⋯' });
        }
        for (const text of currentBlockDel) {
            rows.push({ kind: 'del', text });
            removed.push(text);
        }
        for (const text of currentBlockAdd) {
            rows.push({ kind: 'add', text });
            added.push(text);
        }
        currentBlockDel = [];
        currentBlockAdd = [];
    };
    for (const op of ops) {
        if (op.type === 'match') {
            flushBlock();
        }
        else if (op.type === 'del') {
            currentBlockDel.push(op.text);
        }
        else if (op.type === 'add') {
            currentBlockAdd.push(op.text);
        }
    }
    flushBlock();
    return { removed, added, rows };
}
/**
 * Pair the two sides of one hunk into its changed lines: common-prefix and
 * common-suffix trim over the content lines, followed by LCS alignment over
 * the middle. Tolerates trailing punctuation / comma shifts on boundary context
 * lines to eliminate phantom deletion/re-addition pairs. Disjoint change sites
 * interleave del/add blocks separated by `⋯` gaps. Identical sides yield zero
 * rows — a no-op write draws nothing for its hunk. `null` oldText (a new file)
 * puts every new line on the added side.
 * @param oldText - prior content, or `null` for a new file.
 * @param newText - content after the change.
 * @returns the removed and added content lines along with the structured rows.
 */
export function diffLines(oldText, newText) {
    if (oldText === null) {
        const added = contentLines(newText);
        return {
            removed: [],
            added,
            rows: added.map(text => ({ kind: 'add', text })),
        };
    }
    const oldSide = contentLines(oldText);
    const newSide = contentLines(newText);
    let start = 0;
    const shortest = Math.min(oldSide.length, newSide.length);
    while (start < shortest && oldSide[start] === newSide[start])
        start++;
    let endOld = oldSide.length;
    let endNew = newSide.length;
    while (endOld > start && endNew > start && oldSide[endOld - 1] === newSide[endNew - 1]) {
        endOld--;
        endNew--;
    }
    const oldMid = oldSide.slice(start, endOld);
    const newMid = newSide.slice(start, endNew);
    if (oldMid.length === 0 && newMid.length === 0)
        return { removed: [], added: [], rows: [] };
    if (oldMid.length === 0) {
        const added = newMid;
        return {
            removed: [],
            added,
            rows: added.map(text => ({ kind: 'add', text })),
        };
    }
    if (newMid.length === 0) {
        const removed = oldMid;
        return {
            removed,
            added: [],
            rows: removed.map(text => ({ kind: 'del', text })),
        };
    }
    // 1. Try LCS with normalized punctuation matching (tolerates context comma additions/removals)
    const result = computeLcsDiff(oldMid, newMid, true);
    // 2. Fall back to strict exact matching if normalized matching swallowed the only change
    if (result.removed.length === 0 && result.added.length === 0 && (oldMid.length > 0 || newMid.length > 0)) {
        return computeLcsDiff(oldMid, newMid, false);
    }
    return result;
}
/**
 * Split a side's text into its content lines. Empty text is zero lines (a full
 * deletion's `newText` or a create's absent `oldText` side draws nothing), and a
 * single trailing newline is a line terminator rather than an extra empty line —
 * the same terminator rule TerminalBlock applies to command output. An interior
 * blank line (a genuine `\n\n`) survives.
 * @param text - the removed or added side's text.
 * @returns the content lines, without the terminating newline.
 */
function contentLines(text) {
    if (text === '')
        return [];
    const body = text.endsWith('\n') ? text.slice(0, -1) : text;
    return body.split('\n');
}
/**
 * The diff text a reader copies: each row's `-`/`+`/path/gap prefix and its
 * content, exactly what the card shows. The removed and added blocks are the
 * change; the path headers keep a multi-file copy attributable.
 * @param rows - the flattened body rows.
 * @returns the diff as plain text.
 */
function copyText(rows) {
    return rows.map((row) => {
        switch (row.kind) {
            case 'del': return `- ${row.text}`;
            case 'add': return `+ ${row.text}`;
            case 'path': return row.text;
            case 'gap': return row.text;
            /* v8 ignore next -- closed-union backstop; only reached if a row kind is forged */
            default: return assertNever(row.kind);
        }
    }).join('\n');
}
/**
 * Render a file mutation as an inline diff surface.
 * @param props - see {@link DiffBlockProps}.
 * @returns the diff block element.
 */
export function DiffBlock({ diffs, maxLines = DEFAULT_DIFF_MAX_LINES, className, showPathHeaders = true, showFooter = true, }) {
    const { rows, added, removed, files } = useMemo(() => buildRows(diffs, showPathHeaders), [diffs, showPathHeaders]);
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const onCopy = useCallback(() => {
        if (copied)
            return;
        void writeClipboard(copyText(rows)).then((ok) => {
            if (!ok)
                return;
            setCopied(true);
            window.setTimeout(() => { setCopied(false); }, 1000);
        });
    }, [copied, rows]);
    const onToggle = useCallback(() => { setExpanded(value => !value); }, []);
    if (rows.length === 0)
        return null;
    const hidden = rows.length - maxLines;
    const capped = hidden > 0 && !expanded;
    // Same split arithmetic as TerminalBlock and the TUI transcript's collapsed
    // card, so a body's head and tail slices agree across the front ends.
    const headLines = Math.ceil(maxLines / 2);
    const tailLines = maxLines - headLines;
    const head = capped ? rows.slice(0, headLines) : rows;
    const tail = capped ? rows.slice(rows.length - tailLines) : [];
    return (_jsxs("div", { className: clsx(css.block, className), "data-diff": "", children: [_jsx("button", { type: "button", className: css.copyButton, onClick: onCopy, children: copied ? '复制成功' : '复制' }), _jsxs("div", { className: css.body, children: [head.map((row, index) => (_jsx("div", { className: clsx(css.line, ROW_CLASS[row.kind]), children: row.text }, index))), hidden > 0 && (_jsx("button", { type: "button", className: css.expand, "aria-expanded": expanded, "aria-label": expanded ? '收起差异' : `展开其余 ${hidden} 行差异`, onClick: onToggle, children: expanded ? '收起' : `… 其余 ${hidden} 行` })), tail.map((row, index) => (_jsx("div", { className: clsx(css.line, ROW_CLASS[row.kind]), children: row.text }, index)))] }), showFooter && (_jsxs("div", { className: css.footer, children: ["\u2514 +", added, " -", removed, " \u00B7 ", files, " file", files === 1 ? '' : 's'] }))] }));
}
//# sourceMappingURL=DiffBlock.js.map