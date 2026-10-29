import { PET_CELL_W, PET_FRAME_MS, PET_IMAGES, PET_SHEETS } from './pet-data';
export const MASCOT_STORAGE_KEY = 'dsh-claude-mascot-enabled';
/** 读取挂件启用状态（默认开启）。 */
export function readMascotEnabled() {
    try {
        const raw = localStorage.getItem(MASCOT_STORAGE_KEY);
        return raw === null ? true : raw === 'true';
    }
    catch {
        return true;
    }
}
/** 写入挂件启用状态。 */
export function writeMascotEnabled(value) {
    try {
        localStorage.setItem(MASCOT_STORAGE_KEY, String(value));
    }
    catch {
        // localStorage unavailable
    }
}
let onEnabledChangeCallback = null;
/** 通知挂件开关变化。 */
export function notifyMascotChange(enabled) {
    onEnabledChangeCallback?.(enabled);
}
/**
 * 输入框上方的像素小伙伴挂件。
 *
 * 素材是一组「单行 8 列」雪碧图（见 pet-data.ts）：每个动作一张条带，
 * 每帧固定 PET_CELL_W x PET_CELL_H，逐帧平移窗口即为动画。
 * 播放走 WAAPI steps 关键帧，期间无定时器、无 DOM 变更。
 *
 * 站位：首页站在输入卡片上沿；对话页站在 composerStack 顶端，
 * 因此上方出现排队消息、目标任务或待办卡片时会自动上移到它们之上。
 * 读屏者要求减少动态效果时停在静止帧。
 *
 * @param ctx - 客户端根上下文。
 * @returns 释放函数。
 */
export function initMascot(ctx) {
    let isEnabled = readMascotEnabled();
    const pet = document.createElement('span');
    pet.className = 'dsh-composer-pet';
    pet.setAttribute('aria-hidden', 'true');
    const sprite = document.createElement('span');
    sprite.className = 'dsh-composer-pet-sprite';
    const strip = document.createElement('span');
    strip.className = 'dsh-composer-pet-strip';
    sprite.appendChild(strip);
    pet.appendChild(sprite);
    const hit = document.createElement('span');
    hit.className = 'dsh-composer-pet-hit';
    pet.appendChild(hit);
    let currentAnimation = null;
    let currentKey = 'idle';
    let lockUntil = 0;
    let idleTimer = null;
    let sleepTimer = null;
    let stillTimer = null;
    let holdTimer = null;
    let isSleeping = false;
    let clicks = [];
    let pressStart = null;
    /** 减少动态效果：停在静止帧，只保留点击反应。 */
    function motionReduced() {
        try {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        catch {
            return false;
        }
    }
    function playAnimation(key, loop) {
        const sheet = PET_SHEETS[key];
        if (!sheet)
            return;
        const image = PET_IMAGES[sheet.image];
        if (!image)
            return;
        currentKey = key;
        pet.style.setProperty('--dsh-pet-image', `url("${image}")`);
        pet.setAttribute('data-ready', '');
        pet.setAttribute('data-animation', key);
        if (currentAnimation) {
            currentAnimation.cancel();
            currentAnimation = null;
        }
        if (stillTimer) {
            clearTimeout(stillTimer);
            stillTimer = null;
        }
        // 减少动态效果：停在该动作的静止帧，不启动动画。
        // 一次性动作仍按正常时长收尾，之后回到 idle，否则会永远停在反应帧上。
        if (motionReduced()) {
            strip.style.transform = `translateX(${-(sheet.still * PET_CELL_W)}px)`;
            if (!loop) {
                stillTimer = setTimeout(() => {
                    stillTimer = null;
                    if (currentKey === key)
                        playAnimation('idle', true);
                }, sheet.frames * PET_FRAME_MS);
            }
            return;
        }
        strip.style.transform = '';
        const keyframes = [];
        for (let i = 0; i < sheet.frames; i++) {
            keyframes.push({
                offset: i / sheet.frames,
                transform: `translateX(${-(i * PET_CELL_W)}px)`,
                easing: 'steps(1)',
            });
        }
        keyframes.push({
            offset: 1,
            transform: `translateX(${-(loop ? 0 : (sheet.frames - 1)) * PET_CELL_W}px)`,
        });
        currentAnimation = strip.animate(keyframes, {
            duration: sheet.frames * PET_FRAME_MS,
            iterations: loop ? Infinity : 1,
            fill: 'forwards',
        });
        if (!loop) {
            currentAnimation.finished
                .then(() => {
                if (currentKey === key)
                    playAnimation('idle', true);
            })
                .catch(() => { });
        }
    }
    /**
     * 播放一次反应动作。
     * @param key - 语义动作名。
     * @param holdMs - 锁定其它反应的时长；0 表示不锁。
     * @param holdLoop - 锁定期间是否循环播放该动作（而非播一遍就回 idle）。
     *   失败这类需要「持续一段状态」的动作用 true；跳跃这种一次性动作用 false。
     */
    function triggerReaction(key, holdMs = 0, holdLoop = false) {
        // 失败与拖拽穿透反应锁：失败是最高优先级信号，不该被一次点击反应挡掉
        if (Date.now() < lockUntil && key !== 'drag' && key !== 'failed')
            return;
        if (holdMs > 0)
            lockUntil = Date.now() + holdMs;
        isSleeping = false;
        if (holdLoop && holdMs > 0) {
            playAnimation(key, true);
            if (holdTimer)
                clearTimeout(holdTimer);
            holdTimer = setTimeout(() => {
                holdTimer = null;
                if (currentKey === key)
                    playAnimation('idle', true);
            }, holdMs);
        }
        else {
            playAnimation(key, false);
        }
        scheduleIdleExtra();
        resetSleepTimer();
    }
    // 点击与拖拽交互
    hit.addEventListener('pointerdown', (e) => {
        if (e.button !== 0)
            return;
        e.stopPropagation();
        pressStart = { x: e.clientX, y: e.clientY, id: e.pointerId, lifted: false };
        hit.setPointerCapture(e.pointerId);
    });
    hit.addEventListener('pointermove', (e) => {
        if (!pressStart || pressStart.lifted || e.pointerId !== pressStart.id)
            return;
        if (Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) > 5) {
            pressStart.lifted = true;
            playAnimation('drag', true);
        }
    });
    hit.addEventListener('pointerup', (e) => {
        if (!pressStart || e.pointerId !== pressStart.id)
            return;
        e.stopPropagation();
        const lifted = pressStart.lifted;
        pressStart = null;
        if (lifted) {
            triggerReaction('happy', 2500);
            return;
        }
        const now = Date.now();
        const lastClick = clicks[clicks.length - 1];
        if (lastClick !== undefined && now - lastClick > 450)
            clicks = [];
        clicks.push(now);
        if (clicks.length >= 4) {
            clicks = [];
            triggerReaction('tickle', 2000);
            return;
        }
        const rect = hit.getBoundingClientRect();
        triggerReaction(e.clientX - rect.left < rect.width / 2 ? 'poke-left' : 'poke-right', 1200);
    });
    hit.addEventListener('pointercancel', () => {
        if (pressStart?.lifted)
            playAnimation('idle', true);
        pressStart = null;
    });
    // 点击不冒泡到宿主卡片（首页的「选择工作区」卡片本身就是按钮）
    hit.addEventListener('click', event => { event.stopPropagation(); });
    // 随机闲置小动作（张望 / 挥手 / 端着放大镜细看）
    function scheduleIdleExtra() {
        if (idleTimer)
            clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            if (currentKey === 'idle' && !isSleeping && Date.now() >= lockUntil) {
                const extras = ['idle-look', 'idle-wave', 'idle-laptop'];
                const pick = extras[Math.floor(Math.random() * extras.length)];
                if (pick)
                    playAnimation(pick, false);
            }
            scheduleIdleExtra();
        }, 20000 + Math.random() * 20000);
    }
    // 闲置入睡（1 分钟无操作）
    function resetSleepTimer() {
        if (sleepTimer)
            clearTimeout(sleepTimer);
        sleepTimer = setTimeout(() => {
            if (currentKey === 'idle' && Date.now() >= lockUntil) {
                isSleeping = true;
                playAnimation('sleeping', true);
            }
        }, 60000);
    }
    function onActivity() {
        if (isSleeping) {
            isSleeping = false;
            playAnimation('waking', false);
        }
        resetSleepTimer();
    }
    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    /**
     * 寻找要站的位置：首页站在输入卡片上沿；对话页站在 composerStack 顶端
     * （它同时包含排队消息、目标任务、待办与输入框，因此挂件永远在所有元素之上）；
     * 替代面板（授权/提问）接管输入卡片时站在面板上沿。
     */
    /**
     * composer 区域：只有落在这个子树里的结构变化才可能改变挂件站位。
     * 聊天区流式输出每帧几十上百条 MutationRecord，全部落在对话列里 ——
     * 用 closest 逐条短路，比在 rAF 里对每条变化读 offsetHeight（强制同步布局）便宜两个数量级。
     */
    const COMPOSER_ZONE = '[data-composer-seat], [class*="composerSeat"], [data-phase="hero"], [data-content-phase="hero"], [class*="composerHero"]';
    /**
     * 锚点缓存：一次 DOM 变化风暴里可能连续排多次 syncMount，
     * 而 findAnchor() 内部有多处 offsetHeight（每次都是一次强制同步布局）。
     * 150ms 内的重复请求直接复用，并校验连通性，避免把已卸载的节点当锚点。
     */
    let anchorCache = null;
    function findAnchorCached() {
        if (anchorCache !== null && anchorCache.value.element.isConnected
            && performance.now() - anchorCache.at < 150) {
            return anchorCache.value;
        }
        const fresh = findAnchor();
        anchorCache = fresh === null ? null : { value: fresh, at: performance.now() };
        return fresh;
    }
    function findAnchor() {
        const isHero = document.querySelector('[data-phase="hero"], [data-content-phase="hero"]') !== null
            || document.querySelector('[class*="composerHero"]') !== null;
        if (isHero) {
            const heroCard = document.querySelector('[class*="composerHero"] [class$="_card"], [class*="composerStack"] > section, [data-composer-card]');
            if (heroCard && heroCard.offsetHeight > 0)
                return { element: heroCard, place: 'card' };
        }
        const seat = document.querySelector('[data-composer-seat], [class*="composerSeat"]');
        if (seat && seat.offsetHeight > 0) {
            const fallback = seat.querySelector('[data-chain-overlay-fallback="conversation.composer"]');
            if (fallback && fallback.style.display === 'none') {
                const panel = fallback.nextElementSibling;
                if (panel && panel.offsetHeight > 0)
                    return { element: panel, place: 'panel' };
            }
            const stack = seat.querySelector('[class*="_composerStack"], [class*="composerStack"]');
            if (stack && stack.offsetHeight > 0)
                return { element: stack, place: 'stack' };
            const card = seat.querySelector('[class$="_card"], [data-composer-card]');
            if (card && card.offsetHeight > 0)
                return { element: card, place: 'card' };
        }
        const anyCard = document.querySelector('[data-composer-card]');
        if (anyCard && anyCard.offsetHeight > 0)
            return { element: anyCard, place: 'card' };
        return null;
    }
    function detach() {
        if (pet.parentElement) {
            pet.parentElement.removeAttribute('data-dsh-pet-anchor');
            pet.remove();
        }
    }
    function syncMount() {
        if (!isEnabled) {
            detach();
            return;
        }
        const anchor = findAnchorCached();
        if (!anchor) {
            detach();
            return;
        }
        const currentAnchor = pet.parentElement;
        if (currentAnchor !== anchor.element) {
            if (currentAnchor)
                currentAnchor.removeAttribute('data-dsh-pet-anchor');
            anchor.element.style.position = 'relative';
            anchor.element.setAttribute('data-dsh-pet-anchor', anchor.place);
            anchor.element.appendChild(pet);
        }
        else if (anchor.element.getAttribute('data-dsh-pet-anchor') !== anchor.place) {
            anchor.element.setAttribute('data-dsh-pet-anchor', anchor.place);
        }
    }
    function start() {
        syncMount();
        if (isEnabled) {
            playAnimation('idle', true);
            scheduleIdleExtra();
            resetSleepTimer();
        }
    }
    function stopTimers() {
        if (idleTimer) {
            clearTimeout(idleTimer);
            idleTimer = null;
        }
        if (sleepTimer) {
            clearTimeout(sleepTimer);
            sleepTimer = null;
        }
        if (stillTimer) {
            clearTimeout(stillTimer);
            stillTimer = null;
        }
        if (holdTimer) {
            clearTimeout(holdTimer);
            holdTimer = null;
        }
    }
    // 开关变更：立即卸载 / 重新挂载
    onEnabledChangeCallback = (val) => {
        isEnabled = val;
        if (isEnabled) {
            start();
        }
        else {
            detach();
            if (currentAnimation) {
                currentAnimation.cancel();
                currentAnimation = null;
            }
            stopTimers();
        }
    };
    // ── 挂载跟随：MutationObserver 替代 500ms 轮询 ─────────────────────────
    // syncMount 的本质是「宿主重渲染后把 pet 重新挂到新锚点上」。它只看 DOM 结构，
    // 正是 MutationObserver 的适用场景；原先 500ms 固定轮询会在空闲时也反复调用
    // findAnchor()（内部多处 offsetHeight，属强制同步布局）。改为事件驱动后，
    // 无 DOM 变化时零开销。
    //
    // 四条约束：
    // 1. 必须 rAF 节流 —— 回调里 findAnchor() 要读 offsetHeight，
    //    在 mutation 批次内直接读布局会触发 layout thrashing。
    // 2. 用 { childList: true, subtree: true }，不监听 attributes：
    //    锚点切换由结构变化驱动，属性变化（主题切换等）与本函数无关，监听会放大噪音。
    // 3. 保留低频兜底（2s）：MutationObserver 不覆盖「纯样式变化导致的显隐切换」，
    //    这一点与 status-rotator 的取舍一致，但间隔从 500ms 放宽到 2000ms。
    //
    // 4. **按记录过滤后才排帧**（2026-10-29 性能修复，掉帧主因）：
    //    body 级观察器对聊天区每个 token 都会收到记录，原实现在每帧无条件跑
    //    syncMount() → findAnchor() 的 8 处 offsetHeight，等于流式输出期间
    //    「每帧一次强制同步布局」。现在只有下列两种情况才算「站位可能变」：
    //      a. 挂件已脱离原位（宿主重渲染把 pet 摘掉 / 锚点断开）；
    //      b. 变化落在 composer 区域内，或落在锚点自身的子树里。
    //    聊天区 token 变化既不在 composer 区域也不在锚点内 → 直接丢弃。
    /** 这批变化是否可能影响挂件站位。 */
    function affectsMascot(records) {
        const anchor = pet.parentElement;
        // 锚点还在 DOM 里的情况下被断开（宿主重渲染换了容器）：必须重算。
        if (anchor !== null && !anchor.isConnected)
            return true;
        // anchor === null 表示挂件尚未挂载。此时不必急着重算 —— findAnchor() 的
        // 全部候选都锚在 composer 区域内，所以只有 composer 区域的变化才可能让它命中。
        for (let i = 0; i < records.length; i += 1) {
            const record = records[i];
            if (record === undefined)
                continue;
            const target = record.target;
            const el = target instanceof Element ? target : target.parentElement;
            if (el === null)
                continue;
            if (anchor !== null) {
                // ⚠️ 锚点**内部**的变化不改变锚点身份 —— 挂件用 CSS bottom:100% 定位，
                // 锚点变高变矮由 CSS 自动跟随，无需 JS 重算。
                // 🚨 这一条是「打字掉帧」的关键：输入框就在锚点子树里，每敲一个字符都会
                // 产生 childList 记录；若不排除，等于每次击键都跑一遍 findAnchor() 的 8 处
                // offsetHeight（强制同步布局）。P0-1 首版只优化了流式输出，漏了这条。
                if (el === anchor || anchor.contains(el))
                    continue;
                // 锚点的**祖先**被改写（容器替换 / 祖先被摘除）→ 锚点可能整体失效。
                if (el.contains(anchor))
                    return true;
            }
            // composer 区域出现新节点（首页 ↔ 对话页切换、输入坞重建、替代面板接管）。
            if (el.closest(COMPOSER_ZONE) !== null)
                return true;
        }
        return false;
    }
    let mountRaf = 0;
    const scheduleSyncMount = (records) => {
        // 后台标签页不排版，等可见后再补。
        if (document.hidden)
            return;
        if (mountRaf !== 0)
            return;
        if (records !== undefined && !affectsMascot(records))
            return;
        mountRaf = requestAnimationFrame(() => {
            mountRaf = 0;
            syncMount();
        });
    };
    const mountObserver = new MutationObserver(scheduleSyncMount);
    mountObserver.observe(document.body, { childList: true, subtree: true });
    // 兜底：MutationObserver 不覆盖「纯样式变化导致的显隐切换」，低频补扫。
    const mountInterval = setInterval(() => {
        if (document.hidden)
            return;
        scheduleSyncMount();
    }, 2000);
    start();
    function readSessions() {
        try {
            return ctx.get('sessions');
        }
        catch {
            return undefined;
        }
    }
    function readCurrentId() {
        try {
            return readSessions()?.list?.getSnapshot?.()?.current;
        }
        catch {
            return undefined;
        }
    }
    function readRunning() {
        try {
            const snap = readSessions()?.list?.getSnapshot?.();
            if (!snap?.byId)
                return false;
            const cur = snap.current;
            if (cur !== undefined)
                return snap.byId[cur]?.running === true;
            // 没有当前会话时，任一在跑的会话也算工作
            return (snap.ids ?? []).some(id => snap.byId?.[id]?.running === true);
        }
        catch {
            return false;
        }
    }
    // ── 失败检测（failed 动作的唯一触发源）────────────────────────────────
    // 列表快照只有 running 位，失败信息不在里面，必须读会话事件流：
    //   · turn/end          reason.kind 为 error / blocked
    //   · tool/result        message.isError 且不是用户主动中断的 AbortError
    //   · compaction/end    带 error
    // 只处理订阅之后 **append** 的事件（replace / prepend 是打开历史会话时的回放，
    // 不能把旧失败当成刚发生）。
    let lastFailureAt = 0;
    function entryIsFailure(entry) {
        if (typeof entry !== 'object' || entry === null)
            return false;
        const e = entry;
        if (e.type !== 'event' || !e.event)
            return false;
        const ev = e.event;
        const data = (ev.data ?? {});
        if (ev.type === 'turn/end') {
            const kind = data.reason?.kind;
            // aborted / interrupted 是用户主动停止或崩溃收尾，不算失败
            return kind === 'error' || kind === 'blocked';
        }
        if (ev.type === 'tool/result') {
            if (data.message?.isError !== true)
                return false;
            const name = data.error?.name;
            return name !== 'AbortError';
        }
        if (ev.type === 'compaction/end')
            return data.error !== undefined;
        return false;
    }
    function onSessionEvents() {
        if (!isEnabled)
            return;
        const id = subscribedSession;
        if (id === undefined)
            return;
        try {
            const snap = readSessions()?.binding?.(id)?.eventSource?.getSnapshot?.();
            const change = snap?.change;
            if (change?.kind !== 'append')
                return;
            const entries = change.entries ?? [];
            for (const entry of entries) {
                if (entryIsFailure(entry)) {
                    lastFailureAt = Date.now();
                    // 垂头丧气持续 5 秒（循环播放，期间不被其它反应抢占），结束后回 idle
                    triggerReaction('failed', 5000, true);
                    break;
                }
            }
        }
        catch {
            // 事件流不可用时静默
        }
    }
    // 事件订阅随「当前会话」切换而重建（切会话要换 binding）
    let subscribedSession;
    let unsubscribeEvents;
    function syncEventSubscription() {
        const id = readCurrentId();
        if (id === subscribedSession)
            return;
        unsubscribeEvents?.();
        unsubscribeEvents = undefined;
        subscribedSession = id;
        if (id === undefined)
            return;
        try {
            unsubscribeEvents = readSessions()?.binding?.(id)?.eventSource?.subscribe?.(onSessionEvents);
        }
        catch {
            unsubscribeEvents = undefined;
        }
    }
    let prevRunning = false;
    function onSessionTick() {
        if (!isEnabled)
            return;
        syncEventSubscription();
        const running = readRunning();
        if (running === prevRunning)
            return;
        prevRunning = running;
        if (running) {
            // 开始工作：等待/思考
            playAnimation('thinking', true);
        }
        else if (Date.now() - lastFailureAt > 6000) {
            // 一轮结束：跳跃庆祝。刚失败过就不庆祝（failed 已经演过了）。
            triggerReaction('happy', 4000);
        }
    }
    // ── 会话状态跟随：订阅 list 替代 400ms 轮询 ───────────────────────────
    // onSessionTick 只做两件事：重建事件订阅、比较 running 位。
    // ctx.sessions.list 是 ObservableSnapshot（getSnapshot + subscribe），
    // running 变化时会主动通知 —— 没有理由每 400ms 主动读一次快照。
    //
    // 兜底策略：list 服务尚未就绪时 subscribe 拿不到，退回 2000ms 低频轮询；
    // 一旦订阅成功立即清掉轮询。这是唯一需要的重试点（服务晚于插件就绪）。
    let unsubscribeList;
    let listFallbackTimer = null;
    function startSessionWatch() {
        if (unsubscribeList !== undefined)
            return;
        const subscribe = readSessions()?.list?.subscribe;
        if (typeof subscribe !== 'function') {
            // 服务未就绪：低频兜底，继续等下一轮重试订阅
            if (listFallbackTimer === null) {
                listFallbackTimer = setInterval(onSessionTick, 2000);
            }
            return;
        }
        if (listFallbackTimer !== null) {
            clearInterval(listFallbackTimer);
            listFallbackTimer = null;
        }
        try {
            unsubscribeList = subscribe(onSessionTick);
        }
        catch {
            unsubscribeList = undefined;
            if (listFallbackTimer === null) {
                listFallbackTimer = setInterval(onSessionTick, 2000);
            }
        }
    }
    startSessionWatch();
    syncEventSubscription();
    return () => {
        onEnabledChangeCallback = null;
        clearInterval(mountInterval);
        mountObserver.disconnect();
        if (mountRaf !== 0) {
            cancelAnimationFrame(mountRaf);
            mountRaf = 0;
        }
        if (listFallbackTimer !== null) {
            clearInterval(listFallbackTimer);
            listFallbackTimer = null;
        }
        unsubscribeList?.();
        unsubscribeList = undefined;
        unsubscribeEvents?.();
        unsubscribeEvents = undefined;
        stopTimers();
        window.removeEventListener('mousemove', onActivity);
        window.removeEventListener('keydown', onActivity);
        if (currentAnimation)
            currentAnimation.cancel();
        detach();
    };
}
//# sourceMappingURL=mascot.js.map