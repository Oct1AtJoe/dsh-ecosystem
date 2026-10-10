import type { Context } from '@deepseek-ai/cordis'
import { PET_CELL_W, PET_FRAME_MS, PET_IMAGES, PET_SHEETS } from './pet-data'

export const MASCOT_STORAGE_KEY = 'dsh-claude-mascot-enabled'

/** 读取挂件启用状态（默认开启）。 */
export function readMascotEnabled(): boolean {
  try {
    const raw = localStorage.getItem(MASCOT_STORAGE_KEY)
    return raw === null ? true : raw === 'true'
  } catch {
    return true
  }
}

/** 写入挂件启用状态。 */
export function writeMascotEnabled(value: boolean): void {
  try {
    localStorage.setItem(MASCOT_STORAGE_KEY, String(value))
  } catch {
    // localStorage unavailable
  }
}

let onEnabledChangeCallback: ((enabled: boolean) => void) | null = null

/** 通知挂件开关变化。 */
export function notifyMascotChange(enabled: boolean): void {
  onEnabledChangeCallback?.(enabled)
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
export function initMascot(ctx: Context): () => void {
  let isEnabled = readMascotEnabled()

  const pet = document.createElement('span')
  pet.className = 'dsh-composer-pet'
  pet.setAttribute('aria-hidden', 'true')

  const sprite = document.createElement('span')
  sprite.className = 'dsh-composer-pet-sprite'

  const strip = document.createElement('span')
  strip.className = 'dsh-composer-pet-strip'

  sprite.appendChild(strip)
  pet.appendChild(sprite)

  const hit = document.createElement('span')
  hit.className = 'dsh-composer-pet-hit'
  pet.appendChild(hit)

  let currentAnimation: Animation | null = null
  let currentKey = 'idle'
  let lockUntil = 0
  let idleTimer: ReturnType<typeof setTimeout> | null = null
  let sleepTimer: ReturnType<typeof setTimeout> | null = null
  let stillTimer: ReturnType<typeof setTimeout> | null = null
  let holdTimer: ReturnType<typeof setTimeout> | null = null
  let isSleeping = false
  let clicks: number[] = []
  let pressStart: { x: number; y: number; id: number; lifted: boolean } | null = null

  /** 减少动态效果：停在静止帧，只保留点击反应。 */
  function motionReduced(): boolean {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }

  function playAnimation(key: string, loop: boolean): void {
    const sheet = PET_SHEETS[key]
    if (!sheet) return
    const image = PET_IMAGES[sheet.image]
    if (!image) return

    currentKey = key
    pet.style.setProperty('--dsh-pet-image', `url("${image}")`)
    pet.setAttribute('data-ready', '')
    pet.setAttribute('data-animation', key)

    if (currentAnimation) {
      currentAnimation.cancel()
      currentAnimation = null
    }
    if (stillTimer) {
      clearTimeout(stillTimer)
      stillTimer = null
    }

    // 减少动态效果：停在该动作的静止帧，不启动动画。
    // 一次性动作仍按正常时长收尾，之后回到 idle，否则会永远停在反应帧上。
    if (motionReduced()) {
      strip.style.transform = `translateX(${-(sheet.still * PET_CELL_W)}px)`
      if (!loop) {
        stillTimer = setTimeout(() => {
          stillTimer = null
          if (currentKey === key) playAnimation('idle', true)
        }, sheet.frames * PET_FRAME_MS)
      }
      return
    }

    strip.style.transform = ''

    const keyframes: Keyframe[] = []
    for (let i = 0; i < sheet.frames; i++) {
      keyframes.push({
        offset: i / sheet.frames,
        transform: `translateX(${-(i * PET_CELL_W)}px)`,
        easing: 'steps(1)',
      })
    }
    keyframes.push({
      offset: 1,
      transform: `translateX(${-(loop ? 0 : (sheet.frames - 1)) * PET_CELL_W}px)`,
    })

    currentAnimation = strip.animate(keyframes, {
      duration: sheet.frames * PET_FRAME_MS,
      iterations: loop ? Infinity : 1,
      fill: 'forwards',
    })

    if (!loop) {
      currentAnimation.finished
        .then(() => {
          if (currentKey === key) playAnimation('idle', true)
        })
        .catch(() => { /* 被下一次播放取消 */ })
    }
  }

  /**
   * 播放一次反应动作。
   * @param key - 语义动作名。
   * @param holdMs - 锁定其它反应的时长；0 表示不锁。
   * @param holdLoop - 锁定期间是否循环播放该动作（而非播一遍就回 idle）。
   *   失败这类需要「持续一段状态」的动作用 true；跳跃这种一次性动作用 false。
   */
  function triggerReaction(key: string, holdMs = 0, holdLoop = false): void {
    // 失败与拖拽穿透反应锁：失败是最高优先级信号，不该被一次点击反应挡掉
    if (Date.now() < lockUntil && key !== 'drag' && key !== 'failed') return
    if (holdMs > 0) lockUntil = Date.now() + holdMs
    isSleeping = false

    if (holdLoop && holdMs > 0) {
      playAnimation(key, true)
      if (holdTimer) clearTimeout(holdTimer)
      holdTimer = setTimeout(() => {
        holdTimer = null
        if (currentKey === key) playAnimation('idle', true)
      }, holdMs)
    } else {
      playAnimation(key, false)
    }

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
    if (pressStart?.lifted) playAnimation('idle', true)
    pressStart = null
  })

  // 点击不冒泡到宿主卡片（首页的「选择工作区」卡片本身就是按钮）
  hit.addEventListener('click', event => { event.stopPropagation() })

  // 随机闲置小动作（张望 / 挥手 / 端着放大镜细看）
  function scheduleIdleExtra(): void {
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

  // 闲置入睡（1 分钟无操作）
  function resetSleepTimer(): void {
    if (sleepTimer) clearTimeout(sleepTimer)
    sleepTimer = setTimeout(() => {
      if (currentKey === 'idle' && Date.now() >= lockUntil) {
        isSleeping = true
        playAnimation('sleeping', true)
      }
    }, 60000)
  }

  function onActivity(): void {
    if (isSleeping) {
      isSleeping = false
      playAnimation('waking', false)
    }
    resetSleepTimer()
  }

  window.addEventListener('mousemove', onActivity, { passive: true })
  window.addEventListener('keydown', onActivity, { passive: true })

  /**
   * 寻找要站的位置：首页站在输入卡片上沿；对话页站在 composerStack 顶端
   * （它同时包含排队消息、目标任务、待办与输入框，因此挂件永远在所有元素之上）；
   * 替代面板（授权/提问）接管输入卡片时站在面板上沿。
   */
  function findAnchor(): { element: HTMLElement; place: 'stack' | 'card' | 'panel' } | null {
    const isHero = document.querySelector('[data-phase="hero"], [data-content-phase="hero"]') !== null
      || document.querySelector('[class*="composerHero"]') !== null

    if (isHero) {
      const heroCard = document.querySelector<HTMLElement>(
        '[class*="composerHero"] [class$="_card"], [class*="composerStack"] > section, [data-composer-card]'
      )
      if (heroCard && heroCard.offsetHeight > 0) return { element: heroCard, place: 'card' }
    }

    const seat = document.querySelector<HTMLElement>('[data-composer-seat], [class*="composerSeat"]')
    if (seat && seat.offsetHeight > 0) {
      const fallback = seat.querySelector<HTMLElement>('[data-chain-overlay-fallback="conversation.composer"]')
      if (fallback && fallback.style.display === 'none') {
        const panel = fallback.nextElementSibling as HTMLElement | null
        if (panel && panel.offsetHeight > 0) return { element: panel, place: 'panel' }
      }

      const stack = seat.querySelector<HTMLElement>('[class*="_composerStack"], [class*="composerStack"]')
      if (stack && stack.offsetHeight > 0) return { element: stack, place: 'stack' }

      const card = seat.querySelector<HTMLElement>('[class$="_card"], [data-composer-card]')
      if (card && card.offsetHeight > 0) return { element: card, place: 'card' }
    }

    const anyCard = document.querySelector<HTMLElement>('[data-composer-card]')
    if (anyCard && anyCard.offsetHeight > 0) return { element: anyCard, place: 'card' }

    return null
  }

  function detach(): void {
    if (pet.parentElement) {
      pet.parentElement.removeAttribute('data-dsh-pet-anchor')
      pet.remove()
    }
  }

  function syncMount(): void {
    if (!isEnabled) {
      detach()
      return
    }

    const anchor = findAnchor()
    if (!anchor) {
      detach()
      return
    }

    const currentAnchor = pet.parentElement
    if (currentAnchor !== anchor.element) {
      if (currentAnchor) currentAnchor.removeAttribute('data-dsh-pet-anchor')
      anchor.element.style.position = 'relative'
      anchor.element.setAttribute('data-dsh-pet-anchor', anchor.place)
      anchor.element.appendChild(pet)
    } else if (anchor.element.getAttribute('data-dsh-pet-anchor') !== anchor.place) {
      anchor.element.setAttribute('data-dsh-pet-anchor', anchor.place)
    }
  }

  function start(): void {
    syncMount()
    if (isEnabled) {
      playAnimation('idle', true)
      scheduleIdleExtra()
      resetSleepTimer()
    }
  }

  function stopTimers(): void {
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }
    if (sleepTimer) { clearTimeout(sleepTimer); sleepTimer = null }
    if (stillTimer) { clearTimeout(stillTimer); stillTimer = null }
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null }
  }

  // 开关变更：立即卸载 / 重新挂载
  onEnabledChangeCallback = (val: boolean) => {
    isEnabled = val
    if (isEnabled) {
      start()
    } else {
      detach()
      if (currentAnimation) { currentAnimation.cancel(); currentAnimation = null }
      stopTimers()
    }
  }

  const mountInterval = setInterval(syncMount, 500)
  start()

  // ── AI 状态跟随 ──────────────────────────────────────────────────────
  // ⚠️ 正确的服务是 `sessions`（session-controller 客户端面），不是 `session`；
  // 且 running 位在列表快照 `list.getSnapshot().byId[id].running` 上，
  // 服务本身没有顶层 `running` 字段（曾误写 ctx.get('session').running，永远读到 undefined）。
  // 服务每次 tick 重新取：本插件未把 session-controller 列为 inject，
  // apply 时它可能还没就绪，缓存下来会永久为 undefined。
  interface SessionsFace {
    list?: {
      getSnapshot?: () => {
        current?: string
        ids?: readonly string[]
        byId?: Record<string, { running?: boolean } | undefined>
      }
    }
    /** 会话绑定：事件流在此，失败类事件只在它上面可见。 */
    binding?: (id: string) => {
      eventSource?: {
        getSnapshot?: () => { change?: { kind?: string; entries?: readonly unknown[] } }
        subscribe?: (listener: () => void) => () => void
      }
    } | undefined
  }

  function readSessions(): SessionsFace | undefined {
    try {
      return ctx.get('sessions') as SessionsFace | undefined
    } catch {
      return undefined
    }
  }

  function readCurrentId(): string | undefined {
    try {
      return readSessions()?.list?.getSnapshot?.()?.current
    } catch {
      return undefined
    }
  }

  function readRunning(): boolean {
    try {
      const snap = readSessions()?.list?.getSnapshot?.()
      if (!snap?.byId) return false
      const cur = snap.current
      if (cur !== undefined) return snap.byId[cur]?.running === true
      // 没有当前会话时，任一在跑的会话也算工作
      return (snap.ids ?? []).some(id => snap.byId?.[id]?.running === true)
    } catch {
      return false
    }
  }

  // ── 失败检测（failed 动作的唯一触发源）────────────────────────────────
  // 列表快照只有 running 位，失败信息不在里面，必须读会话事件流：
  //   · turn/end          reason.kind 为 error / blocked
  //   · tool/result        message.isError 且不是用户主动中断的 AbortError
  //   · compaction/end    带 error
  // 只处理订阅之后 **append** 的事件（replace / prepend 是打开历史会话时的回放，
  // 不能把旧失败当成刚发生）。
  let lastFailureAt = 0

  function entryIsFailure(entry: unknown): boolean {
    if (typeof entry !== 'object' || entry === null) return false
    const e = entry as { type?: string; event?: { type?: string; data?: unknown } }
    if (e.type !== 'event' || !e.event) return false
    const ev = e.event
    const data = (ev.data ?? {}) as {
      reason?: { kind?: string }
      message?: { isError?: boolean }
      error?: unknown
    }

    if (ev.type === 'turn/end') {
      const kind = data.reason?.kind
      // aborted / interrupted 是用户主动停止或崩溃收尾，不算失败
      return kind === 'error' || kind === 'blocked'
    }
    if (ev.type === 'tool/result') {
      if (data.message?.isError !== true) return false
      const name = (data.error as { name?: string } | undefined)?.name
      return name !== 'AbortError'
    }
    if (ev.type === 'compaction/end') return data.error !== undefined
    return false
  }

  function onSessionEvents(): void {
    if (!isEnabled) return
    const id = subscribedSession
    if (id === undefined) return
    try {
      const snap = readSessions()?.binding?.(id)?.eventSource?.getSnapshot?.()
      const change = snap?.change
      if (change?.kind !== 'append') return
      const entries = change.entries ?? []
      for (const entry of entries) {
        if (entryIsFailure(entry)) {
          lastFailureAt = Date.now()
          // 垂头丧气持续 5 秒（循环播放，期间不被其它反应抢占），结束后回 idle
          triggerReaction('failed', 5000, true)
          break
        }
      }
    } catch {
      // 事件流不可用时静默
    }
  }

  // 事件订阅随「当前会话」切换而重建（切会话要换 binding）
  let subscribedSession: string | undefined
  let unsubscribeEvents: (() => void) | undefined

  function syncEventSubscription(): void {
    const id = readCurrentId()
    if (id === subscribedSession) return
    unsubscribeEvents?.()
    unsubscribeEvents = undefined
    subscribedSession = id
    if (id === undefined) return
    try {
      unsubscribeEvents = readSessions()?.binding?.(id)?.eventSource?.subscribe?.(onSessionEvents)
    } catch {
      unsubscribeEvents = undefined
    }
  }

  let prevRunning = false
  function onSessionTick(): void {
    if (!isEnabled) return
    syncEventSubscription()
    const running = readRunning()
    if (running === prevRunning) return
    prevRunning = running
    if (running) {
      // 开始工作：等待/思考
      playAnimation('thinking', true)
    } else if (Date.now() - lastFailureAt > 6000) {
      // 一轮结束：跳跃庆祝。刚失败过就不庆祝（failed 已经演过了）。
      triggerReaction('happy', 4000)
    }
  }

  const stateInterval = setInterval(onSessionTick, 400)
  syncEventSubscription()

  return () => {
    onEnabledChangeCallback = null
    clearInterval(mountInterval)
    clearInterval(stateInterval)
    unsubscribeEvents?.()
    unsubscribeEvents = undefined
    stopTimers()
    window.removeEventListener('mousemove', onActivity)
    window.removeEventListener('keydown', onActivity)
    if (currentAnimation) currentAnimation.cancel()
    detach()
  }
}
