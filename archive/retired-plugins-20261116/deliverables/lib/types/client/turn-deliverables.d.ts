import type { TurnTailOwnerProps } from '@deepseek-ai/dsh-client-ui-chat/client';
import type { ConversationNodeDefinition } from '@deepseek-ai/dsh-client-ui-conversation/client';
import type { MarkdownFileMentions } from '@deepseek-ai/dsh-client-ui-primitives';
interface ProducedPath {
    readonly seq: number;
    readonly path: string;
}
/** One applied change's content pair, in the primitive's `DiffHunk` shape minus the path. */
export interface ProducedHunk {
    readonly oldText: string | null;
    readonly newText: string;
}
/**
 * A recognized mutation call's target path and its argument-derived hunks.
 * rc.1 tool/result events do not persist the tool-private diff metadata, so
 * the applied-change hunks are derived from the call arguments themselves
 * (the model's old/new text), mirroring the tools' own call-time diff cards.
 */
interface CallMutation {
    readonly path: string | null;
    readonly hunks: readonly ProducedHunk[];
}
/** One produced path plus its conversation history, the row's per-chip input. */
export interface ProducedFileMatch {
    readonly path: string;
    /** This turn's applied hunks for the path (shown in the expandable diff panel). */
    readonly hunks: readonly ProducedHunk[];
    /** Conversation-cumulative applied hunks for the path (shown in the chip badge). */
    readonly totalHunks: readonly ProducedHunk[];
}
/** Immutable produced-file facts published against one Turn. */
export interface DeliverablesTurnData {
    readonly produced: readonly ProducedPath[];
    /**
     * Conversation-cumulative applied hunks per path, in call order. Each
     * Turn's start chains the previous Turn's map, so a chip's badge can
     * show the total edits the conversation made to a file across all Turns.
     * A compacted window that drops the prior Turn simply restarts from empty.
     */
    readonly history: ReadonlyMap<string, readonly ProducedHunk[]>;
    /**
     * This Turn's own applied hunks per path, in call order. Fresh each Turn
     * start (never chained), so the expandable diff panel shows only what
     * changed in the closing Turn, not the accumulated history.
     */
    readonly turnHunks: ReadonlyMap<string, readonly ProducedHunk[]>;
}
declare module '@deepseek-ai/dsh-client-ui-conversation/client' {
    interface ConversationTurnDataMap {
        /** Successful mutation paths accumulated in this Turn. */
        deliverables: DeliverablesTurnData;
    }
}
interface DeliverablesState extends DeliverablesTurnData {
    readonly turn: number;
    /** callId → the mutation its arguments named; null path for unrelated calls. */
    readonly calls: ReadonlyMap<string, CallMutation>;
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
export declare function producedForClosing(data: Readonly<DeliverablesTurnData> | undefined, seq?: number): readonly string[];
/**
 * Claim the turn-tail chain only when its closing turn produced files.
 * @param owner - Turn-tail owner currency for the closing assistant.
 * @returns Produced matches (path plus conversation history) as the component's
 * input, or null to decline before mount.
 */
export declare function selectProducedFiles(owner: TurnTailOwnerProps): readonly ProducedFileMatch[] | null;
/**
 * Strip common prefix/suffix content lines from oldText and newText so only
 * the actual changes (removed/added lines) remain. Context lines from the
 * tool's structured patch fall away, and a `str_replace_editor`'s raw
 * old_str/new_str that share nothing are kept whole.
 * @param oldText - the before side, or null for a new file.
 * @param newText - the after side.
 * @returns oldText/newText with context stripped away.
 */
export declare function stripContext(oldText: string | null, newText: string): ProducedHunk;
/**
 * Added/removed line totals for one path's conversation history, with the
 * same counting the diff primitive draws: each hunk's sides pair through the
 * common-prefix/suffix trim, so unchanged lines count on neither side.
 * @param hunks - the path's accumulated applied hunks.
 * @returns the `+added -removed` totals the chip badge shows.
 */
export declare function diffStats(hunks: readonly ProducedHunk[]): {
    added: number;
    removed: number;
};
/** Turn-local successful mutation accumulator; it publishes no view Node. */
export declare const deliverablesDefinition: ConversationNodeDefinition<DeliverablesState>;
/**
 * Trailing path segment, the part that identifies the file at a glance.
 * @param path - Slash- or backslash-separated path.
 * @returns The final segment, or the whole string when separator-free.
 */
export declare function basename(path: string): string;
/**
 * Leading path segments, the location that sets a deep path apart.
 * @param path - Slash- or backslash-separated path.
 * @returns The segments before the final one, or the empty string when separator-free.
 */
export declare function dirname(path: string): string;
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
export declare function producedFileMentions(paths: readonly string[], openFile: (path: string) => void, label: (path: string) => string): MarkdownFileMentions;
export {};
//# sourceMappingURL=turn-deliverables.d.ts.map