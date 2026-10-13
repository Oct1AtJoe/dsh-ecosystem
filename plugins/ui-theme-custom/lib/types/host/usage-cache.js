import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { addBuckets, emptyBuckets } from "./usage-fold.js";
const CACHE_VERSION = 1;
function cacheFile(home) {
    return join(home, 'cache', 'ui-theme-custom', 'usage.json');
}
function hoursFrom(raw) {
    return Array.isArray(raw) && raw.length === 24
        ? raw.map(v => (Number.isFinite(Number(v)) ? Number(v) : 0))
        : new Array(24).fill(0);
}
function daysToObject(days) {
    const out = {};
    for (const [day, buckets] of days) {
        const entry = { ...buckets, models: undefined, sessions: undefined };
        if (buckets.models) {
            const cells = {};
            for (const [model, cell] of buckets.models) {
                cells[model] = cell;
            }
            entry.models = cells;
        }
        out[day] = entry;
    }
    return out;
}
function daysFromObject(raw) {
    const days = new Map();
    if (!raw || typeof raw !== 'object')
        return days;
    for (const [day, stored] of Object.entries(raw)) {
        if (!stored || typeof stored !== 'object')
            continue;
        const clean = emptyBuckets();
        addBuckets(clean, stored, 1);
        clean.hours = hoursFrom(stored.hours);
        if (stored.models && typeof stored.models === 'object') {
            const models = new Map();
            for (const [model, cell] of Object.entries(stored.models)) {
                if (!cell || typeof cell !== 'object')
                    continue;
                const into = emptyBuckets();
                addBuckets(into, cell, 1);
                models.set(model, into);
            }
            clean.models = models;
        }
        days.set(day, clean);
    }
    return days;
}
export function readCache(_ctx, home) {
    const file = cacheFile(home);
    if (!existsSync(file))
        return new Map();
    let parsed;
    try {
        parsed = JSON.parse(readFileSync(file, 'utf8'));
    }
    catch {
        return new Map();
    }
    if (!parsed || typeof parsed !== 'object' || parsed.version !== CACHE_VERSION) {
        return new Map();
    }
    const sessions = new Map();
    const rawSessions = parsed.sessions;
    if (!rawSessions || typeof rawSessions !== 'object')
        return sessions;
    for (const [id, value] of Object.entries(rawSessions)) {
        if (!value || typeof value !== 'object')
            continue;
        if (!Number.isFinite(value.size) || !Number.isFinite(value.mtimeMs))
            continue;
        sessions.set(id, {
            size: Number(value.size),
            mtimeMs: Number(value.mtimeMs),
            days: daysFromObject(value.days),
            hours: hoursFrom(value.hours),
        });
    }
    return sessions;
}
export function writeCache(_ctx, home, sessions) {
    const file = cacheFile(home);
    const dir = dirname(file);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    const document = {
        version: CACHE_VERSION,
        computedAt: Date.now(),
        sessions: {},
    };
    for (const [id, entry] of sessions) {
        document.sessions[id] = {
            size: entry.size,
            mtimeMs: entry.mtimeMs,
            days: daysToObject(entry.days),
            hours: entry.hours,
        };
    }
    const temp = `${file}.${process.pid ?? 0}.tmp`;
    try {
        writeFileSync(temp, JSON.stringify(document), 'utf8');
        renameSync(temp, file);
    }
    catch {
        // Write failure is non-fatal for caching
    }
}
//# sourceMappingURL=usage-cache.js.map