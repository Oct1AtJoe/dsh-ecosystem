/**
 * 新会话选择器行里的分支 chip：在工作区选择器 + 模式选择那一行的末尾显示当前
 * 分支；点击会打开一个本地分支下拉列表，以便一键切换。
 *
 * 通过官方 `conversation.hero.options` 槽位挂载：它由官方渲染在「工作区选择器 +
 * 模式选择」这一行里，本胶囊紧跟模式选择之后，且只在新会话（hero 形态）出现，
 * 多轮对话时自然消失。
 * @module dsh-git-panel/client/BranchChip
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { BranchesView } from '../core/types.ts'
import { GitPanelApi } from './api.ts'
import { icon } from './icons.tsx'
import { useT } from './i18n.ts'

const CHIP_STYLE = `
/* 位置修正：用户要求分支胶囊紧跟在「模式选择」（Agent 预设芯片）之后，
   而不是顶到该行最右侧。

   官方 hero 行的座位结构是：
     .heroOptions                                  ← margin-left:auto（把座位推到最右）
       └─ [data-slot="conversation.hero.options"]  ← display:contents（不参与盒模型）
            └─ .dsh-gpc-host                       ← 本组件

   \`display:contents\` 不参与盒模型，margin 加在它身上无效；而 .heroOptions
   是 CSS Module 哈希类名，无法直接写选择器。因此由组件在挂载时给座位元素
   打上 \`data-gpc-seat\` 标记（见 applySeatLayout），再由下面这条规则清零
   自动外边距。标记只在「座位里确实有本胶囊」时存在，别的插件占用该座位时
   官方排布不受影响。 */
[data-gpc-seat] {
  margin-left: 0 !important;
}
/* 与「模式选择」同一行、紧跟其后：按内容宽度排布，不撑满整行。 */
.dsh-gpc-host {
  display: inline-flex;
  flex: none;
  align-items: center;
}
.dsh-gpc {
  --gpc-fg: var(--dsw-alias-label-primary, #24292f);
  --gpc-border: var(--dsw-alias-border-l1, rgba(128,128,128,0.35));
  --gpc-hover: var(--dsw-alias-bg-hover, rgba(0,0,0,0.06));
  --gpc-bg: var(--dsw-alias-bg-layer2, #ffffff);
  --gpc-muted: var(--dsw-alias-label-caption, #6e7781);
  --gpc-accent: var(--dsw-alias-brand-primary, #1976d2);
  --gpc-danger: var(--dsw-alias-status-danger, #cf222e);
  --gpc-pop-bg: var(--dsw-specific-menu, #ffffff);
  position: relative;
  display: flex;
  justify-content: flex-end;
  width: auto;
  margin: 0;
}
[data-ds-dark-theme] .dsh-gpc {
  --gpc-fg: var(--dsw-alias-label-primary, #d1d9e0);
  --gpc-border: var(--dsw-alias-border-l1, rgba(255,255,255,0.22));
  --gpc-hover: var(--dsw-alias-bg-hover, rgba(255,255,255,0.08));
  --gpc-bg: var(--dsw-alias-bg-layer2, #21262d);
  --gpc-muted: var(--dsw-alias-label-caption, #9198a1);
  --gpc-accent: var(--dsw-alias-brand-primary, #58a6ff);
  --gpc-danger: var(--dsw-alias-status-danger, #f85149);
  --gpc-pop-bg: var(--dsw-specific-menu, #1f2328);
}
.dsh-gpc-anchor {
  position: relative;
  display: inline-flex;
}
.dsh-gpc-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: min(100%, 240px);
  min-height: 28px;
  padding: 0 8px;
  border: none;
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--gpc-fg);
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  font-family: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease;
}
.dsh-gpc-chip:not(:disabled):hover,
.dsh-gpc-chip[aria-expanded='true'] {
  background: var(--dsw-alias-interactive-bg-hover, var(--gpc-hover));
}
.dsh-gpc-chip:disabled {
  cursor: default;
  opacity: 0.65;
}
.dsh-gpc-chip .icon {
  flex: none;
  color: var(--gpc-fg);
}
.dsh-gpc-chip .label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-gpc-chip .chevron {
  flex: none;
  color: var(--gpc-muted);
}
.dsh-gpc-spin {
  width: 12px;
  height: 12px;
  flex: none;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--gpc-muted) 25%, transparent);
  border-top-color: var(--gpc-accent);
  animation: dsh-gpc-spin 0.75s linear infinite;
  box-sizing: border-box;
}
@keyframes dsh-gpc-spin { to { transform: rotate(360deg); } }
.dsh-gpc-backdrop {
  position: fixed;
  inset: 0;
  z-index: 900;
}
.dsh-gpc-pop {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: auto;
  min-width: 220px;
  max-width: 320px;
  max-height: 340px;
  overflow: auto;
  z-index: 901;
  background: var(--gpc-pop-bg);
  backdrop-filter: var(--dsw-menu-backdrop-filter, blur(8px));
  -webkit-backdrop-filter: var(--dsw-menu-backdrop-filter, blur(8px));
  border: 1px solid var(--gpc-border);
  border-radius: var(--dsw-radius-md, 8px);
  box-shadow: var(--dsw-elevation-panel, 0 8px 24px rgba(0,0,0,0.18));
  padding: 4px;
}
.dsh-gpc-pop .head {
  padding: 4px 8px;
  font-size: 11px;
  color: var(--gpc-muted);
  font-weight: 600;
  user-select: none;
}
.dsh-gpc-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  font-size: 12px;
  color: var(--gpc-fg);
  border-radius: var(--dsw-radius-sm, 6px);
  cursor: pointer;
  transition: background 0.12s ease;
}
.dsh-gpc-row:hover {
  background: var(--gpc-hover);
}
.dsh-gpc-row .check {
  color: var(--gpc-accent);
  width: 14px;
  flex: none;
  display: flex;
  align-items: center;
}
.dsh-gpc-row .name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.dsh-gpc-row.current {
  font-weight: 600;
}
.dsh-gpc-err {
  padding: 4px 8px;
  font-size: 11px;
  color: var(--gpc-danger);
}
.dsh-gpc-empty {
  padding: 8px;
  font-size: 11px;
  color: var(--gpc-muted);
}
`

let chipStyleInjected = false
function ensureChipStyle(): void {
  if (chipStyleInjected) return
  chipStyleInjected = true
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-git-panel-chip-css'
  tag.textContent = CHIP_STYLE
  document.head.appendChild(tag)
}

/** 座位标记属性：由本组件写在官方 \`.heroOptions\` 容器上。 */
const SEAT_ATTR = 'data-gpc-seat'

/**
 * 给官方 hero 行的插件座位打上标记，抵消它自带的 `margin-left: auto`。
 *
 * 为什么必须用 JS 而不是纯 CSS：座位容器 `.heroOptions` 是 CSS Module 生成的
 * 哈希类名，选择器无法直接引用；而座位里的 `[data-slot]` 中间层是
 * `display: contents`，margin 加在它身上不参与布局。唯一能改的就是那个真实
 * 的布局盒，所以从本组件向上找最近的「非 contents 祖先」并打标记。
 *
 * @param host - 本组件的根节点。
 * @returns 清理函数：卸载时移除标记，避免影响后续占用该座位的插件。
 */
function applySeatLayout(host: HTMLElement | null): () => void {
  if (host === null) return () => {}
  // 向上跳过所有 display:contents 的中间层（宿主的 [data-slot] 锚点就是这种），
  // 第一个「真正参与布局」的祖先就是需要清零自动外边距的座位。
  //
  // 判定用 computed display 而不是类名：座位是 CSS Module 哈希类名，且
  // [data-slot] 中间层的 contents 来自官方内联样式，两者都只能从计算值读。
  let seat: HTMLElement | null = host.parentElement
  while (seat !== null && getComputedStyle(seat).display === 'contents') {
    seat = seat.parentElement
  }
  if (seat === null || seat === host || seat === document.body) return () => {}
  const previous = seat.getAttribute(SEAT_ATTR)
  seat.setAttribute(SEAT_ATTR, '')
  return () => {
    if (previous === null) seat.removeAttribute(SEAT_ATTR)
    else seat.setAttribute(SEAT_ATTR, previous)
  }
}

/** chip 所需的 sessions 服务结构（参见 client/index.ts）。 */
interface ChipSessions {
  list: {
    getSnapshot(): { current?: string; byId: Record<string, { cwd?: string }> }
  }
}

/**
 * 工作区快照的最小结构面孔。宿主 `useWorkspaces` 提供的
 * `WorkspaceSnapshot` 里，每条工作区记录都带有规范化的目录路径 `path`——
 * 这就是新会话（尚无 `session.cwd`）时唯一可靠的仓库根来源。
 */
interface ChipWorkspace {
  readonly workspaceId: string
  /** 规范化后的工作区目录路径。 */
  readonly path: string
  /** 该工作区名下的会话 id。 */
  readonly sessionIds: readonly string[]
}

interface BranchChipProps {
  /** 当前会话 id（槽位的运行时共享）。 */
  sessionId?: string
  /** 注入的 sessions 服务。 */
  sessions?: ChipSessions
  /** 直接传入的当前工作区根目录（优先消费）。 */
  cwd?: string
  /**
   * 官方全局标准属性：工作区快照选择器。它是**响应式**的，工作区列表变化时
   * 自动重渲染——这正是新会话切换工作区时胶囊需要跟着换仓库的原因。
   */
  useWorkspaces?: (selector: (snapshot: {
    items: readonly ChipWorkspace[]
  }) => unknown) => unknown
}

/** 新会话选择器行里的分支选择器 chip。在 git 工作区之外渲染为 null。 */
export function BranchChip(props: BranchChipProps): React.ReactElement | null {
  const { sessionId, sessions, cwd: propCwd, useWorkspaces } = props
  const t = useT()
  const [api] = useState(() => new GitPanelApi())
  const [current, setCurrent] = useState<string | null>(null)
  const [view, setView] = useState<BranchesView | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const retries = useRef(0)
  // 对进行中的请求做单调递增保护：在会话已改变之后才返回的响应，不得给错误
  // 的仓库打标，也不得填充下拉列表。
  const fetchSeq = useRef(0)
  // 弹层方向动态变化：当 chip 下方空间不足时向上展开（提示输入框靠近视口
  // 底部）。内容加载完成后重新测量（view/error/loading 稳定下来），这样翻转
  // 决定使用的是真实的弹层高度，而不是加载占位的高度。
  const [openUp, setOpenUp] = useState(false)
  const chipRef = useRef<HTMLButtonElement | null>(null)
  const popRef = useRef<HTMLDivElement | null>(null)
  // 本组件根节点：挂载后据此向上给官方座位打标记（抵消 margin-left:auto）。
  // 用回调 ref 而不是 useLayoutEffect：根节点要等 commit 后才可读，回调 ref
  // 恰好在那一刻触发，并且卸载时自动收到 null 用于清理。
  const seatCleanup = useRef<(() => void) | null>(null)
  const hostRef = useCallback((node: HTMLDivElement | null) => {
    seatCleanup.current?.()
    seatCleanup.current = applySeatLayout(node)
  }, [])

  const updateDirection = useCallback(() => {
    const chip = chipRef.current
    if (chip === null) return
    const chipRect = chip.getBoundingClientRect()
    const spaceBelow = window.innerHeight - chipRect.bottom
    const spaceAbove = chipRect.top
    const height = popRef.current?.getBoundingClientRect().height ?? 240
    const opensUp = spaceBelow < height + 10
    setOpenUp(opensUp)
    const pop = popRef.current
    if (pop === null) return
    // 在所选方向上，把 maxHeight 钳制到实际可用空间，这样无论时机如何，
    // 列表都不会超出视口。
    const max = opensUp ? Math.max(160, spaceAbove - 12) : Math.max(120, spaceBelow - 12)
    pop.style.maxHeight = `${Math.min(max, 340)}px`
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updateDirection()
    window.addEventListener('resize', updateDirection)
    return () => window.removeEventListener('resize', updateDirection)
  }, [open, view, error, loading, updateDirection])

  ensureChipStyle()

  // 仓库根解析，按可靠度从高到低：
  //   1. 注入的 cwd——注册处已按会话解析好的路径；
  //   2. 会话列表里的 session.cwd——**旧会话**（已跑过一轮对话）才有；
  //   3. 工作区快照里当前会话所属工作区的 path——**新会话**（空白会话，
  //      列表里还没有 cwd）靠这一条拿到仓库根。
  // 少了第 3 条，新会话里 chip 就永远拿不到路径，胶囊因此完全不出现。
  //
  // `useWorkspaces` 是官方全局标准属性，宿主必定提供；但它可能缺席（旧的
  // 宿主版本），所以用一个稳定的空快照兜底——**调用次数不能变**，否则违反
  // React 的 Hook 规则。
  const EMPTY_WORKSPACES: readonly ChipWorkspace[] = []
  const workspaces = useWorkspaces === undefined
    ? EMPTY_WORKSPACES
    : (useWorkspaces(snapshot => snapshot.items) as readonly ChipWorkspace[] | undefined) ?? EMPTY_WORKSPACES

  const cwd = useMemo(() => {
    if (propCwd !== undefined && propCwd !== '') return propCwd
    if (sessionId !== undefined && sessions !== undefined) {
      const fromSession = sessions.list.getSnapshot().byId[sessionId]?.cwd
      if (typeof fromSession === 'string' && fromSession !== '') return fromSession
    }
    if (workspaces.length > 0) {
      // 会话归属的工作区优先：它的 path 就是这个会话的仓库根。
      const owned = sessionId === undefined
        ? undefined
        : workspaces.find(item => item.sessionIds.includes(sessionId))
      if (owned !== undefined) return owned.path
      // 没有会话时（新会话尚未落到任何工作区），退回第一个工作区——
      // 官方的新会话行默认展示的就是当前/最近一个工作区。
      const fallback = workspaces[0]
      if (fallback !== undefined) return fallback.path
    }
    return ''
  }, [propCwd, sessionId, sessions, workspaces])

  // 标签：只做轻量的当前分支探测。完整的分支列表在弹层打开时才请求——
  // 让启动与会话切换都更廉价。
  const refetchCurrent = useCallback(async () => {
    if (!cwd) {
      setCurrent(null)
      return
    }
    const seq = ++fetchSeq.current
    const result = await api.current(cwd)
    if (seq !== fetchSeq.current) return
    if (result.ok) {
      retries.current = 0
      setCurrent(result.value.current || null)
      setError(null)
    } else {
      // 保留上次已知的分支标签；对隐藏的 chip 重试一次，这样一次暂时性的
      // 失败不会让选择器永久不可见。
      setError(result.error.message)
      if (current === null && retries.current < 1) {
        retries.current += 1
        window.setTimeout(() => void refetchCurrent(), 1500)
      }
    }
  }, [cwd, api, current])

  // 初始加载 + 会话切换（仅做廉价探测）。
  useEffect(() => {
    void refetchCurrent()
  }, [refetchCurrent])

  // 监听外部（如右侧 Git 面板）的分支切换或提交操作，实时同步当前分支标签
  useEffect(() => {
    const onSwitched = () => void refetchCurrent()
    window.addEventListener('dsh-git-panel:switched', onSwitched)
    return () => window.removeEventListener('dsh-git-panel:switched', onSwitched)
  }, [refetchCurrent])

  // 完整的分支列表，每次弹层打开时都重新获取。
  const refetchList = useCallback(async () => {
    if (!cwd) {
      setView(null)
      return
    }
    const seq = ++fetchSeq.current
    setLoading(true)
    const result = await api.branches(cwd)
    if (seq !== fetchSeq.current) return
    setLoading(false)
    if (result.ok) {
      setView(result.value)
      setError(null)
    } else {
      setError(result.error.message)
    }
  }, [cwd, api])

  useEffect(() => {
    if (open) void refetchList()
  }, [open, refetchList])

  // 不是 git 工作区（无会话、无仓库）：完全隐藏 chip。
  if (current === null && !loading) return null

  const switchTo = async (branch: string): Promise<void> => {
    if (busy || branch === current) {
      setOpen(false)
      return
    }
    setBusy(true)
    setError(null)
    const result = await api.switchBranch(cwd, branch)
    setBusy(false)
    if (result.ok) {
      setOpen(false)
      await refetchCurrent()
      // 也通知右侧面板刷新它的分支列表。
      window.dispatchEvent(new CustomEvent('dsh-git-panel:switched'))
    } else {
      setError(result.error.message)
    }
  }

  return (
    <div className="dsh-gpc-host" ref={hostRef}>
      <div className="dsh-gpc">
        <div className="dsh-gpc-anchor">
          <button ref={chipRef} type="button" className="dsh-gpc-chip" title={t('chip.title')}
            aria-expanded={open} disabled={loading}
            onClick={() => {
              if (loading) return
              setOpen((v) => !v)
            }}>
            <svg className="icon" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor"
              strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="4" cy="4" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="4" r="1.6" />
              <path d="M4 5.6v4.8a2.4 2.4 0 0 0 2.4 2.4H12" />
            </svg>
            <span className="label">{current}</span>
            {loading ? (
              <span className="dsh-gpc-spin" aria-label={t('aria.loading')} />
            ) : (
              <svg className="chevron" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor"
                strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 6l4 4 4-4" />
              </svg>
            )}
          </button>

          {open ? (
            <>
              <div className="dsh-gpc-backdrop" onClick={() => setOpen(false)} />
              <div ref={popRef} className="dsh-gpc-pop" role="listbox"
                style={openUp ? { bottom: 'calc(100% + 6px)', top: 'auto' } : { top: 'calc(100% + 6px)', bottom: 'auto' }}>
                <div className="head">{t('chip.head')}</div>
                {error && view === null ? <div className="dsh-gpc-err">{error}</div> : null}
                {loading && view === null ? <div className="dsh-gpc-empty">{t('loading')}</div> : null}
                {!loading && error && view !== null ? <div className="dsh-gpc-err">{error}</div> : null}
                {!loading && !error && view !== null && view.local.length === 0 ? <div className="dsh-gpc-empty">{t('empty.local')}</div> : null}
                {view?.local.map((branch) => (
                  <div key={branch.name} role="option" aria-selected={branch.name === current}
                    className={`dsh-gpc-row${branch.name === current ? ' current' : ''}`}
                    onClick={() => void switchTo(branch.name)}>
                    <span className="check">{branch.name === current ? icon('check', 12) : null}</span>
                    <span className="name">{branch.name}</span>
                    {branch.ahead || branch.behind ? (
                      <span style={{ color: 'var(--gpc-muted)', fontSize: 11 }}>
                        {branch.ahead ? <>{icon('arrowUp', 11)}{branch.ahead}</> : null}{branch.behind ? <>{icon('arrowDown', 11)}{branch.behind}</> : null}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
