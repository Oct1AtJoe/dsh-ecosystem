import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { zstdDecompressSync } from 'node:zlib';
export const BUCKET_KEYS = [
    'input',
    'output',
    'cacheRead',
    'cacheWrite',
];
const SESSION_LOG = /^session(?:\.v([1-9][0-9]*))?\.jsonl(?:\.zstd)?$/i;
const ZSTD_MAGIC = globalThis.Buffer?.from([0x28, 0xb5, 0x2f, 0xfd]) ?? Buffer.from([0x28, 0xb5, 0x2f, 0xfd]);
export function emptyBuckets() {
    return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0 };
}
export function addBuckets(target, buckets, sign) {
    if (!buckets)
        return;
    for (const key of BUCKET_KEYS) {
        const value = Number(buckets[key]);
        if (Number.isFinite(value) && value !== 0) {
            target[key] += sign * value;
        }
    }
    const calls = Number(buckets.calls);
    if (Number.isFinite(calls)) {
        target.calls += sign * calls;
    }
}
export function dayKey(time) {
    const date = new Date(time);
    if (!Number.isFinite(date.getTime()))
        return null;
    const pad = (v) => String(v).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function usageOf(event) {
    const data = event?.data;
    if (!data || typeof data !== 'object')
        return undefined;
    if (event.type === 'assistant/message' && data.usage !== undefined)
        return data.usage;
    if (event.type !== 'assistant/message' && event.type !== 'assistant/attempt')
        return undefined;
    const stream = data.stream;
    if (!Array.isArray(stream))
        return undefined;
    for (let index = stream.length - 1; index >= 0; index -= 1) {
        const record = stream[index];
        if (record?.type === 'chunk' && record.chunk?.type === 'usage') {
            return record.chunk.usage;
        }
    }
    return undefined;
}
function bucketsFrom(usage) {
    const count = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
    return {
        input: count(usage?.inputTokens),
        output: count(usage?.outputTokens),
        cacheRead: count(usage?.cacheReadTokens),
        cacheWrite: count(usage?.cacheWriteTokens),
        calls: 1,
    };
}
function modelOf(event) {
    const model = event?.data?.message?.source?.model;
    return typeof model === 'string' && model !== '' ? model : null;
}
export function foldSession(events) {
    const days = new Map();
    const hours = new Array(24).fill(0);
    const bump = (day, hour, buckets, sign, model) => {
        hours[hour] += sign;
        let target = days.get(day);
        if (!target) {
            if (sign < 0)
                return;
            const fresh = emptyBuckets();
            fresh.hours = new Array(24).fill(0);
            fresh.models = new Map();
            days.set(day, fresh);
            target = fresh;
        }
        const targetHours = target.hours ?? (target.hours = new Array(24).fill(0));
        targetHours[hour] += sign;
        addBuckets(target, buckets, sign);
        if (model !== null) {
            const models = target.models ?? (target.models = new Map());
            let cell = models.get(model);
            if (!cell && sign > 0) {
                cell = emptyBuckets();
                models.set(model, cell);
            }
            if (cell) {
                addBuckets(cell, buckets, sign);
                if (sign < 0 && BUCKET_KEYS.every(k => cell[k] === 0) && cell.calls === 0) {
                    models.delete(model);
                }
            }
        }
        if (sign < 0 && BUCKET_KEYS.every(k => target[k] === 0) && target.calls === 0) {
            days.delete(day);
        }
    };
    let last = null;
    for (const event of events) {
        const type = event?.type;
        if (type === 'llm/retry-started') {
            const data = event.data;
            if (last !== null && last.turn === data?.turn && last.step === data?.step)
                last = null;
            continue;
        }
        if (type !== 'assistant/message' && type !== 'assistant/attempt')
            continue;
        const usage = usageOf(event);
        if (!usage)
            continue;
        if (typeof event.time !== 'number')
            continue;
        const day = dayKey(event.time);
        if (!day)
            continue;
        const hour = new Date(event.time).getHours();
        const buckets = bucketsFrom(usage);
        const model = modelOf(event);
        const turn = event.data?.turn;
        const step = event.data?.step;
        const replacing = last !== null && last.turn === turn && last.step === step;
        if (replacing && last !== null && BUCKET_KEYS.every(k => last.buckets[k] === buckets[k]))
            continue;
        if (replacing && last !== null) {
            bump(last.day, last.hour, last.buckets, -1, last.model);
        }
        bump(day, hour, buckets, 1, model);
        last = { turn, step, buckets, day, hour, model };
    }
    return { days, hours };
}
function newestLog(dir) {
    let best = null;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isFile())
            continue;
        const match = SESSION_LOG.exec(entry.name);
        if (!match)
            continue;
        const version = Number(match[1] ?? 0);
        const compressed = /\.zstd$/i.test(entry.name);
        if (best === null || version > best.version || (version === best.version && Number(compressed) > Number(best.compressed))) {
            best = { name: entry.name, version, compressed };
        }
    }
    if (!best)
        return null;
    const path = join(dir, best.name);
    const stat = statSync(path);
    return { path, size: stat.size, mtimeMs: stat.mtimeMs, ...best };
}
export function listSessionLogs(root) {
    const out = [];
    if (!existsSync(root))
        return out;
    for (const project of readdirSync(root, { withFileTypes: true })) {
        if (!project.isDirectory())
            continue;
        const projectDir = join(root, project.name);
        for (const session of readdirSync(projectDir, { withFileTypes: true })) {
            if (!session.isDirectory())
                continue;
            const log = newestLog(join(projectDir, session.name));
            if (!log)
                continue;
            out.push({ id: session.name, ...log });
        }
    }
    return out;
}
function decompressZstd(buf) {
    let out = '';
    let pos = 0;
    while (pos < buf.length) {
        const idx = buf.indexOf(ZSTD_MAGIC, pos);
        if (idx < 0)
            break;
        const next = buf.indexOf(ZSTD_MAGIC, idx + 4);
        const end = next < 0 ? buf.length : next;
        try {
            out += zstdDecompressSync(buf.subarray(idx, end)).toString('utf8');
        }
        catch {
            break;
        }
        pos = end;
    }
    return out;
}
function readEventsFromFile(logPath) {
    try {
        const buf = readFileSync(logPath);
        const text = logPath.endsWith('.zstd') ? decompressZstd(buf) : buf.toString('utf8');
        const lines = text.split('\n');
        const events = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line)
                continue;
            try {
                const j = JSON.parse(line);
                if (j && typeof j === 'object')
                    events.push(j);
            }
            catch { }
        }
        return events;
    }
    catch {
        return null;
    }
}
export async function readEvents(ctx, sessionId, logPath) {
    const query = ctx.get?.('sessionQuery');
    if (query && typeof query.readSession === 'function') {
        try {
            const snapshot = await query.readSession(sessionId);
            if (Array.isArray(snapshot?.events)) {
                // ponytail: replay-validation failures (e.g. seeded fork prefix
                // mismatch) fall through to the raw log instead of aborting the fold.
                if (snapshot.events.length > 0)
                    return snapshot.events;
            }
        }
        catch {
            // Any sessionQuery failure degrades to the on-disk generation below:
            // one unreadable log must never void the whole usage report.
        }
    }
    if (logPath && existsSync(logPath)) {
        return readEventsFromFile(logPath);
    }
    return null;
}
//# sourceMappingURL=usage-fold.js.map