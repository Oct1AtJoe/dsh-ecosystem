import type { Context } from '@deepseek-ai/cordis'
import { CRAB_FRAME_MS, CRAB_SHEETS, CRAB_SHEET_URLS } from './mascot-data'

export function initMascot(ctx: Context): () => void {
  // 构建 DOM 节点
  const crab = document.createElement('span')
  crab.className = 'dsh-claude-crab'
  crab.setAttribute('aria-hidden', 'true')

  const sprite = document.createElement('span')
  sprite.className = 'dsh-claude-crab-sprite'

  const strip = document.createElement('span')
  strip.className = 'dsh-claude-crab-strip'

  sprite.appendChild(strip)
  crab.appendChild(sprite)

  const hit = document.createElement('span')
  hit.className = 'dsh-claude-crab-hit'
  crab.appendChild(hit)

  let currentAnimation: Animation | null = null
  let currentKey = 'idle'
  let lockUntil = 0
  let idleTimer: any = null
  let sleepTimer: any = null
  let isSleeping = false
  let clicks: number[] = []
  let pressStart: { x: number; y: number; id: number; lifted: boolean } | null = null

  function playAnimation(key: string, loop: boolean) {
    const meta = CRAB_SHEETS[key]
    const sheet = CRAB_SHEET_URLS[key]
    if (!meta || !sheet) return

    currentKey = key
    crab.style.setProperty('--dsh-claude-crab-sheet', `url("${sheet.body}")`)
    crab.style.setProperty('--dsh-claude-crab-ink', `url("${sheet.ink}")`)
    crab.style.setProperty('--dsh-claude-crab-x', String(meta.box[0]))
    crab.style.setProperty('--dsh-claude-crab-y', String(meta.box[1]))
    crab.style.setProperty('--dsh-claude-crab-w', String(meta.box[2]))
    crab.style.setProperty('--dsh-claude-crab-h', String(meta.box[3]))
    crab.style.setProperty('--dsh-claude-crab-cell-w', String(meta.box[2]))
    crab.style.setProperty('--dsh-claude-crab-strip-h', String(meta.box[3] * Math.ceil(meta.frames / 8)))
    crab.setAttribute('data-ready', '')
    crab.setAttribute('data-animation', key)

    const keyframes: Keyframe[] = []
    for (let i = 0; i < meta.frames; i++) {
      const col = i % 8
      const row = Math.floor(i / 8)
      keyframes.push({
        offset: i / meta.frames,
        transform: `translate(${-(col * meta.box[2]) * 2}px, ${-(row * meta.box[3]) * 2}px)`,
        easing: 'steps(1)',
      })
    }
    keyframes.push({
      offset: 1,
      transform: `translate(${-(meta.box[2] * (loop ? 0 : (meta.frames - 1) % 8)) * 2}px, ${-(meta.box[3] * (loop ? 0 : Math.floor((meta.frames - 1) / 8))) * 2}px)`,
    })

    if (currentAnimation) {
      currentAnimation.cancel()
      currentAnimation = null
    }

    currentAnimation = strip.animate(keyframes, {
      duration: meta.frames * CRAB_FRAME_MS,
      iterations: loop ? Infinity : 1,
      fill: 'forwards',
    })

    if (!loop) {
      currentAnimation.finished
        .then(() => {
          if (currentKey === key) {
            playAnimation('idle', true)
          }
        })
        .catch(() => {})
    }
  }

  function triggerReaction(key: string, holdMs = 0) {
    if (Date.now() < lockUntil && key !== 'drag') return
    if (holdMs > 0) lockUntil = Date.now() + holdMs
    isSleeping = false
    playAnimation(key, false)
    scheduleIdleExtra()
    resetSleepTimer()
  }

  // 点击与拖拽交互
  hit.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()
    pressStart = { x: e.clientX, y: e.clientY, id: e.pointerId, lifted: false }
    hit.setPointerCapture(e.pointerId)
  })

  hit.addEventListener('pointermove', (e: PointerEvent) => {
    if (!pressStart || pressStart.lifted || e.pointerId !== pressStart.id) return
    if (Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) > 5) {
      pressStart.lifted = true
      playAnimation('drag', true)
    }
  })

  hit.addEventListener('pointerup', (e: PointerEvent) => {
    if (!pressStart || e.pointerId !== pressStart.id) return
    e.stopPropagation()
    const lifted = pressStart.lifted
    pressStart = null

    if (lifted) {
      triggerReaction('happy', 2500)
      return
    }

    const now = Date.now()
    const lastClick = clicks[clicks.length - 1]
    if (lastClick !== undefined && now - lastClick > 450) clicks = []
    clicks.push(now)

    if (clicks.length >= 4) {
      clicks = []
      triggerReaction('tickle', 2000)
      return
    }

    const rect = hit.getBoundingClientRect()
    triggerReaction(e.clientX - rect.left < rect.width / 2 ? 'poke-left' : 'poke-right', 1200)
  })

  hit.addEventListener('pointercancel', () => {
    if (pressStart?.lifted) {
      playAnimation('idle', true)
    }
    pressStart = null
  })

  // 随机闲置小动作 (看一看 / 挥挥手 / 搬出电脑敲代码)
  function scheduleIdleExtra() {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      if (currentKey === 'idle' && !isSleeping && Date.now() >= lockUntil) {
        const extras = ['idle-look', 'idle-wave', 'idle-laptop']
        const pick = extras[Math.floor(Math.random() * extras.length)]
        if (pick) playAnimation(pick, false)
      }
      scheduleIdleExtra()
    }, 20000 + Math.random() * 20000)
  }

  // 闲置入睡机制 (1分钟无操作打瞌睡)
  function resetSleepTimer() {
    if (sleepTimer) clearTimeout(sleepTimer)
    sleepTimer = setTimeout(() => {
      if (currentKey === 'idle' && Date.now() >= lockUntil) {
        isSleeping = true
        playAnimation('sleeping', true)
      }
    }, 60000)
  }

  function onActivity() {
    if (isSleeping) {
      isSleeping = false
      playAnimation('waking', false)
    }
    resetSleepTimer()
  }

  window.addEventListener('mousemove', onActivity, { passive: true })
  window.addEventListener('keydown', onActivity, { passive: true })

  // 寻找输入框并贴靠挂载
  function findAnchor(): HTMLElement | null {
    // 1. 会话页输入坞卡片
    const inlineCard = document.querySelector<HTMLElement>('[class*="composerSeat"] [class$="_card"]')
    if (inlineCard && inlineCard.offsetHeight > 0) return inlineCard

    // 2. 首页新会话卡片
    const heroCard = document.querySelector<HTMLElement>('[class*="composerStack"] > section')
    if (heroCard && heroCard.offsetHeight > 0) return heroCard

    // 3. 兜底 data-composer-card
    const anyCard = document.querySelector<HTMLElement>('[data-composer-card]')
    if (anyCard && anyCard.offsetHeight > 0) return anyCard

    // 4. composerStack 容器
    const stack = document.querySelector<HTMLElement>('[class*="composerStack"]')
    if (stack && stack.offsetHeight > 0) return stack

    return null
  }

  function syncMount() {
    const anchor = findAnchor()
    if (!anchor) {
      if (crab.parentElement) crab.remove()
      return
    }

    if (crab.parentElement !== anchor) {
      anchor.style.position = 'relative'
      anchor.appendChild(crab)
    }
  }

  // 定时与DOM变更时保持贴靠
  const mountInterval = setInterval(syncMount, 500)
  syncMount()
  playAnimation('idle', true)
  scheduleIdleExtra()
  resetSleepTimer()

  // 状态监听：跟随 AI 会话活动
  let prevRunning = false
  const stateInterval = setInterval(() => {
    try {
      const sessionService = ctx.get('session') as any
      const running = sessionService?.running ?? false
      if (running && !prevRunning) {
        prevRunning = true
        // 正在思考/打字
        playAnimation(Math.random() > 0.5 ? 'thinking' : 'typing', true)
      } else if (!running && prevRunning) {
        prevRunning = false
        // 刚刚完成，开心跳跃
        triggerReaction('happy', 4000)
      }
    } catch {
      // 容错
    }
  }, 400)

  return () => {
    clearInterval(mountInterval)
    clearInterval(stateInterval)
    if (idleTimer) clearTimeout(idleTimer)
    if (sleepTimer) clearTimeout(sleepTimer)
    window.removeEventListener('mousemove', onActivity)
    window.removeEventListener('keydown', onActivity)
    if (currentAnimation) currentAnimation.cancel()
    if (crab.parentElement) crab.remove()
  }
}
