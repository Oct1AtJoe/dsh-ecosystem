import { useMemo, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import clsx from 'clsx'
import {
  DisclosureRow, IconEditOutline16, IconInspectOutline12, StateDot,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { DiffBlock, type DiffHunk } from './DiffBlock.tsx'
import { diffStats } from './turn-deliverables.ts'
import css from './ToolMutationRow.module.css'

export interface ToolBlockShape {
  readonly kind?: string
  readonly isError?: boolean
  readonly error?: { readonly code?: string }
  readonly resultText?: string
  readonly meta?: { readonly diffs?: readonly DiffHunk[] }
  readonly call?: { readonly argsRaw?: string }
  readonly argsRaw?: string
  readonly callId?: string
}

export interface ToolCallOwnerProps {
  readonly callId: string
  readonly toolName: string
  readonly block: ToolBlockShape
  readonly cwd?: string
  readonly home?: string
  readonly openFile: (path: string) => void
  readonly inspect?: () => void
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'tool.call.toolview': { kind: 'keyed'; scope: 'session'; owner: ToolCallOwnerProps }
  }
}

export type ToolMutationRowProps = PropsRuntime<'tool.call.toolview'> & PropsLocale<'conversation'>

function leadingFor(state: 'running' | 'ok' | 'error' | 'stopped', icon: ReactNode): ReactNode {
  switch (state) {
    case 'error': return <StateDot state="error" />
    case 'stopped': return <StateDot state="warning" />
    default: return icon
  }
}

function relativizePath(path: string, cwd?: string): string {
  if (!cwd) return path
  const normalizedCwd = cwd.replace(/\\/g, '/').replace(/\/$/, '')
  const normalizedPath = path.replace(/\\/g, '/')
  if (normalizedPath.startsWith(`${normalizedCwd}/`)) {
    return normalizedPath.slice(normalizedCwd.length + 1)
  }
  return path
}

function firstLine(text: string): string {
  const newline = text.indexOf('\n')
  return newline === -1 ? text : text.slice(0, newline)
}

interface MutationArgs {
  readonly file_path?: string
  readonly content?: string
  readonly old_string?: string
  readonly new_string?: string
}

export function ToolMutationRow({
  toolName, block, cwd, openFile, inspect, t,
}: ToolMutationRowProps) {
  const [expanded, setExpanded] = useState(false)
  const done = block.kind !== undefined
  const isInterrupted = done && block.error?.code === 'interrupted'
  const isError = done && Boolean(block.isError)
  const state: 'running' | 'ok' | 'error' | 'stopped' = !done
    ? 'running'
    : isInterrupted
      ? 'stopped'
      : isError
        ? 'error'
        : 'ok'

  const argsRaw = (done ? block.call?.argsRaw : block.argsRaw) ?? ''
  const args = useMemo<MutationArgs>(() => {
    try {
      return (JSON.parse(argsRaw) as MutationArgs) ?? {}
    } catch {
      return {}
    }
  }, [argsRaw])

  const filePath = typeof args.file_path === 'string' && args.file_path.trim().length > 0
    ? args.file_path
    : undefined

  const outputText = done ? (block.resultText ?? null) : null
  const errorSummary = isError && outputText !== null ? firstLine(outputText) : null

  // Applied diffs or fallback to tool arguments
  const diffs = useMemo<DiffHunk[]>(() => {
    if (isError) return []
    if (done) {
      const metaDiffs = block.meta?.diffs
      if (Array.isArray(metaDiffs) && metaDiffs.length > 0) {
        return metaDiffs as DiffHunk[]
      }
    }
    if (!filePath) return []
    if (toolName === 'write' && typeof args.content === 'string') {
      return [{ path: filePath, oldText: null, newText: args.content }]
    }
    if (toolName === 'edit' && typeof args.old_string === 'string' && typeof args.new_string === 'string') {
      return [{ path: filePath, oldText: args.old_string, newText: args.new_string }]
    }
    return []
  }, [done, isError, block, filePath, toolName, args])

  // Compute accurate line stats using our LCS + punctuation tolerance algorithm
  const stats = useMemo(() => diffStats(diffs), [diffs])
  const diffStat = useMemo(() => {
    if (stats.added === 0 && stats.removed === 0) return null
    return `+${stats.added} -${stats.removed}`
  }, [stats])

  const summaryText = errorSummary ?? (filePath ? relativizePath(filePath, cwd) : block.callId)
  const title = t === undefined ? (toolName === 'write' ? '写入' : '编辑') : t(`tool.title.${toolName}` as never)
  const fileLink = filePath !== undefined && errorSummary === null
  const expandable = (diffs.length > 0) || (outputText !== null)
  const open = expanded && expandable

  const toggleExpand = () => {
    setExpanded(v => !v)
  }

  const handleOpenFile = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (filePath !== undefined) openFile(filePath)
  }

  const handleLinkKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
  }

  return (
    <div className={css.root} data-variant={toolName} data-tool={toolName} data-state={state}>
      <DisclosureRow
        rowClassName={css.row}
        leadingClassName={css.leading}
        titleClassName={css.title}
        chevronClassName={css.chevron}
        icon={leadingFor(state, <IconEditOutline16 size={14} />)}
        title={title}
        open={open}
        expandable={expandable}
        expandOnRowClick
        keepContentWhenOpen
        onToggle={toggleExpand}
        collapsedContent={(
          <>
            <span className={css.sep} aria-hidden />
            {fileLink ? (
              <button
                type="button"
                className={css.fileLink}
                onClick={handleOpenFile}
                onKeyDown={handleLinkKeyDown}
                title={filePath}
              >
                {summaryText}
              </button>
            ) : (
              <span className={clsx(css.summary, errorSummary !== null && css.errorSummary)}>
                {summaryText}
              </span>
            )}
            {diffStat !== null && (
              <span className={css.diffStat}>{diffStat}</span>
            )}
          </>
        )}
      >
        <div className={css.bodyWrap}>
          {isError && outputText !== null ? (
            <div className={css.errorBody}>{outputText}</div>
          ) : diffs.length > 0 ? (
            <DiffBlock
              diffs={diffs}
              maxLines={8}
              showPathHeaders={false}
              showFooter
              className={css.diffBody}
            />
          ) : null}
          {inspect !== undefined && (
            <button type="button" className={css.inspectButton} onClick={inspect}>
              <IconInspectOutline12 size={12} />
              <span>{t === undefined ? '查看' : t('row.inspect' as never)}</span>
            </button>
          )}
        </div>
      </DisclosureRow>
    </div>
  )
}
