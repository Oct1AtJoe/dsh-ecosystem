import { BUCKET_KEYS, addBuckets, emptyBuckets } from "./usage-fold.js";
function bucketTotal(buckets) {
    let total = 0;
    for (const key of BUCKET_KEYS)
        total += Number(buckets?.[key]) || 0;
    return total;
}
export function mergeSessions(sessions) {
    const days = new Map();
    const hours = new Array(24).fill(0);
    const seen = new Set();
    for (const [id, entry] of sessions) {
        seen.add(id);
        if (Array.isArray(entry.hours)) {
            for (let h = 0; h < 24; h++)
                hours[h] = (hours[h] ?? 0) + (Number(entry.hours[h]) || 0);
        }
        for (const [day, buckets] of entry.days) {
            let target = days.get(day);
            if (!target) {
                target = emptyBuckets();
                target.sessions = new Set();
                target.hours = new Array(24).fill(0);
                days.set(day, target);
            }
            addBuckets(target, buckets, 1);
            if (target.sessions instanceof Set)
                target.sessions.add(id);
            const targetHours = target.hours ?? (target.hours = new Array(24).fill(0));
            for (let h = 0; h < 24; h++)
                targetHours[h] = (targetHours[h] ?? 0) + ((buckets.hours ?? [])[h] ?? 0);
            if (!buckets.models)
                continue;
            for (const [model, cell] of buckets.models) {
                if (!target.models)
                    target.models = new Map();
                let into = target.models.get(model);
                if (!into) {
                    into = emptyBuckets();
                    target.models.set(model, into);
                }
                addBuckets(into, cell, 1);
            }
        }
    }
    for (const day of days.values()) {
        const behind = day.sessions instanceof Set ? [...day.sessions].sort() : [];
        day.sessionIds = behind;
        day.sessions = behind.length;
    }
    return { days, sessionCount: seen.size, hours };
}
export function summarize(days, sessionCount, source, hours, extra) {
    const list = [...days.entries()]
        .map(([date, buckets]) => ({
        date,
        input: buckets.input,
        output: buckets.output,
        cacheRead: buckets.cacheRead,
        cacheWrite: buckets.cacheWrite,
        calls: buckets.calls,
        sessions: typeof buckets.sessions === 'number' ? buckets.sessions : 0,
        sessionIds: Array.isArray(buckets.sessionIds) ? buckets.sessionIds : [],
        models: buckets.models ? Object.fromEntries([...buckets.models].map(([id, cell]) => [id, bucketTotal(cell)])) : undefined,
        modelDetails: buckets.models
            ? Object.fromEntries([...buckets.models].map(([id, cell]) => [
                id,
                {
                    input: cell.input,
                    output: cell.output,
                    cacheRead: cell.cacheRead,
                    cacheWrite: cell.cacheWrite,
                    tokens: bucketTotal(cell),
                },
            ]))
            : undefined,
        hours: buckets.hours,
    }))
        .sort((a, b) => (a.date < b.date ? -1 : 1));
    const totals = emptyBuckets();
    const byModel = new Map();
    for (const [, buckets] of days) {
        addBuckets(totals, buckets, 1);
        if (!buckets.models)
            continue;
        for (const [id, cell] of buckets.models) {
            let into = byModel.get(id);
            if (!into) {
                into = emptyBuckets();
                byModel.set(id, into);
            }
            addBuckets(into, cell, 1);
        }
    }
    const models = [...byModel.entries()]
        .map(([id, cell]) => ({
        id,
        input: cell.input,
        output: cell.output,
        cacheRead: cell.cacheRead,
        cacheWrite: cell.cacheWrite,
        tokens: bucketTotal(cell),
    }))
        .sort((a, b) => b.tokens - a.tokens);
    const first = list[0];
    const last = list[list.length - 1];
    return {
        source,
        computedAt: Date.now(),
        days: list,
        models,
        firstDay: first ? first.date : null,
        lastDay: last ? last.date : null,
        model: models[0]?.id ?? undefined,
        ...(hours ? { hours } : {}),
        totals: {
            input: totals.input,
            output: totals.output,
            cacheRead: totals.cacheRead,
            cacheWrite: totals.cacheWrite,
            calls: totals.calls,
            sessions: extra?.sessionIds ? extra.sessionIds.size : sessionCount,
            activeDays: list.length,
        },
    };
}
//# sourceMappingURL=usage-summary.js.map