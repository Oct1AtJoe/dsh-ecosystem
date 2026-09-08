/**
 * Turn-scoped produced-file Definition and readers. Client-only and
 * model-free: the vocabulary is the mutation tools' own follow-along
 * `arguments` (write/edit/str_replace_editor), never the closing prose.
 * Alongside the turn's produced paths, each Turn publishes two change-history
 * maps:
 * - `history` — conversation-cumulative (chained across Turns), drives
 *   the chip badge's `+N -M` totals.
 * - `turnHunks` — this Turn only (fresh each start), drives the
 *   expandable diff panel so a collapsed turn never shows accumulated
 *   changes from earlier Turns.
 *
 * Applied hunks come from the tool/result `meta`: first-party mutation tools
 * attach their result-time contextual diff as an opaque JSON payload on the
 * result event (`dsh-tool-fs` publishes `{ diffs: FileDiff[] }`). The payload
 * is tool-private, so this module narrows it defensively — malformed or
 * absent metadata yields no hunks (the path still lists; only the badge and
 * the expandable change stay silent).
 */
import { isAppendSurfaceEvent } from '@deepseek-ai/dsh-session/surface';
import { diffLines } from "./DiffBlock.js";
/**
 * Extract the path from a supported first-party mutation call. Session
 * `tool/call` events are root calls; Code Dispatch children do not enter this
 * Definition independently.
 * @param name - wire tool name.
 * @param argsRaw - model-produced JSON arguments.
 * @returns the mutation path, or null when the call is not a supported mutation.
 */
function mutationPath(name, argsRaw) {
    let args;
    try {
        args = JSON.parse(argsRaw);
    }
    catch {
        return null;
    }
    if (!isRecord(args))
        return null;
    switch (name) {
        case 'write':
            return typeof args.content === 'string' ? pathValue(args.file_path) : null;
        case 'edit':
            return validEditArgs(args) ? pathValue(args.file_path) : null;
        case 'str_replace_editor':
            return editorMutationPath(args);
        default:
            return null;
    }
}
/** Validate the fields that an `edit` execution requires. */
function validEditArgs(args) {
    return typeof args.old_string === 'string'
        && args.old_string.length > 0
        && typeof args.new_string === 'string'
        && args.old_string !== args.new_string
        && (args.replace_all === undefined || typeof args.replace_all === 'boolean');
}
/** Extract a path only from a complete mutating editor command. */
function editorMutationPath(args) {
    const path = pathValue(args.path);
    if (path === null)
        return null;
    switch (args.command) {
        case 'create':
            return typeof args.file_text === 'string' ? path : null;
        case 'str_replace':
            return typeof args.old_str === 'string'
                && args.old_str.length > 0
                && (args.new_str === undefined || typeof args.new_str === 'string')
                ? path
                : null;
        case 'insert':
            return typeof args.insert_line === 'number'
                && Number.isInteger(args.insert_line)
                && args.insert_line >= 0
                && typeof args.new_str === 'string'
                ? path
                : null;
        default:
            return null;
    }
}
/** A non-blank path preserves the exact spelling supplied to the tool. */
function pathValue(value) {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
}
/** Narrow parsed JSON to an argument object. */
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/**
 * Argument-derived applied-change hunks for a recognized mutation call:
 * the model's old/new text is the change itself (write's whole content is a
 * new-file/overwrite hunk; edit and str_replace_editor replace old with new).
 * Mirror of the tools' call-time diff card — no result metadata involved,
 * because tool/result events never persist it.
 */
function mutationHunks(name, argsRaw) {
    let args;
    try {
        args = JSON.parse(argsRaw);
    }
    catch {
        return [];
    }
    if (!isRecord(args))
        return [];
    switch (name) {
        case 'write':
            return typeof args.content === 'string' && args.content.length > 0
                ? [{ oldText: null, newText: args.content }]
                : [];
        case 'edit':
            return typeof args.old_string === 'string'
                && typeof args.new_string === 'string'
                ? [{ oldText: args.old_string, newText: args.new_string }]
                : [];
        case 'str_replace_editor': {
            const view = args.view;
            if (view === 'create' && typeof args.new_str === 'string' && args.new_str.length > 0) {
                return [{ oldText: null, newText: args.new_str }];
            }
            if (view === 'str_replace'
                && typeof args.old_str === 'string' && typeof args.new_str === 'string') {
                return [{ oldText: args.old_str, newText: args.new_str }];
            }
            if (view === 'insert' && typeof args.new_str === 'string' && args.new_str.length > 0) {
                return [{ oldText: null, newText: args.new_str }];
            }
            return [];
        }
        default:
            return [];
    }
}
/**
 * Files produced by one Turn data value.
 *
 * The source is the arguments of successful `write`, `edit`, and mutating
 * `str_replace_editor` calls, not the closing prose: a produced file must be
 * listed whether or not the model remembered to name it. A mutation is
 * recognized by tool name — the first-party mutation vocabulary — so a new
 * mutation tool joins by declaring what it does. Reads contribute nothing
 * (looking at a file does not produce it), and neither do deletes (there is
 * nothing left to open) or failed calls. Paths keep first-seen order and
 * appear once, so a file written and then edited in the same turn is one
 * entry.
 *
 * The Conversation Location index owns turn membership before this function
 * runs, so paths cannot spill across turns and this derivation does not infer
 * boundaries from neighboring presentation Nodes.
 * @param data - engine-published Deliverables data for one Turn.
 * @param seq - closing Assistant seq; later Tool settlements are excluded.
 * @returns Produced paths in first-seen order; empty when the turn wrote nothing.
 */
export function producedForClosing(data, seq = Number.POSITIVE_INFINITY) {
    if (data === undefined)
        return [];
    const paths = [];
    const seen = new Set();
    for (const produced of data.produced) {
        if (produced.seq > seq || seen.has(produced.path))
            continue;
        seen.add(produced.path);
        paths.push(produced.path);
    }
    return paths;
}
/**
 * Claim the turn-tail chain only when its closing turn produced files.
 * @param owner - Turn-tail owner currency for the closing assistant.
 * @returns Produced matches (path plus conversation history) as the component's
 * input, or null to decline before mount.
 */
export function selectProducedFiles(owner) {
    const data = owner.turn.data.get('deliverables');
    const paths = producedForClosing(data, owner.seq);
    if (paths.length === 0)
        return null;
    const history = data?.history;
    const turnHunks = data?.turnHunks;
    return paths.map(path => ({
        path,
        // Turn-scoped hunks for the expandable diff panel.
        hunks: turnHunks?.get(path) ?? [],
        // Conversation-cumulative hunks for the chip badge.
        totalHunks: history?.get(path) ?? [],
    }));
}
/**
 * Strip common prefix/suffix content lines from oldText and newText so only
 * the actual changes (removed/added lines) remain. Context lines from the
 * tool's structured patch fall away, and a `str_replace_editor`'s raw
 * old_str/new_str that share nothing are kept whole.
 * @param oldText - the before side, or null for a new file.
 * @param newText - the after side.
 * @returns oldText/newText with context stripped away.
 */
export function stripContext(oldText, newText) {
    if (oldText === null)
        return { oldText: null, newText };
    const oldLines = sideLinesRaw(oldText);
    const newLines = sideLinesRaw(newText);
    let start = 0;
    while (start < oldLines.length && start < newLines.length
        && oldLines[start] === newLines[start])
        start++;
    let oldEnd = oldLines.length;
    let newEnd = newLines.length;
    while (oldEnd > start && newEnd > start
        && oldLines[oldEnd - 1] === newLines[newEnd - 1]) {
        oldEnd--;
        newEnd--;
    }
    return {
        oldText: oldEnd > start ? oldLines.slice(start, oldEnd).join('\n') : null,
        newText: newLines.slice(start, newEnd).join('\n'),
    };
}
/** Split text into lines (same terminator rule as contentLines). */
function sideLinesRaw(text) {
    if (text === '')
        return [];
    const body = text.endsWith('\n') ? text.slice(0, -1) : text;
    return body.split('\n');
}
/**
 * Added/removed line totals for one path's conversation history, with the
 * same counting the diff primitive draws: each hunk's sides pair through the
 * common-prefix/suffix trim, so unchanged lines count on neither side.
 * @param hunks - the path's accumulated applied hunks.
 * @returns the `+added -removed` totals the chip badge shows.
 */
export function diffStats(hunks) {
    let added = 0;
    let removed = 0;
    for (const hunk of hunks) {
        const change = diffLines(hunk.oldText, hunk.newText);
        added += change.added.length;
        removed += change.removed.length;
    }
    return { added, removed };
}
/** Turn-local successful mutation accumulator; it publishes no view Node. */
export const deliverablesDefinition = {
    kind: 'deliverables',
    match: (event) => {
        if (event.type === 'turn/start')
            return { id: String(event.data.turn), role: 'start' };
        if (event.type === 'tool/call')
            return { id: String(event.data.turn), role: 'update' };
        if (event.type === 'tool/result' && isAppendSurfaceEvent(event)) {
            return { id: String(event.data.turn), role: 'update' };
        }
        return null;
    },
    start: (_context, match, reader) => {
        if (match.event.type !== 'turn/start')
            throw new Error('deliverables start requires turn/start');
        const previous = reader.previous('deliverables');
        return {
            turn: match.event.data.turn,
            calls: new Map(),
            produced: [],
            // Chain the previous Turn's conversation history for the cumulative
            // badge; a fresh conversation or compacted window drops it to empty.
            history: new Map(previous?.state.history ?? []),
            // Turn-scoped hunks start fresh every Turn — the expandable diff
            // panel never shows accumulated changes from earlier Turns.
            turnHunks: new Map(),
        };
    },
    update: (context, match) => {
        if (match.event.type === 'tool/call') {
            const calls = new Map(context.state.calls);
            calls.set(String(match.event.data.callId), {
                path: mutationPath(match.event.data.name, match.event.data.arguments),
                hunks: mutationHunks(match.event.data.name, match.event.data.arguments),
            });
            return { ...context.state, calls };
        }
        if (match.event.type !== 'tool/result')
            return context.state;
        const result = match.event.data.message.content[0];
        if (result.isError === true)
            return context.state;
        const callId = String(match.event.data.message.source.callId);
        const call = context.state.calls.get(callId);
        const path = call?.path;
        // A result whose call named no mutation path contributes nothing.
        if (path === undefined || path === null)
            return context.state;
        const additions = [{ seq: match.event.seq, path }];
        const hunks = call?.hunks ?? [];
        const history = new Map(context.state.history);
        const turnHunks = new Map(context.state.turnHunks);
        if (hunks.length > 0) {
            history.set(path, [...(history.get(path) ?? []), ...hunks]);
            turnHunks.set(path, [...(turnHunks.get(path) ?? []), ...hunks]);
        }
        return {
            ...context.state,
            produced: [...context.state.produced, ...additions],
            history,
            turnHunks,
        };
    },
    buildLocationData: (context, scope) => scope !== 'turn' || context.state === undefined
        ? null
        : {
            kind: 'turn',
            turn: context.state.turn,
            key: 'deliverables',
            value: { produced: context.state.produced, history: context.state.history, turnHunks: context.state.turnHunks },
        },
};
/**
 * Trailing path segment, the part that identifies the file at a glance.
 * @param path - Slash- or backslash-separated path.
 * @returns The final segment, or the whole string when separator-free.
 */
export function basename(path) {
    const at = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    return at === -1 ? path : path.slice(at + 1);
}
/**
 * Leading path segments, the location that sets a deep path apart.
 * @param path - Slash- or backslash-separated path.
 * @returns The segments before the final one, or the empty string when separator-free.
 */
export function dirname(path) {
    const at = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    return at === -1 ? '' : path.slice(0, at);
}
/**
 * File-mention vocabulary over one turn's produced paths, for the closing
 * message's prose: an inline-code token opens the file it names. A token
 * resolves by exact path, or by being exactly the basename of exactly one
 * produced path — a basename two paths share stays inert rather than
 * guessing, so a mention link can never open the wrong file or 404.
 * @param paths - The turn's produced paths (tool order, already deduped).
 * @param openFile - The chat view's file opener.
 * @param label - Localizes the accessible open-label for a resolved path.
 * @returns The resolver MarkdownText consumes; the full path rides `title`,
 * the same disambiguator the row's chips carry.
 */
export function producedFileMentions(paths, openFile, label) {
    return {
        resolve(value) {
            const path = paths.includes(value) ? value : onlyPathWithBasename(paths, value);
            if (path === undefined)
                return undefined;
            return { open: () => { openFile(path); }, label: label(path), title: path };
        },
    };
}
/** The single produced path whose basename is exactly `value`, else undefined. */
function onlyPathWithBasename(paths, value) {
    const matches = paths.filter(path => basename(path) === value);
    return matches.length === 1 ? matches[0] : undefined;
}
//# sourceMappingURL=turn-deliverables.js.map