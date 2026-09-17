// Desktop pet window renderer - transparent, draggable.
const DSH_BASE = 'http://127.0.0.1:3080';
const CONFIG_URL = `${DSH_BASE}/kanye-pet/config`;
const STATE_URL = `${DSH_BASE}/kanye-pet/state`;
const ASSETS = `${DSH_BASE}/kanye-pet/assets`;
const SOUNDS_BASE = `${ASSETS}/sounds`;
const MANIFEST_URL = `${ASSETS}/manifest.json`;
const POLL_MS = 2000;

const pet = document.getElementById('pet');

let manifest = null;
let manifestReady = false;
let characterId = 'kanye';
let animState = null;
let frame = 0;
let frameDir = 1;
let lastFrameAt = 0;
let currentConfig = { enabled: true, size: 200, character: 'kanye', opacity: 1 };
let dragging = false;
let dragStart = null;            // { screenX, screenY, clientX, clientY, pointerId }
let isDragging = false;          // 越过 6px 阈值后才判定为拖拽
let dragRafId = null;            // requestAnimationFrame id（节流 set_position）
let pendingPos = null;           // { x, y } 等待 flush 的位置
let clickReactionTimer = null;   // 点击反馈动画定时器

// ---- 气泡通知 ----
let lastNotifTag = null
let bubbleEl = null
let bubbleTimer = null
let currentNotif = null


// RAF 节流：只发最后一帧位置，避免 IPC 风暴
function scheduleSetPosition(x, y) {
  pendingPos = { x: Math.round(x), y: Math.round(y) };
  if (!dragRafId) {
    dragRafId = requestAnimationFrame(() => {
      dragRafId = null;
      if (!pendingPos) return;
      const invoke = window.__TAURI_INTERNALS__?.invoke;
      if (typeof invoke !== 'function') return;
      invoke('plugin:window|set_position', {
        value: { Logical: { x: pendingPos.x, y: pendingPos.y } },
      }).catch(() => {});
      pendingPos = null;
    });
  }
}

function handlePointerDown(e) {
  if (e.button !== 0) return;
  e.preventDefault();
  // 首次用户手势：解锁 AudioContext（自动播放策略下 suspended 的 ctx 不出声），只做一次
  if (!audioPrimed) { audioPrimed = true; primeAudio(); }
  dragStart = {
    screenX: e.screenX,
    screenY: e.screenY,
    clientX: e.clientX,
    clientY: e.clientY,
    pointerId: e.pointerId,
  };
  isDragging = false;
  dragging = false;
}

function handlePointerMove(e) {
  if (!dragStart) return;
  // 仅在位移超过 6px 阈值后才判定为拖拽并开始移窗，避免纯点击时微动导致窗口飞出屏幕
  if (!isDragging) {
    if (Math.hypot(e.screenX - dragStart.screenX, e.screenY - dragStart.screenY) <= 6) {
      return;
    }
    isDragging = true;
    dragging = true;
    pet.style.cursor = 'grabbing';
    try { pet.setPointerCapture(dragStart.pointerId); } catch {}
  }
  // 用 clientX/Y 直接作为抓取锚点偏移，数学上天然自洽，杜绝多屏/DPI/初始化时序错位
  const newX = e.screenX - dragStart.clientX;
  const newY = e.screenY - dragStart.clientY;
  scheduleSetPosition(newX, newY);
}

function handlePointerUp(e) {
  if (!dragStart) return;
  const wasDragging = isDragging;
  if (pet.hasPointerCapture(e.pointerId)) {
    try { pet.releasePointerCapture(e.pointerId); } catch {}
  }
  if (dragRafId) {
    cancelAnimationFrame(dragRafId);
    dragRafId = null;
  }
  if (wasDragging) {
    // 拖拽完成：若有挂起位置则 flush
    const invoke = window.__TAURI_INTERNALS__?.invoke;
    if (typeof invoke === 'function' && pendingPos) {
      invoke('plugin:window|set_position', {
        value: { Logical: { x: pendingPos.x, y: pendingPos.y } },
      }).catch(() => {});
      pendingPos = null;
    }
  } else {
    // 纯点击：丢弃未拖拽的挂起位置，触发点击动画反馈与主窗口唤起
    pendingPos = null;
    handleClick();
  }
  dragStart = null;
  isDragging = false;
  dragging = false;
  pet.style.cursor = 'grab';
}

function handleClick() {
  playClickReaction();
  const invoke = window.__TAURI_INTERNALS__?.invoke;
  if (typeof invoke === 'function') {
    invoke('pet_show_main').catch(() => {});
  }
}

function playClickReaction() {
  const character = manifest?.characters?.[characterId];
  const reactState = character?.states?.['joy'] ? 'joy' : (character?.states?.['celebrate'] ? 'celebrate' : null);
  if (!reactState) return;
  clearTimeout(clickReactionTimer);
  animState = reactState;
  frame = 0;
  frameDir = 1;
  lastFrameAt = 0;
  showState(reactState);
  clickReactionTimer = setTimeout(() => {
    animState = 'idle';
    frame = 0;
    frameDir = 1;
    lastFrameAt = 0;
    showState('idle');
  }, 1200);
}

function setupDrag() {
  // pointerdown → capture → pointermove/up（setPointerCapture 保证移出元素仍收事件）
  pet.addEventListener('pointerdown', handlePointerDown);
  pet.addEventListener('pointermove', handlePointerMove);
  pet.addEventListener('pointerup', handlePointerUp);
  pet.addEventListener('pointercancel', handlePointerUp);
}

// ---- 气泡通知 ----
// 通知类型 → 音效文件名映射
var REASON_SOUND = {
  question: 'pending',
  'plan-review': 'pending',
  approval: 'pending',
  completed: 'complete',
  error: 'error',
  aborted: 'notify',
  interrupted: 'notify',
  'max-tokens': 'notify',
  blocked: 'pending',
}

// ---- 音效状态 ----
// 音量/开关的权威来源是服务器 config.sound（config.mjs 的 DEFAULTS 单一来源）；
// 这里的初值只用于服务器配置尚未到达时兜底，配置到达后即被覆盖。
var soundVol = 0.3
var soundOn = true
// 自定义音效探测结果：null=未探测；对象里 name → Audio 元素（有音效）/ null（无）/ undefined（探测中）
var soundProbe = null
var audioPrimed = false
var lastSoundAt = 0
var SOUND_MIN_GAP_MS = 250   // 连续通知的最小间隔，防多条通知叠成爆音
// 各类合成音的相对响度权重（最终增益 = soundVol × 权重）。
// 旧值是各自硬编码 0.12/0.15/0.2/0.05：error 明显偏响、notify 几乎听不见，这里归一化。
var SYNTH_WEIGHT = { complete: 0.5, pending: 0.6, error: 0.7, notify: 0.35 }

// Web Audio API 上下文（懒初始化）
var audioCtx = null
function getAudioCtx() {
  if (!audioCtx) {
    var Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    audioCtx = new Ctx()
  }
  // 自动播放策略：无用户手势时新建的 ctx 处于 suspended，声音会被直接丢弃；
  // 且用户手势不会自动恢复已存在的 ctx——不显式 resume，整个进程生命周期内都哑。
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(function() {})
  return audioCtx
}

/** 借首次用户手势解锁 AudioContext：播一个 0 音量的极短音，听不见，只为把 ctx 推到 running。 */
function primeAudio() {
  var ctx = getAudioCtx()
  if (!ctx) return
  try {
    var osc = ctx.createOscillator()
    var gain = ctx.createGain()
    gain.gain.value = 0
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + 0.01)
  } catch (e) {}
}

function playTone(ctx, freq, start, vol, dur) {
  var osc = ctx.createOscillator()
  var gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(vol, start + 0.01)
  gain.gain.linearRampToValueAtTime(0, start + dur)
  osc.connect(gain); gain.connect(ctx.destination)
  osc.start(start); osc.stop(start + dur + 0.01)
}

function playSweep(ctx, f0, f1, start, vol, dur) {
  var osc = ctx.createOscillator()
  var gain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(f0, start)
  osc.frequency.linearRampToValueAtTime(f1, start + dur)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(vol, start + 0.01)
  gain.gain.linearRampToValueAtTime(0, start + dur)
  osc.connect(gain); gain.connect(ctx.destination)
  osc.start(start); osc.stop(start + dur + 0.01)
}

function playComplete(ctx, vol) {
  var now = ctx.currentTime
  playTone(ctx, 523, now, vol, 0.15)   // C5
  playTone(ctx, 659, now + 0.14, vol, 0.2)  // E5
}

function playPending(ctx, vol) {
  playTone(ctx, 440, ctx.currentTime, vol, 0.25)  // A4 soft chime
}

function playError(ctx, vol) {
  playSweep(ctx, 200, 100, ctx.currentTime, vol, 0.35)  // descending buzz
}

function playNotify(ctx, vol) {
  playTone(ctx, 660, ctx.currentTime, vol, 0.1)  // short pip
}

// 启动时一次性探测四个自定义音效：存在的建好 Audio 并 preload，避免每条通知都
// 跑一次 HEAD（默认没有 sounds 目录时，等于每条通知都白跑一趟 404 才回退合成）。
var SOUND_NAMES = ['complete', 'pending', 'error', 'notify']
function probeSounds() {
  soundProbe = {}
  for (var i = 0; i < SOUND_NAMES.length; i++) probeOneSound(SOUND_NAMES[i])
}

function probeOneSound(name) {
  var url = SOUNDS_BASE + '/' + name + '.wav'
  var req = new XMLHttpRequest()
  req.open('HEAD', url, true)
  req.onload = function() {
    if (req.status === 200) {
      var a = new Audio(url)
      a.preload = 'auto'
      a.volume = soundVol
      a.load()
      soundProbe[name] = a
    } else {
      soundProbe[name] = null
    }
  }
  req.onerror = function() { soundProbe[name] = null }
  req.send()
}

/** 播通知音效：优先用自定义 wav（已预加载），缺失/失败则回退 Web Audio 合成。 */
function playNotifSound(reason) {
  if (!soundOn) return
  var now = Date.now()
  if (now - lastSoundAt < SOUND_MIN_GAP_MS) return   // 连续通知节流，防叠加
  lastSoundAt = now

  var name = REASON_SOUND[reason] || 'notify'
  if (soundProbe === null) {          // 配置尚未到达（探测还没启动）
    playSynth(name)
    return
  }
  var cached = soundProbe[name]
  if (cached === undefined || cached === null) { playSynth(name); return }  // 探测中 / 无自定义音效
  try {
    cached.volume = soundVol
    // 元数据未加载时写 currentTime 会抛 InvalidStateError，跳过即可（preload 后自然就绪）
    if (cached.readyState > 0) cached.currentTime = 0
    var p = cached.play()
    if (p && typeof p.catch === 'function') p.catch(function() { playSynth(name) })
  } catch (e) { playSynth(name) }
}

function playSynth(name) {
  try {
    var ctx = getAudioCtx()
    if (!ctx) return
    var vol = soundVol * (SYNTH_WEIGHT[name] || 0.5)
    if (vol <= 0) return
    switch (name) {
      case 'complete': playComplete(ctx, vol); break
      case 'pending': playPending(ctx, vol); break
      case 'error': playError(ctx, vol); break
      default: playNotify(ctx, vol); break
    }
  } catch(e) {}
}

function showBubble(n) {
  if (!n || n.tag === lastNotifTag) { console.log('[pet] showBubble skip: n=', !!n, 'tagRepeat=', n?.tag === lastNotifTag, 'lastTag=', lastNotifTag); return }
  console.log('[pet] showBubble SHOW:', n.title, n.body, 'tag=', n.tag, 'reason=', n.reason)
  playNotifSound(n.reason)
  lastNotifTag = n.tag
  currentNotif = n
  if (!bubbleEl) {
    bubbleEl = document.createElement('div')
    bubbleEl.id = 'pet-bubble'
    bubbleEl.style.display = 'none'
    document.body.appendChild(bubbleEl)
    bubbleEl.addEventListener('click', () => {
      if (!currentNotif) return
      clearTimeout(bubbleTimer)
      bubbleEl.style.display = 'none'
      const sessionId = currentNotif.sessionId
      currentNotif = null
      const invoke = window.__TAURI_INTERNALS__?.invoke
      if (typeof invoke === 'function') {
        invoke('pet_open_session', { sessionId }).catch(() => {})
      }
    })
  }
  bubbleEl.innerHTML = `<strong>${escapeHtml(n.title)}</strong><span>${escapeHtml(n.body)}</span>`
  bubbleEl.style.display = 'flex'   // flex column：标题/正文分行（CSS 里已定 flex-direction）
  clearTimeout(bubbleTimer)
  bubbleTimer = setTimeout(() => { bubbleEl.style.display = 'none' }, 8000)
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

// ---- Config ----
// enabled: 控制 Web GUI 内浮宠（浏览器 client half）
// desktopPetEnabled: 控制 Tauri 桌面窗口宠物（本文件）
/** 应用音效配置并在配置首次到达时探测自定义音效（只探测一次）。 */
function applySoundConfig(config) {
  var s = config?.sound
  soundOn = s?.enabled !== false
  var v = Number(s?.volume)
  if (Number.isFinite(v)) soundVol = Math.min(1, Math.max(0, v))
  if (soundProbe === null) probeSounds()
}

async function applyConfig(config) {
  currentConfig = { ...currentConfig, ...config };
  applySoundConfig(config);
  const show = config.desktopPetEnabled !== false;
  document.body.style.opacity = show ? String(config.opacity ?? 1) : '0';
  document.body.style.pointerEvents = show ? 'auto' : 'none';
  // 尺寸变更：按素材比例 122×207 设窗口，不拉伸
  const newSize = Math.min(300, Number(config.size));
  if (Number.isFinite(newSize) && newSize > 0) {
    const FRAME_W = 122, FRAME_H = 207; // 裁剪后每帧尺寸
    const winW = Math.round(newSize);
    const winH = Math.round(newSize * FRAME_H / FRAME_W);
    const invoke = window.__TAURI_INTERNALS__?.invoke;
    if (invoke && winW > 0 && winH > 0) {
      try {
        await invoke('plugin:window|set_size', {
          value: { Logical: { width: winW, height: winH } },
        });
      } catch (e) {
        console.warn('[pet] resize failed:', e);
      }
    }
  }
}

// ---- Asset loading ----
async function loadSheet(sheet) {
  try {
    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
      img.src = `${ASSETS}/characters/${characterId}/${sheet}`;
    });
  } catch {}
}

async function switchCharacter(nextId) {
  if (nextId === characterId) return;
  characterId = nextId;
  animState = null;
  frame = 0;
}

function resolveCharacterFromConfig(config) {
  const fallback = manifest?.default || 'kanye';
  const id = config?.character && manifest?.characters?.[config.character]
    ? config.character
    : fallback;
  if (id !== characterId) void switchCharacter(id);
}

async function loadManifest() {
  try {
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) return;
    manifest = await res.json();
    manifestReady = true;
    resolveCharacterFromConfig(currentConfig);
  } catch {}
}

// ---- Rendering ----
function showState(name) {
  const character = manifest?.characters?.[characterId];
  const set = character?.states?.[name];
  if (!set) return;
  void loadSheet(set.sheet);
  pet.style.backgroundImage = `url("${ASSETS}/characters/${characterId}/${set.sheet}")`;
  pet.style.backgroundSize = 'auto 100%';
  applyFrame(set.frames);
}

function applyFrame(frames) {
  if (frames <= 1) {
    pet.style.backgroundPosition = '0 0';
  } else {
    const pct = (frame / (frames - 1)) * 100;
    pet.style.backgroundPosition = `${pct}% 0`;
  }
}

function tick() {
  if (!manifest || !currentConfig.enabled || dragging) return;
  if (currentConfig.desktopPetEnabled === false) return;
  const character = manifest.characters?.[characterId];
  if (!character) return;
  const state = animState || 'idle';
  if (animState === null) {
    animState = state;
    frame = 0;
    frameDir = 1;
    lastFrameAt = 0;
    showState(state);
    return;
  }
  const set = character.states?.[state];
  if (!set || set.frames <= 1) return;
  const now = Date.now();
  if (now - lastFrameAt < 1000 / set.fps) return;
  lastFrameAt = now;
  frame += frameDir;
  if (set.playback === 'pingpong') {
    if (frame >= set.frames - 1 || frame <= 0) frameDir *= -1;
    frame = Math.max(0, Math.min(set.frames - 1, frame));
  } else if (frame >= set.frames) {
    frame = set.playback === 'once' ? set.frames - 1 : 0;
  }
  applyFrame(set.frames);
}

// ---- Config polling ----
// 响应格式: { config: { enabled, desktopPetEnabled, size, opacity, character, ... }, revision }
async function pollConfig() {
  try {
    const res = await fetch(CONFIG_URL);
    if (!res.ok) return;
    const body = await res.json();
    const config = body?.config ?? body;
    applyConfig(config);
    // manifest 还没加载或加载失败时重试（DSH 刚启动时可能 assets 端点未就绪）
    if (!manifestReady) void loadManifest();
    if (manifestReady) resolveCharacterFromConfig(config);
  } catch {}
}

// ---- State polling (notification) ----
async function pollState() {
  try {
    const res = await fetch(STATE_URL);
    if (!res.ok) { console.log('[pet] pollState: HTTP', res.status); return; }
    const body = await res.json();
    const n = body?.notification ?? null;
    console.log('[pet] pollState: notification=', JSON.stringify(n));
    showBubble(n);
  } catch (e) {
    console.log('[pet] pollState error:', e);
  }
}

// ---- Init ----
setupDrag();
void loadManifest();
void pollConfig();
void pollState();
setInterval(() => void pollConfig(), POLL_MS);
setInterval(() => void pollState(), POLL_MS);
setInterval(tick, 200);
