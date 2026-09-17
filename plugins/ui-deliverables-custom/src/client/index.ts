/**
 * Deliverables plugin, browser half: registers the produced-files row into
 * the chat view's turn-tail chain, and provides the `chatFileMentions`
 * service that links inline-code mentions of produced files in the closing
 * prose. All policy lives here — the derivation from the mutation tools'
 * arguments, the mention matching, the chip cap, and the copy — so
 * composing this plugin out of cordis.yml removes both surfaces entirely;
 * the owning view renders an empty chain and inert prose at zero cost.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { ChatFileMentions } from '@deepseek-ai/dsh-client-ui-chat/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { ProducedFiles } from './ProducedFiles.tsx'
import { ToolMutationRow } from './ToolMutationRow.tsx'
import { en, NS, zh, type DeliverablesKey } from './locales.ts'
import {
  deliverablesDefinition, producedFileMentions, producedForClosing, selectProducedFiles,
} from './turn-deliverables.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Produced-files row copy. */
    'deliverables': DeliverablesKey
  }
}

export { ProducedFiles, type ProducedFilesProps } from './ProducedFiles.tsx'
export { ToolMutationRow, type ToolMutationRowProps } from './ToolMutationRow.tsx'
export { producedForClosing } from './turn-deliverables.ts'

/** Required services for the tail-slot registration and its dictionaries. */
export const inject = ['slots', 'locale', 'uiConversation', 'remote', 'remote.session']

/**
 * Client plugin body: register the dictionaries and the turn-tail entry.
 * @param ctx - client root context.
 */
async function resolveFileLine(
  workspaceFiles: any,
  sessionId: string,
  path: string,
  targetSnippet: string,
): Promise<number | null> {
  if (!workspaceFiles || !targetSnippet || !sessionId || !path) return null
  try {
    const res = await workspaceFiles.read(sessionId, path, { offset: 1, limit: 5000 })
    if (!res || !res.ok || !res.value?.text) return null
    const fileText = res.value.text.replace(/\r\n/g, '\n')
    const normalizedSnippet = targetSnippet.replace(/\r\n/g, '\n').trim()
    if (!normalizedSnippet) return null

    // 1. Exact match of the whole snippet
    const exactIdx = fileText.indexOf(normalizedSnippet)
    if (exactIdx !== -1) {
      const leading = fileText.slice(0, exactIdx)
      return leading.split('\n').length
    }

    // 2. Fallback: match by line sequence
    const snippetLines = normalizedSnippet.split('\n').map((l: string) => l.trim()).filter(Boolean)
    if (snippetLines.length > 0) {
      const firstLine = snippetLines[0]!
      const lines = fileText.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i]!.trim() === firstLine) {
          if (snippetLines.length === 1) {
            return i + 1
          }
          let allMatch = true
          for (let j = 1; j < snippetLines.length && i + j < lines.length; j++) {
            if (lines[i + j]!.trim() !== snippetLines[j]) {
              allMatch = false
              break
            }
          }
          if (allMatch) {
            return i + 1
          }
        }
      }
    }
  } catch {
    return null
  }
  return null
}

export function apply(ctx: ClientContext): void {
  const workspacePathOpen = createSnapshotStore<boolean | undefined>(undefined)
  let requestedWorkspacePathOpen = false
  let capabilityRevision = 0
  let pendingCapability: Promise<void> | undefined
  const loadWorkspacePathOpen = (): void => {
    if (pendingCapability !== undefined) return
    const revision = capabilityRevision
    const pending = ctx.remote.session.canOpenWorkspacePath()
      .then((result) => {
        if (revision === capabilityRevision) workspacePathOpen.set(result.ok && result.value)
      })
      .finally(() => {
        if (pendingCapability === pending) pendingCapability = undefined
      })
    pendingCapability = pending
  }
  const ensureWorkspacePathOpen = (): void => {
    requestedWorkspacePathOpen = true
    if (workspacePathOpen.getSnapshot() === undefined) loadWorkspacePathOpen()
  }
  ctx.on('connection/reset', () => {
    capabilityRevision++
    pendingCapability = undefined
    workspacePathOpen.set(undefined)
    if (requestedWorkspacePathOpen) loadWorkspacePathOpen()
  })
  ctx.uiConversation.events.register(deliverablesDefinition)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-deliverables-custom: dictionaries')
  ctx.slots.inject(
    'conversation.chat.turnTail',
    () => ctx.slots.register({
      name: 'conversation.chat.turnTail',
      select: selectProducedFiles,
      // Chain order is ascending priority: dsh-better-sidebar claims the same
      // produced-files turn at -1, so this fork must try earlier to render at
      // all, while staying behind ui-resend-failed-round (-10), whose failed-
      // round entry keeps precedence on failed turns.
      priority: -5,
      locale: NS,
      inject: () => ({
        isLoopback: ctx.remote.$host.isLoopback,
        ensureWorkspacePathOpen,
        hooks: { workspacePathOpen },
        resolveFileLine: (sessionId: string | undefined, path: string, snippet: string) => {
          const sid = sessionId || (ctx as any).sessions?.list?.getSnapshot()?.current || ''
          const workspaceFiles = ctx.get('remote.workspaceFiles') ?? (ctx.remote as any)?.workspaceFiles
          return resolveFileLine(workspaceFiles, sid, path, snippet)
        },
      }),
    }, ProducedFiles),
  )
  ctx.slots.inject('tool.call.toolview', function* () {
    yield ctx.slots.register({
      name: 'tool.call.toolview',
      key: 'edit',
      priority: -5,
      locale: 'conversation',
    }, ToolMutationRow)
    yield ctx.slots.register({
      name: 'tool.call.toolview',
      key: 'write',
      priority: -5,
      locale: 'conversation',
    }, ToolMutationRow)
  })
  // The prose side of the same vocabulary: the chat view reaches this face
  // via ctx.get, so its absence — this plugin composed out — is the off state.
  const t = ctx.locale.bind(NS)
  const mentions: ChatFileMentions = {
    forClosing(owner) {
      // Same claim test the turn-tail chain entry runs: no produced files,
      // no vocabulary — the two surfaces agree by construction.
      const paths = producedForClosing(owner.turn.data.get('deliverables'), owner.seq)
      if (paths.length === 0) return undefined
      return producedFileMentions(paths, owner.openFile, path => t('produced.open', { name: path }))
    },
  }
  ctx.provide('chatFileMentions', mentions)
}
