import { useEffect, useId, useMemo, useState } from 'react'
import type { PropsLocale, PropsRenderFactories, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  FileTypeIcon, fileSizeText,
  IconChevronDownOutlineRegular, IconChevronUpOutlineRegular,
  IconEditOutlineRegular, IconQueueOutlineRegular, IconSendOutlineRegular, IconTrashOutlineRegular, Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { QueueAction } from '@deepseek-ai/dsh-api-session-controller/types'
import type { MessageId } from '@deepseek-ai/dsh-llm/brand'
import type { UserMessage } from '@deepseek-ai/dsh-llm'
import css from './QueueDock.module.css'

/**
 * The `inbox` projection narrows to the pending next-turn rows. Declared
 * locally so the plugin does not depend on the host's `InboxState` export.
 */
interface InboxSnapshot {
  readonly 'next-turn': readonly UserMessage[]
}

const EMPTY_QUEUE: readonly UserMessage[] = []

/**
 * Facts applied to the queue preview. The composer's own user-text widget
 * carries the full chip/mention rendering, so the dock reuses it instead of
 * re-implementing a text projection.
 */
const QUEUE_TEXT_FACTS = {
  collapseWhitespace: true,
  trimWhitespace: true,
}

export interface ImageAttachmentRef {
  readonly attachmentId: string
  readonly mediaType?: string
  readonly bytes?: number
  readonly width?: number
  readonly height?: number
  readonly name?: string
}

export interface FileAttachmentRef {
  readonly attachmentId: string
  readonly name: string
  readonly bytes?: number
  readonly mediaType?: string
}

/** Queue operations injected by the session-scoped registration. */
export interface QueueDockInjected {
  updateQueue: (itemId: MessageId, action: QueueAction) => Promise<void>
  notify: (level: 'info' | 'error', text: string) => void
  /** Resolve one durable queued image into a session-scoped browser URL. */
  loadImage: (attachment: ImageAttachmentRef) => Promise<string>
}

/**
 * Full props of a dock entry: InputZone owner share + session standard kit
 * (useSession / useInput / inputActions) + global seat + the locale seat.
 */
export type QueueDockProps = PropsRuntime<'conversation.input.dock'> & QueueDockInjected
  & PropsLocale<'queueRecall'> & PropsRenderFactories

/**
 * Plain text of one queued row, or `null` when it carries non-text blocks.
 * Recall merges the text into the composer draft, so an image-only row has
 * nothing to hand over and keeps the action disabled.
 */
function textOf(content: UserMessage['content']): string | null {
  if (!content.every(block => block.type === 'text')) return null
  return content.map(block => block.text).join('')
}

/**
 * Durable references carried by one queued row. Inbox projections are wire
 * data despite their typed face, so an image or file block without a
 * reference is skipped rather than trusted.
 */
function queueAttachments(content: UserMessage['content']): Array<
  | { readonly type: 'image'; readonly attachment: ImageAttachmentRef }
  | { readonly type: 'file'; readonly attachment: FileAttachmentRef }
> {
  const attachments: Array<
    | { readonly type: 'image'; readonly attachment: ImageAttachmentRef }
    | { readonly type: 'file'; readonly attachment: FileAttachmentRef }
  > = []
  for (const block of content) {
    if (block.type === 'image') {
      const { attachment } = block as { attachment?: ImageAttachmentRef }
      if (attachment !== undefined) attachments.push({ type: 'image', attachment })
    }
    if (block.type === 'file') {
      const { attachment } = block as { attachment?: FileAttachmentRef }
      if (attachment !== undefined) attachments.push({ type: 'file', attachment })
    }
  }
  return attachments
}

/** Compact file identity used beside queue thumbnails. */
function QueueFile({ attachment, label }: { attachment: FileAttachmentRef; label: string }) {
  return (
    <span className={css.file} aria-label={label} title={attachment.name}>
      <span className={css.fileIcon} aria-hidden><FileTypeIcon path={attachment.name} size={16} /></span>
      <span className={css.fileName}>{attachment.name}</span>
      <span className={css.fileSize}>{fileSizeText(attachment.bytes ?? 0)}</span>
    </span>
  )
}

/** One durable queued image as a fixed-size thumbnail; a load failure keeps the empty placeholder. */
function QueueThumb({ attachment, loadImage, label }: {
  attachment: ImageAttachmentRef
  loadImage: QueueDockInjected['loadImage']
  label: string
}) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    loadImage(attachment).then(
      (resolved) => { if (alive) setUrl(resolved) },
      () => { /* placeholder retained; the durable transcript surfaces read errors */ },
    )
    return () => { alive = false }
  }, [attachment, loadImage])
  return url === null
    ? <span className={css.thumb} aria-hidden />
    : <img className={css.thumb} src={url} alt={label} />
}

/**
 * Queue strip: one item renders directly; multiple items default to a
 * collapsible count header; an empty queue renders nothing. Local queued
 * submissions show sending status and disabled actions until their Host queue
 * rows arrive.
 *
 * Divergence from the shipped dock: the edit action recalls the row into the
 * composer draft (existing draft preserved, joined with a newline) and removes
 * it from the queue, instead of editing it in place. Recalling lets a user
 * merge queued text with new input before sending; in-place editing cannot.
 */
export function QueueDock({
  useSession,
  useInput,
  useProjection,
  inputActions,
  updateQueue,
  notify,
  loadImage,
  renderFactorySlot,
  t,
}: QueueDockProps) {
  const inbox = useProjection('inbox') as unknown as InboxSnapshot | undefined
  const pendingSubmissions = useSession(s => s.pendingSubmissions)
  const queue = useMemo(() => {
    const rows = inbox?.['next-turn'] ?? EMPTY_QUEUE
    const inChat = new Set<string>(
      pendingSubmissions.filter(item => item.placement === 'transcript').map(item => item.requestId),
    )
    return inChat.size === 0 ? rows : rows.filter(({ source }) => (
      source.kind !== 'user' || !('rpcId' in source) || !inChat.has((source as { rpcId: string }).rpcId)
    ))
  }, [inbox, pendingSubmissions])
  const pendingQueue = useMemo(() => {
    const admitted = new Set(queue.flatMap(({ source }) => (
      source.kind === 'user' && 'rpcId' in source ? [(source as { rpcId: string }).rpcId] : []
    )))
    return pendingSubmissions.filter(submission => (
      submission.placement === 'queued' && !admitted.has(submission.requestId)
    ))
  }, [pendingSubmissions, queue])
  const rowCount = queue.length + pendingQueue.length
  const running = useSession(s => s.running)
  const queueMutable = useSession(s => s.subagent === null || s.subagent.address.mode === 'continuable')
  const draft = useInput(s => s.draft)
  const [busy, setBusy] = useState<MessageId | null>(null)
  const [collapsed, setCollapsed] = useState(true)
  const listId = useId()

  useEffect(() => {
    if (rowCount === 0 && !collapsed) setCollapsed(true)
  }, [collapsed, rowCount])

  if (rowCount === 0) return null

  const interactionActive = queueMutable && busy !== null
  const expanded = !collapsed || interactionActive
  const listVisible = rowCount === 1 || expanded

  const applyAction = async (
    itemId: MessageId,
    action: QueueAction,
    failure: string,
  ): Promise<boolean> => {
    setBusy(itemId)
    try {
      await updateQueue(itemId, action)
      return true
    } catch {
      notify('error', failure)
      return false
    } finally {
      setBusy(current => current === itemId ? null : current)
    }
  }

  /**
   * Hand one queued row back to the composer. The draft is replaced first so a
   * refused removal still leaves the text recoverable in the input; the queue
   * row then leaves through the same remove action the delete button uses.
   */
  const handleRecall = async (row: UserMessage): Promise<void> => {
    const text = textOf(row.content)
    if (text === null) return
    const currentDraft = (draft ?? '').trim()
    inputActions.setDraft(currentDraft === '' ? text : `${currentDraft}\n${text}`)
    await applyAction(row.id, { kind: 'remove' }, t('queue.recallFailed'))
  }

  return (
    <div className={css.dock} data-queue-dock="">
      <div className={css.panel}>
        {rowCount > 1 && (
          <button
            type="button"
            className={css.header}
            aria-controls={listId}
            aria-expanded={expanded}
            disabled={interactionActive}
            onClick={() => { setCollapsed(value => !value) }}
          >
            <span className={css.lead} aria-hidden><IconQueueOutlineRegular /></span>
            <span className={css.count}>{t('queue.count', { n: rowCount })}</span>
            {!listVisible && pendingQueue.length > 0 && (
              <span className={css.status} role="status">{t('queue.sending')}</span>
            )}
            <span className={css.chevron} aria-hidden>
              {expanded ? <IconChevronDownOutlineRegular /> : <IconChevronUpOutlineRegular />}
            </span>
          </button>
        )}
        <ul id={listId} className={css.list} hidden={!listVisible}>
          {listVisible && queue.map((row) => {
            const attachments = queueAttachments(row.content)
            const text = textOf(row.content)
            return (
              <li key={row.id} className={css.row}>
                {/* Single-item strip has no count header, so the row itself carries the queue glyph. */}
                {rowCount === 1 && <span className={css.lead} aria-hidden><IconQueueOutlineRegular /></span>}
                {attachments.length > 0 && (
                  <span className={css.attachments}>
                    {attachments.map((item, index) => item.type === 'image'
                      ? (
                        <QueueThumb
                          key={`${item.attachment.attachmentId}:${index}`}
                          attachment={item.attachment}
                          loadImage={loadImage}
                          label={t('queue.image')}
                        />
                      )
                      : (
                        <QueueFile
                          key={`${item.attachment.attachmentId}:${item.attachment.name}:${index}`}
                          attachment={item.attachment}
                          label={t('queue.file', { name: item.attachment.name })}
                        />
                      ))}
                  </span>
                )}
                <span className={css.preview}>{renderFactorySlot('conversation.user.text', {
                  text: row.content.filter(block => block.type === 'text').map(block => block.text).join(''),
                  facts: QUEUE_TEXT_FACTS,
                  interactive: false,
                  ellipsis: true,
                })}</span>
                {queueMutable && (
                  <div className={css.actions}>
                    <Tooltip portal label={t('queue.recall')} side="bottom" delayMs={500} disabled={text === null}>
                      <button
                        type="button"
                        className={css.action}
                        aria-label={t('queue.recall')}
                        // Disabled buttons fire no hover events, so the
                        // unsupported hint stays a native title.
                        title={text === null ? t('queue.recall.unsupported') : undefined}
                        disabled={busy !== null || text === null}
                        onClick={() => { void handleRecall(row) }}
                      >
                        <IconEditOutlineRegular size={14} />
                      </button>
                    </Tooltip>
                    <Tooltip portal label={t('queue.remove')} side="bottom" delayMs={500}>
                      <button
                        type="button"
                        className={css.action}
                        aria-label={t('queue.remove')}
                        disabled={busy !== null}
                        onClick={() => {
                          void applyAction(
                            row.id,
                            { kind: 'remove' },
                            t('queue.removeFailed'),
                          )
                        }}
                      >
                        <IconTrashOutlineRegular size={14} />
                      </button>
                    </Tooltip>
                    <Tooltip portal label={t('queue.steer')} side="bottom" delayMs={500} disabled={!running}>
                      <button
                        type="button"
                        className={css.action}
                        aria-label={t('queue.steer')}
                        title={running ? undefined : t('queue.steer.unavailable')}
                        disabled={busy !== null || !running}
                        onClick={() => {
                          void applyAction(
                            row.id,
                            { kind: 'steer' },
                            t('queue.steerFailed'),
                          )
                        }}
                      >
                        <IconSendOutlineRegular />
                      </button>
                    </Tooltip>
                  </div>
                )}
              </li>
            )
          })}
          {listVisible && pendingQueue.map((submission) => {
            return (
              <li key={submission.requestId} className={`${css.row} ${css.pendingRow}`} data-submission-echo="">
                {rowCount === 1 && <span className={css.lead} aria-hidden><IconQueueOutlineRegular /></span>}
                {submission.attachments.length > 0 && (
                  <span className={css.attachments}>
                    {submission.attachments.map((attachment, index) => attachment.type === 'image'
                      ? (
                        <img
                          key={`${attachment.value.previewUrl}:${index}`}
                          className={css.thumb}
                          src={attachment.value.previewUrl}
                          alt={t('queue.image')}
                        />
                      )
                      : (
                        <QueueFile
                          key={`${attachment.value.attachmentId}:${attachment.value.name}:${index}`}
                          attachment={attachment.value}
                          label={t('queue.file', { name: attachment.value.name })}
                        />
                      ))}
                  </span>
                )}
                <span className={css.preview}>{renderFactorySlot('conversation.user.text', {
                  text: submission.text,
                  facts: QUEUE_TEXT_FACTS,
                  interactive: false,
                  ellipsis: true,
                })}</span>
                <span className={css.status} role="status">{t('queue.sending')}</span>
                {queueMutable && (
                  <div className={css.actions}>
                    <button
                      type="button"
                      className={css.action}
                      aria-label={t('queue.recall')}
                      title={t('queue.sending')}
                      disabled
                    >
                      <IconEditOutlineRegular size={14} />
                    </button>
                    <button
                      type="button"
                      className={css.action}
                      aria-label={t('queue.remove')}
                      title={t('queue.sending')}
                      disabled
                    >
                      <IconTrashOutlineRegular size={14} />
                    </button>
                    <button
                      type="button"
                      className={css.action}
                      aria-label={t('queue.steer')}
                      title={t('queue.sending')}
                      disabled
                    >
                      <IconSendOutlineRegular />
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
