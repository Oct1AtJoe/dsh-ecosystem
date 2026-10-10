import { CRAB_FRAME_MS, CRAB_SHEETS, CRAB_SHEET_URLS } from './mascot-data';
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
export function initMascot(ctx) {
    let isEnabled = readMascotEnabled();
    // 构建 DOM 节点
    const crab = document.createElement('span');
    crab.className = 'dsh-claude-crab';
    crab.setAttribute('aria-hidden', 'true');
    const sprite = document.createElement('span');
    sprite.className = 'dsh-claude-crab-sprite';
    const strip = document.createElement('span');
    strip.className = 'dsh-claude-crab-strip';
    sprite.appendChild(strip);
    crab.appendChild(sprite);
    const hit = document.createElement('span');
    hit.className = 'dsh-claude-crab-hit';
    crab.appendChild(hit);
    let currentAnimation = null;
    let currentKey = 'idle';
    let lockUntil = 0;
    let idleTimer = null;
    let sleepTimer = null;
    let isSleeping = false;
    let clicks = [];
    let pressStart = null;
    function playAnimation(key, loop) {
        const meta = CRAB_SHEETS[key];
        const sheet = CRAB_SHEET_URLS[key];
        if (!meta || !sheet)
            return;
        currentKey = key;
        crab.style.setProperty('--dsh-claude-crab-sheet', `url("${sheet.body}")`);
        crab.style.setProperty('--dsh-claude-crab-ink', `url("${sheet.ink}")`);
        crab.style.setProperty('--dsh-claude-crab-x', String(meta.box[0]));
        crab.style.setProperty('--dsh-claude-crab-y', String(meta.box[1]));
        crab.style.setProperty('--dsh-claude-crab-w', String(meta.box[2]));
        crab.style.setProperty('--dsh-claude-crab-h', String(meta.box[3]));
        crab.style.setProperty('--dsh-claude-crab-cell-w', String(meta.box[2]));
        crab.style.setProperty('--dsh-claude-crab-strip-h', String(meta.box[3] * Math.ceil(meta.frames / 8)));
        crab.setAttribute('data-ready', '');
        crab.setAttribute('data-animation', key);
        const keyframes = [];
        for (let i = 0; i < meta.frames; i++) {
            const col = i % 8;
            const row = Math.floor(i / 8);
            keyframes.push({
                offset: i / meta.frames,
                transform: `translate(${-(col * meta.box[2]) * 2}px, ${-(row * meta.box[3]) * 2}px)`,
                easing: 'steps(1)',
            });
        }
        keyframes.push({
            offset: 1,
            transform: `translate(${-(meta.box[2] * (loop ? 0 : (meta.frames - 1) % 8)) * 2}px, ${-(meta.box[3] * (loop ? 0 : Math.floor((meta.frames - 1) / 8))) * 2}px)`,
        });
        if (currentAnimation) {
            currentAnimation.cancel();
            currentAnimation = null;
        }
        currentAnimation = strip.animate(keyframes, {
            duration: meta.frames * CRAB_FRAME_MS,
            iterations: loop ? Infinity : 1,
            fill: 'forwards',
        });
        if (!loop) {
            currentAnimation.finished
                .then(() => {
                if (currentKey === key) {
                    playAnimation('idle', true);
                }
            })
                .catch(() => { });
        }
    }
    function triggerReaction(key, holdMs = 0) {
        if (Date.now() < lockUntil && key !== 'drag')
            return;
        if (holdMs > 0)
            lockUntil = Date.now() + holdMs;
        isSleeping = false;
        playAnimation(key, false);
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
        if (pressStart?.lifted) {
            playAnimation('idle', true);
        }
        pressStart = null;
    });
    // 随机闲置小动作 (看一看 / 挥挥手 / 搬出电脑敲代码)
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
    // 闲置入睡机制 (1分钟无操作打瞌睡)
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
    // 寻找输入框并贴靠挂载：
    // 首页精准贴靠新会话输入卡片；对话页贴靠 composerStack 顶端，
    // 确保当上方存在排队队列（Queue）、目标任务（Goal）、待办（Todo）时，小螃蟹自动上移至所有元素上方。
    function findAnchor() {
        // 1. 判断是否处于首页 (Hero 阶段)
        const isHero = document.querySelector('[data-phase="hero"], [data-content-phase="hero"]') !== null
            || document.querySelector('[class*="composerHero"]') !== null;
        if (isHero) {
            // 首页：小螃蟹必须精准站在输入卡片上，不能挂在包含大标题与问候语的 composerStack 顶部
            const heroCard = document.querySelector('[class*="composerHero"] [class$="_card"], [class*="composerStack"] > section, [data-composer-card]');
            if (heroCard && heroCard.offsetHeight > 0) {
                return { element: heroCard, place: 'card' };
            }
        }
        // 2. 对话页 (Active 阶段)
        const seat = document.querySelector('[data-composer-seat], [class*="composerSeat"]');
        if (seat && seat.offsetHeight > 0) {
            // 检查是否有替代面板（例如授权确认/问题回答面板）
            const fallback = seat.querySelector('[data-chain-overlay-fallback="conversation.composer"]');
            if (fallback && fallback.style.display === 'none') {
                const panel = fallback.nextElementSibling;
                if (panel && panel.offsetHeight > 0) {
                    return { element: panel, place: 'panel' };
                }
            }
            // 核心：优先挂载到 composerStack！
            // composerStack 垂直包含 [conversation.input.dock]（队列消息/目标任务/待办任务）和 [inputBar]。
            // 小螃蟹设置 bottom: 100%，因此当上方有排队消息或目标卡片时，它会自动站在所有元素的最顶上！
            const stack = seat.querySelector('[class*="_composerStack"], [class*="composerStack"]');
            if (stack && stack.offsetHeight > 0) {
                return { element: stack, place: 'stack' };
            }
            // 如果找不到 stack，兜底到输入卡片
            const card = seat.querySelector('[class$="_card"], [data-composer-card]');
            if (card && card.offsetHeight > 0) {
                return { element: card, place: 'card' };
            }
        }
        // 3. 全局兜底：任何可见的输入卡片
        const anyCard = document.querySelector('[data-composer-card]');
        if (anyCard && anyCard.offsetHeight > 0) {
            return { element: anyCard, place: 'card' };
        }
        return null;
    }
    function syncMount() {
        if (!isEnabled) {
            if (crab.parentElement) {
                crab.parentElement.removeAttribute('data-dsh-mascot-anchor');
                crab.remove();
            }
            return;
        }
        const anchor = findAnchor();
        if (!anchor) {
            if (crab.parentElement) {
                crab.parentElement.removeAttribute('data-dsh-mascot-anchor');
                crab.remove();
            }
            return;
        }
        const currentAnchor = crab.parentElement;
        if (currentAnchor !== anchor.element) {
            if (currentAnchor) {
                currentAnchor.removeAttribute('data-dsh-mascot-anchor');
            }
            anchor.element.style.position = 'relative';
            anchor.element.setAttribute('data-dsh-mascot-anchor', anchor.place);
            anchor.element.appendChild(crab);
        }
        else {
            if (anchor.element.getAttribute('data-dsh-mascot-anchor') !== anchor.place) {
                anchor.element.setAttribute('data-dsh-mascot-anchor', anchor.place);
            }
        }
    }
    // 开关变更回调监听
    onEnabledChangeCallback = (val) => {
        isEnabled = val;
        if (isEnabled) {
            syncMount();
            playAnimation('idle', true);
            scheduleIdleExtra();
            resetSleepTimer();
        }
        else {
            if (crab.parentElement) {
                crab.parentElement.removeAttribute('data-dsh-mascot-anchor');
                crab.remove();
            }
            if (currentAnimation)
                currentAnimation.cancel();
            if (idleTimer)
                clearTimeout(idleTimer);
            if (sleepTimer)
                clearTimeout(sleepTimer);
        }
    };
    // 定时与DOM变更时保持贴靠
    const mountInterval = setInterval(syncMount, 500);
    syncMount();
    if (isEnabled) {
        playAnimation('idle', true);
        scheduleIdleExtra();
        resetSleepTimer();
    }
    // 状态监听：跟随 AI 会话活动
    let prevRunning = false;
    const stateInterval = setInterval(() => {
        if (!isEnabled)
            return;
        try {
            const sessionService = ctx.get('session');
            const running = sessionService?.running ?? false;
            if (running && !prevRunning) {
                prevRunning = true;
                // 正在思考/打字
                playAnimation(Math.random() > 0.5 ? 'thinking' : 'typing', true);
            }
            else if (!running && prevRunning) {
                prevRunning = false;
                // 刚刚完成，开心跳跃
                triggerReaction('happy', 4000);
            }
        }
        catch {
            // 容错
        }
    }, 400);
    return () => {
        onEnabledChangeCallback = null;
        clearInterval(mountInterval);
        clearInterval(stateInterval);
        if (idleTimer)
            clearTimeout(idleTimer);
        if (sleepTimer)
            clearTimeout(sleepTimer);
        window.removeEventListener('mousemove', onActivity);
        window.removeEventListener('keydown', onActivity);
        if (currentAnimation)
            currentAnimation.cancel();
        if (crab.parentElement)
            crab.remove();
    };
}
//# sourceMappingURL=mascot.js.map