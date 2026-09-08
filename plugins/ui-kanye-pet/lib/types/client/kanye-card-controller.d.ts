/** The kanye-pet card's form over the `kanye-pet` settings namespace. */
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client';
import { type SnapshotStore } from '@deepseek-ai/dsh-client-store';
/** Namespace of the kanye-pet capability (matches the host plugin). */
export declare const KANYE_NS = "kanye-pet";
/** One character option from the manifest. */
export interface KanyeCharacterOption {
    id: string;
    name: string;
}
/** The pet fields this card edits — a subset of the served schema by design. */
export interface KanyeSettings {
    enabled?: boolean;
    desktopPetEnabled?: boolean;
    size?: number;
    opacity?: number;
    character?: string;
}
/** One staged numeric field's draft state. */
export interface KanyeFieldState {
    text: string;
    invalid: boolean;
}
/** What the kanye-pet card renders. */
export interface KanyeCardState {
    available: boolean;
    writable: boolean;
    enabled: boolean;
    desktopPetEnabled: boolean;
    size: KanyeFieldState;
    opacity: KanyeFieldState;
    /** Current character id (from staged draft or stored value). */
    character: string;
    /** Available character options from the manifest. */
    characters: KanyeCharacterOption[];
    /** Whether the manifest has loaded. */
    charactersLoaded: boolean;
    dirty: boolean;
    invalid: boolean;
    saving: boolean;
}
/** The registration-side face the kanye-pet card's slot entry injects. */
export interface KanyeCardFace {
    toggleEnabled: () => void;
    toggleDesktopPet: () => void;
    edit: (field: 'size' | 'opacity' | 'character', value: string) => void;
    save: () => void;
    discard: () => void;
    hooks: {
        kanyeCard: SnapshotStore<KanyeCardState>;
    };
}
/** Bridges the `kanye-pet` scope onto the card's staged form. */
export declare class KanyeCardController {
    private readonly scope;
    private readonly staged;
    private readonly store;
    private saving;
    private characters;
    private charactersLoaded;
    constructor(scope: SettingsScope<KanyeSettings>);
    private loadCharacters;
    private snapshot;
    private value;
    private field;
    private projection;
    /**
     * The face the card's slot entry injects from this controller.
     * @returns the registration-side face bridging the staged form onto the settings scope.
     */
    inject(): KanyeCardFace;
}
//# sourceMappingURL=kanye-card-controller.d.ts.map