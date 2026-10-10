/**
 * Claude Code pixel crab animation sheets and metadata.
 */
export interface SheetMeta {
    frames: number;
    box: [number, number, number, number];
    still: number;
}
export declare const CRAB_FRAME_MS = 80;
export declare const CRAB_SHEETS: Record<string, SheetMeta>;
export declare const CRAB_SHEET_URLS: Record<string, {
    body: string;
    ink: string;
}>;
//# sourceMappingURL=mascot-data.d.ts.map