export const USAGE_ROUTE = '/ui-theme-custom/usage';
// 首页用量轮询：服务端计算完成前反复拉取。原先 800ms × 15 次 ≈ 12 秒，
// 且离开首页后仍会跑完。现收敛为 1500ms × 8 次 ≈ 10 秒，并在页面隐藏 /
// 离开首页时立即停止（见 setPollEnabled）。
export const HOME_POLL_MS = 1500;
export const HOME_POLL_MAX = 8;
export const HOME_HEAT_WEEKS = 26;
export const HOME_HEAT_STEPS = 4;
export const HOME_CHART_DAYS = 30;
export const HOME_MODEL_ROWS = 6;
export const HOME_BOOKS = [
    { key: 'TaoTeChing', title: '道德经', tokens: 7607 },
    { key: 'Alice', title: '爱丽丝梦游仙境', tokens: 37248 },
    { key: 'AnimalFarm', title: '动物庄园', tokens: 39000 },
    { key: 'LittlePrince', title: '小王子', tokens: 46000 },
    { key: 'Gatsby', title: '了不起的盖茨比', tokens: 65763 },
    { key: '1984', title: '一九八四', tokens: 136278 },
    { key: 'ToLive', title: '活着', tokens: 115000 },
    { key: 'Hobbit', title: '霍比特人', tokens: 123000 },
    { key: 'ThreeBody', title: '三体', tokens: 202000 },
    { key: 'DarkForest', title: '黑暗森林', tokens: 307000 },
    { key: 'DeathsEnd', title: '死神永生', tokens: 336000 },
    { key: 'ThreeKingdoms', title: '三国演义', tokens: 638009 },
    { key: 'JourneyWest', title: '西游记', tokens: 783200 },
    { key: 'RedChamber', title: '红楼梦', tokens: 903956 },
    { key: 'OrdinaryWorld', title: '平凡的世界', tokens: 998000 },
    { key: 'HarryPotter', title: '哈利波特全集', tokens: 1409000 },
];
export const HOME_RANGES = [
    { id: 'all', label: '全部', days: 0 },
    { id: '30d', label: '30天', days: 30 },
    { id: '7d', label: '7天', days: 7 },
    { id: 'today', label: '今天', days: 1 },
];
export function pad2(value) {
    return value < 10 ? `0${value}` : String(value);
}
export function homeDayKey(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
export function homeShortDate(day) {
    const parts = day.split('-');
    if (parts.length < 3 || !parts[1] || !parts[2])
        return day;
    return `${Number(parts[1])}月${Number(parts[2])}日`;
}
export function homeRangeStart(windowDays) {
    if (!windowDays)
        return null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (windowDays - 1));
    return homeDayKey(start);
}
export function formatHomeCount(count) {
    const value = Math.round(Number(count) || 0);
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
export function formatCompactTokens(count) {
    const value = Number(count) || 0;
    const units = [
        [1e9, 'B'],
        [1e6, 'M'],
        [1e3, 'k'],
    ];
    for (let u = 0; u < units.length; u++) {
        const pair = units[u];
        if (!pair)
            continue;
        const scaled = Math.round((value / pair[0]) * 10) / 10;
        if (scaled >= 1)
            return String(scaled) + pair[1];
    }
    return String(Math.round(value));
}
export function formatHomeHour(hour) {
    if (hour === 0)
        return '午夜 0 点';
    if (hour >= 1 && hour <= 5)
        return `凌晨 ${hour} 点`;
    if (hour >= 6 && hour <= 8)
        return `早晨 ${hour} 点`;
    if (hour >= 9 && hour <= 11)
        return `上午 ${hour} 点`;
    if (hour === 12)
        return '中午 12 点';
    if (hour >= 13 && hour <= 17)
        return `下午 ${hour - 12} 点`;
    if (hour >= 18 && hour <= 23)
        return `晚上 ${hour - 12} 点`;
    return `${hour} 点`;
}
export function homeDayTokens(day) {
    if (!day)
        return 0;
    if (day.total !== undefined)
        return Number(day.total) || 0;
    return (day.input || 0) + (day.output || 0) + (day.cacheRead || 0) + (day.cacheWrite || 0);
}
export function homeModelTokens(entry) {
    if (entry.tokens !== undefined)
        return Number(entry.tokens) || 0;
    return (entry.input || 0) + (entry.output || 0) + (entry.cacheRead || 0) + (entry.cacheWrite || 0);
}
export function homeHeatGrid(days) {
    const byDate = {};
    const callsByDate = {};
    const list = days || [];
    let counted = true;
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (!item)
            continue;
        byDate[item.date] = homeDayTokens(item);
        const calls = item.calls;
        if (typeof calls === 'number')
            callsByDate[item.date] = calls;
        else
            counted = false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - (HOME_HEAT_WEEKS * 7 - 1));
    start.setDate(start.getDate() - start.getDay());
    const cells = [];
    let peak = 0;
    for (const cursor = new Date(start); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
        const key = homeDayKey(cursor);
        const tokens = byDate[key] || 0;
        if (tokens > peak)
            peak = tokens;
        cells.push({ date: key, tokens, messages: counted ? callsByDate[key] || 0 : null, level: 0 });
    }
    for (let c = 0; c < cells.length; c++) {
        const cell = cells[c];
        if (!cell || cell.tokens === 0 || peak === 0)
            continue;
        cell.level = Math.max(1, Math.min(HOME_HEAT_STEPS, Math.ceil((cell.tokens / peak) * HOME_HEAT_STEPS)));
    }
    return { cells, peak };
}
export function homeModelList(value, listed, start = null) {
    if (value !== null && Array.isArray(value.days) && start !== null) {
        // 选定时间范围（如 7d、30d）：从日数据动态切片聚合
        const byModel = new Map();
        for (let i = 0; i < value.days.length; i++) {
            const day = value.days[i];
            if (!day || day.date < start)
                continue;
            if (day.modelDetails) {
                for (const [id, cell] of Object.entries(day.modelDetails)) {
                    let target = byModel.get(id);
                    if (!target) {
                        target = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, tokens: 0 };
                        byModel.set(id, target);
                    }
                    target.input += cell.input || 0;
                    target.output += cell.output || 0;
                    target.cacheRead += cell.cacheRead || 0;
                    target.cacheWrite += cell.cacheWrite || 0;
                    target.tokens += cell.tokens || 0;
                }
            }
            else if (day.models) {
                for (const [id, count] of Object.entries(day.models)) {
                    let target = byModel.get(id);
                    if (!target) {
                        target = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, tokens: 0 };
                        byModel.set(id, target);
                    }
                    target.tokens += Number(count) || 0;
                }
            }
        }
        if (byModel.size > 0) {
            return [...byModel.entries()]
                .map(([id, m]) => ({
                id,
                input: m.input,
                output: m.output,
                cacheRead: m.cacheRead,
                cacheWrite: m.cacheWrite,
                tokens: m.tokens,
            }))
                .sort((a, b) => b.tokens - a.tokens);
        }
    }
    // 全部时间范围（all）或无日明细时：使用全量聚合
    if (value !== null && Array.isArray(value.models) && value.models.length > 0) {
        return value.models.map((entry) => ({
            id: entry.id,
            input: entry.input || 0,
            output: entry.output || 0,
            cacheRead: entry.cacheRead || 0,
            cacheWrite: entry.cacheWrite || 0,
            tokens: homeModelTokens(entry),
            sessions: entry.sessions,
            lastAt: entry.lastAt,
        }));
    }
    if (listed === null)
        return null;
    const startMs = start === null ? null : new Date(`${start}T00:00:00`).getTime();
    return listed.models
        .filter(entry => startMs === null || entry.lastAt >= startMs)
        .map(entry => ({
        id: entry.id,
        tokens: entry.tokens,
        sessions: entry.sessions,
        lastAt: entry.lastAt,
    }))
        .sort((a, b) => b.tokens - a.tokens);
}
export function homeModelDays(value, windowDays) {
    if (value === null || !Array.isArray(value.days))
        return null;
    const span = windowDays > 0 && windowDays < HOME_CHART_DAYS ? windowDays : HOME_CHART_DAYS;
    const start = homeRangeStart(span);
    const columns = [];
    for (let i = 0; i < value.days.length; i++) {
        const day = value.days[i];
        if (!day || day.date < start || !day.models)
            continue;
        columns.push({ date: day.date, models: day.models });
    }
    if (columns.length === 0)
        return null;
    columns.sort((a, b) => (a.date < b.date ? -1 : 1));
    return columns;
}
export function homePanelData(state, listedRaw, range, bookPick) {
    const value = state.value;
    const ready = value !== null && value.totals !== undefined;
    const totals = ready ? value.totals : null;
    // While the host is still folding the real report, the coarse session-list
    // fallback is NOT a usable stand-in: it pins a whole session's lifetime
    // tokens on its last-activity day, so "今天" flashes ~692M before dropping
    // to the true ~75M once the fold lands. Hold the skeleton instead, and fall
    // back to the list only when the real report is genuinely unreachable
    // (route error or poll budget exhausted) so the panel never strands.
    const pending = value === null && state.error === null && state.polls < HOME_POLL_MAX;
    const listed = pending ? null : listedRaw;
    const known = ready || listed !== null;
    let windowDays = 0;
    for (let r = 0; r < HOME_RANGES.length; r++) {
        const rangeItem = HOME_RANGES[r];
        if (rangeItem && rangeItem.id === range)
            windowDays = rangeItem.days;
    }
    const start = homeRangeStart(windowDays);
    const startMs = start === null ? null : new Date(`${start}T00:00:00`).getTime();
    const inRange = (date) => start === null || date >= start;
    let tokens = 0;
    let calls = null;
    let sessions = null;
    let activeDays = null;
    if (ready && start === null && totals !== null) {
        tokens = homeDayTokens(totals);
        calls = totals.calls ?? null;
        sessions = totals.sessions ?? null;
        activeDays = totals.activeDays ?? null;
    }
    else if (ready) {
        const ids = {};
        let everyDayHasIds = true;
        let daySessions = 0;
        calls = 0;
        sessions = 0;
        activeDays = 0;
        for (let d = 0; d < value.days.length; d++) {
            const day = value.days[d];
            if (!day || !inRange(day.date))
                continue;
            tokens += homeDayTokens(day);
            calls += day.calls || 0;
            activeDays += 1;
            if (Array.isArray(day.sessionIds)) {
                for (let s = 0; s < day.sessionIds.length; s++) {
                    const sid = day.sessionIds[s];
                    if (sid)
                        ids[sid] = true;
                }
            }
            else {
                everyDayHasIds = false;
            }
            daySessions += day.sessions || 0;
        }
        sessions = everyDayHasIds ? Object.keys(ids).length : daySessions;
    }
    else if (listed !== null) {
        sessions = 0;
        activeDays = 0;
        calls = 0;
        for (let e = 0; e < listed.entries.length; e++) {
            const item = listed.entries[e];
            if (!item)
                continue;
            if (startMs !== null && item.at < startMs)
                continue;
            tokens += item.tokens;
            sessions += 1;
            calls += item.calls || 1;
        }
        for (let ld = 0; ld < listed.days.length; ld++) {
            const item = listed.days[ld];
            if (item && inRange(item.date))
                activeDays += 1;
        }
    }
    let hourCounts = null;
    if (ready && start === null && Array.isArray(value.hours)) {
        hourCounts = value.hours;
    }
    else if (ready && start !== null && Array.isArray(value.days)) {
        for (let hd = 0; hd < value.days.length; hd++) {
            const hourDay = value.days[hd];
            if (!hourDay || !inRange(hourDay.date) || !Array.isArray(hourDay.hours))
                continue;
            if (hourCounts === null)
                hourCounts = new Array(24).fill(0);
            for (let dh = 0; dh < 24; dh++) {
                hourCounts[dh] = (hourCounts[dh] ?? 0) + (Number(hourDay.hours[dh]) || 0);
            }
        }
    }
    else if (listed !== null) {
        if (start === null && Array.isArray(listed.hours)) {
            hourCounts = listed.hours;
        }
        else {
            for (let e = 0; e < listed.entries.length; e++) {
                const item = listed.entries[e];
                if (!item || (startMs !== null && item.at < startMs))
                    continue;
                if (hourCounts === null)
                    hourCounts = new Array(24).fill(0);
                const hour = new Date(item.at).getHours();
                if (hour >= 0 && hour < 24) {
                    hourCounts[hour] = (hourCounts[hour] ?? 0) + (item.calls || 1);
                }
            }
        }
    }
    let peakHour = null;
    if (hourCounts !== null) {
        let bestHour = 0;
        let hourSum = 0;
        for (let h = 0; h < 24; h++) {
            const count = Number(hourCounts[h]) || 0;
            hourSum += count;
            if (count > (Number(hourCounts[bestHour]) || 0))
                bestHour = h;
        }
        if (hourSum > 0)
            peakHour = formatHomeHour(bestHour);
    }
    const models = homeModelList(value, listed, start);
    let model = null;
    if (models && models.length > 0 && models[0]) {
        model = models[0].id;
    }
    else if (ready && typeof value.model === 'string') {
        model = value.model;
    }
    else if (listed !== null) {
        if (startMs === null)
            model = listed.model;
        else {
            let bestSessions = 0;
            for (let m = 0; m < listed.models.length; m++) {
                const item = listed.models[m];
                if (!item || item.lastAt < startMs || item.sessions <= bestSessions)
                    continue;
                bestSessions = item.sessions;
                model = item.id;
            }
        }
    }
    let fun = null;
    let bookIndex = Math.min(HOME_BOOKS.length - 1, Math.floor(bookPick * HOME_BOOKS.length));
    while (bookIndex >= 0) {
        const bookCandidate = HOME_BOOKS[bookIndex];
        if (bookCandidate && tokens >= bookCandidate.tokens)
            break;
        bookIndex -= 1;
    }
    if (bookIndex >= 0) {
        const book = HOME_BOOKS[bookIndex];
        if (book) {
            const multiple = Math.max(1, Math.round(tokens / book.tokens));
            fun = `已消耗约相当于 ${formatHomeCount(multiple)} 本《${book.title}》的 Tokens`;
        }
    }
    return {
        listed,
        known,
        tokens,
        calls,
        sessions,
        activeDays,
        peakHour,
        model,
        grid: homeHeatGrid(ready ? value.days : (listed ? listed.days : null)),
        fun,
        models,
        modelDays: homeModelDays(value, windowDays),
    };
}
export function createHomeUsage(ctx) {
    const usage = { value: null, computing: false, error: null, loading: false, polls: 0 };
    let listSummary = null;
    let listLoading = false;
    const listeners = [];
    let pollTimer = null;
    let disposed = false;
    function emit() {
        for (let i = 0; i < listeners.length; i++) {
            const fn = listeners[i];
            if (typeof fn === 'function') {
                try {
                    fn();
                }
                catch { }
            }
        }
    }
    function subscribe(listener) {
        listeners.push(listener);
        return () => {
            const idx = listeners.indexOf(listener);
            if (idx !== -1)
                listeners.splice(idx, 1);
        };
    }
    function stopPolling() {
        if (pollTimer !== null) {
            clearTimeout(pollTimer);
            pollTimer = null;
        }
    }
    /** 轮询是否允许继续：页面隐藏或已离开首页时置 false，省掉无意义的请求。 */
    let pollAllowed = true;
    /**
     * 启停用量轮询。
     * 只在「离开首页（或页面进入后台）」时调用 false；这些场景下服务端仍可能在算，
     * 但结果已经没有人看 —— 等下次回到首页时 loadUsage 会重新发起。
     */
    function setPollEnabled(allowed) {
        if (allowed === pollAllowed)
            return;
        pollAllowed = allowed;
        if (!allowed) {
            stopPolling();
            // 复位计数，让下次进首页重新获得完整的轮询预算。
            usage.polls = 0;
        }
    }
    function loadUsage(force) {
        if (disposed || usage.loading)
            return;
        if (!force && !pollAllowed)
            return;
        if (!force && usage.value !== null && !usage.computing)
            return;
        usage.loading = true;
        fetch(USAGE_ROUTE, { credentials: 'same-origin', headers: { accept: 'application/json' } })
            .then(r => (r && r.ok ? r.json() : null))
            .then((body) => {
            usage.loading = false;
            if (disposed)
                return;
            if (!body || !body.ok) {
                usage.error = 'unavailable';
                emit();
                return;
            }
            if (body.value !== undefined && body.value !== null) {
                usage.value = body.value;
            }
            usage.computing = body.computing === true;
            usage.error = body.error ?? null;
            emit();
            if (usage.computing) {
                if (usage.polls >= HOME_POLL_MAX)
                    return;
                if (!pollAllowed)
                    return;
                usage.polls += 1;
                stopPolling();
                pollTimer = setTimeout(() => {
                    pollTimer = null;
                    loadUsage(true);
                }, HOME_POLL_MS);
            }
        })
            .catch(() => {
            usage.loading = false;
            if (disposed)
                return;
            usage.error = 'unavailable';
            emit();
        });
    }
    function summarizeSessionList(rows) {
        let tokens = 0;
        let calls = 0;
        const hours = new Array(24).fill(0);
        const dayCount = {};
        const byDay = {};
        const byModel = {};
        const entries = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row)
                continue;
            const values = row.projections?.values;
            if (!values)
                continue;
            const meta = values.sessionListMetadata;
            if (meta?.blank === true)
                continue;
            const bucket = values.tokenUsage;
            const total = bucket
                ? (bucket.uncachedInputTokens || 0) + (bucket.outputTokens || 0) + (bucket.cacheReadTokens || 0) + (bucket.cacheWriteTokens || 0)
                : 0;
            tokens += total;
            const at = typeof meta?.lastPromptAt === 'number' ? meta.lastPromptAt : (row.updatedAt ?? 0);
            const selection = values.modelSelection;
            const picked = selection ? (selection.next || selection.lastUsed) : null;
            const id = typeof picked?.model === 'string' ? picked.model : null;
            const stepCount = Number(values.sessionStats?.steps)
                || (Array.isArray(values.turnOutline?.turns) ? values.turnOutline.turns.length : 0)
                || 1;
            calls += stepCount;
            entries.push({ at: typeof at === 'number' ? at : 0, tokens: total, model: id, calls: stepCount });
            if (typeof at === 'number') {
                const d = new Date(at);
                const day = homeDayKey(d);
                dayCount[day] = true;
                byDay[day] = (byDay[day] || 0) + total;
                const hour = d.getHours();
                if (hour >= 0 && hour < 24) {
                    hours[hour] = (hours[hour] ?? 0) + stepCount;
                }
            }
            if (id !== null) {
                let cell = byModel[id];
                if (!cell) {
                    cell = { tokens: 0, sessions: 0, lastAt: 0 };
                    byModel[id] = cell;
                }
                cell.tokens += total;
                cell.sessions += 1;
                if (typeof at === 'number' && at > cell.lastAt)
                    cell.lastAt = at;
            }
        }
        let favorite = null;
        let best = 0;
        const models = [];
        for (const name in byModel) {
            const item = byModel[name];
            if (!item)
                continue;
            models.push({ id: name, tokens: item.tokens, sessions: item.sessions, lastAt: item.lastAt });
            if (item.sessions > best) {
                best = item.sessions;
                favorite = name;
            }
        }
        models.sort((a, b) => b.tokens - a.tokens);
        const days = [];
        for (const date in byDay) {
            const total = byDay[date];
            if (typeof total === 'number')
                days.push({ date, total });
        }
        return { tokens, sessions: entries.length, activeDays: Object.keys(dayCount).length, calls, hours, model: favorite, models, days, entries };
    }
    function loadSessionSummary() {
        if (disposed || listLoading || listSummary !== null)
            return;
        const sessions = ctx.get('remote.session');
        if (!sessions || typeof sessions.list !== 'function')
            return;
        listLoading = true;
        sessions.list({}).then((result) => {
            listLoading = false;
            if (disposed)
                return;
            const items = result?.ok && Array.isArray(result?.value?.items) ? result.value.items : null;
            if (items) {
                listSummary = summarizeSessionList(items);
                emit();
            }
        }).catch(() => {
            listLoading = false;
        });
    }
    return {
        state() { return usage; },
        list() { return listSummary; },
        listLoading() { return listLoading; },
        subscribe,
        notify: emit,
        load: loadUsage,
        setPollEnabled,
        loadList: loadSessionSummary,
        stop() {
            disposed = true;
            stopPolling();
            listeners.length = 0;
        },
    };
}
//# sourceMappingURL=data.js.map