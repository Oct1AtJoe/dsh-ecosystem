import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { readCache, writeCache } from "./usage-cache.js";
import { foldSession, listSessionLogs, readEvents } from "./usage-fold.js";
import { mergeSessions, summarize } from "./usage-summary.js";
function getHarnessHome(ctx) {
    const resolvePath = ctx.get('dshHomePath');
    if (typeof resolvePath === 'function')
        return resolvePath();
    return process.env.DSH_HOME ?? join(homedir(), '.dsh');
}
function hoursOf(days) {
    const hours = new Array(24).fill(0);
    for (const buckets of days.values()) {
        if (!buckets.hours)
            continue;
        for (let h = 0; h < 24; h++)
            hours[h] = (hours[h] ?? 0) + (Number(buckets.hours[h]) || 0);
    }
    return hours;
}
export function createUsage(ctx) {
    const home = () => getHarnessHome(ctx);
    let state = null;
    let pending = null;
    let disposed = false;
    async function computeLocal(logs) {
        const cache = readCache(ctx, home());
        const sessions = new Map();
        let read = 0;
        let failed = 0;
        for (const log of logs) {
            const cached = cache.get(log.id);
            if (cached && cached.size === log.size && cached.mtimeMs === log.mtimeMs) {
                sessions.set(log.id, cached);
                continue;
            }
            const events = await readEvents(ctx, log.id, log.path);
            if (!events) {
                failed += 1;
                if (cached)
                    sessions.set(log.id, cached);
                continue;
            }
            const folded = foldSession(events);
            sessions.set(log.id, { size: log.size, mtimeMs: log.mtimeMs, days: folded.days, hours: folded.hours });
            read += 1;
        }
        writeCache(ctx, home(), sessions);
        const rolled = mergeSessions(sessions);
        const summary = summarize(rolled.days, rolled.sessionCount, 'local', rolled.days.size === 0 ? undefined : hoursOf(rolled.days));
        if (sessions.size === 0 && failed > 0) {
            return { ...summary, unavailable: true, reason: 'session-query-unavailable' };
        }
        return { ...summary, read, failed };
    }
    async function compute() {
        const root = resolve(join(home(), 'sessions'));
        const logs = listSessionLogs(root);
        if (logs.length === 0) {
            return summarize(new Map(), 0, 'local', new Array(24).fill(0));
        }
        return await computeLocal(logs);
    }
    function refresh() {
        if (disposed)
            return Promise.resolve(null);
        if (pending !== null)
            return pending;
        state = state === null ? { value: null, computing: true } : { ...state, computing: true };
        pending = compute().then((value) => {
            pending = null;
            if (disposed)
                return value;
            state = { value, computing: false };
            return value;
        }, (error) => {
            pending = null;
            if (!disposed)
                state = { value: state?.value ?? null, computing: false, error: String(error?.message ?? error) };
            return null;
        });
        return pending;
    }
    return {
        snapshot() {
            return state === null
                ? { ok: true, value: null, computing: false }
                : { ok: true, value: state.value, computing: state.computing === true, error: state.error };
        },
        refresh,
        dispose() {
            disposed = true;
            state = null;
            pending = null;
        },
    };
}
//# sourceMappingURL=usage.js.map