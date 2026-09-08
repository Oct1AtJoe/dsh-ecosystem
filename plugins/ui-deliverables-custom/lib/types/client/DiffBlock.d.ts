/**
 * Output lines shown before the height cap collapses the middle. Matches
 * {@link DEFAULT_TERMINAL_MAX_LINES} so a diff card and a terminal card cut a
 * long body at the same place.
 */
export declare const DEFAULT_DIFF_MAX_LINES = 16;
/**
 * One file's change, in the shape {@link DiffBlock} draws. Structurally the
 * render-intent contract's `FileDiff`, redeclared here so this primitive stays
 * free of the tool contract (the terminal card's decoupling, applied to diffs).
 */
export interface DiffHunk {
    /** The changed file's path, drawn verbatim as the hunk's header (the tool's model-facing path). */
    path: string;
    /** Prior content, or `null` for a new file / an overwrite (nothing on the removed side). */
    oldText: string | null;
    /** Content after the change (the added side). */
    newText: string;
}
export interface DiffBlockProps {
    /** One entry per applied hunk, in file order; empty renders nothing. */
    diffs: DiffHunk[];
    /** Height cap in body lines before the middle collapses (default {@link DEFAULT_DIFF_MAX_LINES}). */
    maxLines?: number | undefined;
    /** Extra class merged onto the wrapper (callers position; this component draws). */
    className?: string | undefined;
    /** Draw the per-file path headers and the same-file gap rows (default true). */
    showPathHeaders?: boolean | undefined;
    /** Draw the dim `└ +A -R · N file(s)` summary (default true). */
    showFooter?: boolean | undefined;
}
/**
 * Pair the two sides of one hunk into its changed lines: a common-prefix and
 * common-suffix trim over the content lines, leaving the removed middle (old
 * only) and the added middle (new only). Identical sides yield zero rows — a
 * no-op write draws nothing for its hunk. `null` oldText (a new file) puts
 * every new line on the added side.
 * @param oldText - prior content, or `null` for a new file.
 * @param newText - content after the change.
 * @returns the removed and added content lines.
 */
export declare function diffLines(oldText: string | null, newText: string): {
    removed: string[];
    added: string[];
};
/**
 * Render a file mutation as an inline diff surface.
 * @param props - see {@link DiffBlockProps}.
 * @returns the diff block element.
 */
export declare function DiffBlock({ diffs, maxLines, className, showPathHeaders, showFooter, }: DiffBlockProps): React.JSX.Element | null;
//# sourceMappingURL=DiffBlock.d.ts.map