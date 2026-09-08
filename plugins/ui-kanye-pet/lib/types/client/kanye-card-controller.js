/** The kanye-pet card's form over the `kanye-pet` settings namespace. */
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store';
/** Namespace of the kanye-pet capability (matches the host plugin). */
export const KANYE_NS = 'kanye-pet';
/** Bridges the `kanye-pet` scope onto the card's staged form. */
export class KanyeCardController {
    scope;
    staged = new Map();
    store;
    saving = false;
    characters = [];
    charactersLoaded = false;
    constructor(scope) {
        this.scope = scope;
        this.store = createSnapshotStore(this.projection());
        scope.subscribe(() => { this.store.set(this.projection()); });
        void this.loadCharacters();
    }
    async loadCharacters() {
        try {
            const res = await fetch('/kanye-pet/assets/manifest.json');
            if (!res.ok)
                return;
            const manifest = await res.json();
            this.characters = Object.entries(manifest.characters).map(([id, ch]) => ({ id, name: ch.name ?? id }));
        }
        catch {
            // manifest unreachable: character dropdown stays empty
        }
        finally {
            this.charactersLoaded = true;
            this.store.set(this.projection());
        }
    }
    snapshot() {
        return this.scope.getSnapshot();
    }
    value() {
        return this.snapshot().value;
    }
    field(field) {
        const staged = this.staged.get(field);
        if (staged === undefined) {
            const value = this.value()?.[field];
            return { text: typeof value === 'number' ? String(value) : '', invalid: false };
        }
        const trimmed = staged.text.trim();
        if (trimmed === '' || !Number.isFinite(Number(trimmed)))
            return { text: staged.text, invalid: trimmed !== '' };
        const num = Number(trimmed);
        if (field === 'size' && (num < 100 || num > 300))
            return { text: staged.text, invalid: true };
        if (field === 'opacity' && (num < 0 || num > 1))
            return { text: staged.text, invalid: true };
        return { text: staged.text, invalid: false };
    }
    projection() {
        const snapshot = this.snapshot();
        const value = this.value();
        const size = this.field('size');
        const opacity = this.field('opacity');
        const dirty = this.staged.size > 0;
        return {
            available: snapshot.status === 'ready',
            writable: snapshot.writable,
            enabled: value?.enabled !== false,
            desktopPetEnabled: value?.desktopPetEnabled !== false,
            size,
            opacity,
            character: value?.character ?? 'kanye',
            characters: this.characters,
            charactersLoaded: this.charactersLoaded,
            dirty,
            invalid: (size.invalid || opacity.invalid) && dirty,
            saving: this.saving,
        };
    }
    /**
     * The face the card's slot entry injects from this controller.
     * @returns the registration-side face bridging the staged form onto the settings scope.
     */
    inject() {
        return {
            toggleEnabled: () => {
                const next = this.value()?.enabled !== false ? false : true;
                void this.scope.set('enabled', next);
            },
            toggleDesktopPet: () => {
                const next = this.value()?.desktopPetEnabled !== false ? false : true;
                void this.scope.set('desktopPetEnabled', next);
            },
            edit: (field, text) => {
                if (field === 'character') {
                    // character is not staged: write immediately
                    void this.scope.set('character', text);
                    return;
                }
                this.staged.set(field, { text });
                this.store.set(this.projection());
            },
            save: () => {
                if (this.saving)
                    return;
                const size = this.staged.get('size');
                const opacity = this.staged.get('opacity');
                if (size === undefined && opacity === undefined)
                    return;
                const writes = [];
                for (const field of ['size', 'opacity']) {
                    const staged = this.staged.get(field);
                    if (staged === undefined)
                        continue;
                    const trimmed = staged.text.trim();
                    if (trimmed === '')
                        continue;
                    const parsed = Number(trimmed);
                    if (!Number.isFinite(parsed))
                        return;
                    writes.push({ field, value: parsed });
                }
                if (writes.length === 0)
                    return;
                this.saving = true;
                this.store.set(this.projection());
                void (async () => {
                    for (const write of writes)
                        await this.scope.set(write.field, write.value);
                    this.saving = false;
                    this.staged.clear();
                    this.store.set(this.projection());
                })();
            },
            discard: () => {
                this.staged.clear();
                this.store.set(this.projection());
            },
            hooks: { kanyeCard: this.store },
        };
    }
}
//# sourceMappingURL=kanye-card-controller.js.map