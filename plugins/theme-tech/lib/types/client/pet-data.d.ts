/**
 * Composer pet sprite data — "Saul Goodman" from codex-pets.net
 * (https://codex-pets.net/#/?kind=person&pet=saul-goodman).
 *
 * Built using a unified camera viewport across all actions:
 * - Preserves the author’s original world coordinate system and ground plane.
 * - No per-action tight bounding box drift; no artificial magnification on animation switch.
 * - Replaced flawed row 7 (which had a flat haircut defect in the source sprite)
 *   with pristine row 1 (runRight, full rounded hair silhouette, 8 frames).
 */
/** One frame is `PET_CELL_W` x `PET_CELL_H` CSS px; every strip is 8 cells wide. */
export declare const PET_CELL_W = 73;
export declare const PET_CELL_H = 109;
/** Frames per strip row. */
export declare const PET_COLS = 8;
/** Milliseconds each frame holds. */
export declare const PET_FRAME_MS = 110;
/** The distinct strips, keyed by asset name. */
export declare const PET_IMAGES: Record<string, string>;
/** One playable action. */
export interface PetSheet {
    /** Frames to play, left to right from column 0. */
    frames: number;
    /** Frame held when motion is reduced. */
    still: number;
    /** Key into `PET_IMAGES`. */
    image: string;
}
/** Playable actions, keyed by the semantic name the player asks for. */
export declare const PET_SHEETS: Record<string, PetSheet>;
//# sourceMappingURL=pet-data.d.ts.map