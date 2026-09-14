import { useEffect, useId, useMemo, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  FileTypeIcon, fileSizeText,
  IconChevronDownOutline14, IconChevronUpOutline14,
  IconEditOutline16, IconQueueOutline14, IconSendOutline14, IconTrashOutline16, projectUserText, Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { SessionFace, SessionSnapshot } from '@deepseek-ai/dsh-api-session-controller/client'
import css from './QueueDock.module.css'

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

export type QueueItemId = Parameters<SessionFace['updateQueue']>[0]
export type QueueAction = Parameters<SessionFace['updateQueue']>[1]
export type QueueRow = SessionSnapshot['queue'][number]

/** Queue operations injected by the session-scoped registration. */
export interface QueueDockInjected {
  updateQueue: (itemId: QueueItemId, action: QueueAction) => Promise<void>
  notify: (level: 'info' | 'error', text: string) => void
  /** Resolve one durable queued image into a session-scoped browser URL. */
  loadImage: (attachment: ImageAttachmentRef) => Promise<string>
}

/**
 * Durable references carried by one queued row. Queue frames are wire data
 * despite their typed face, so an image or file block without a reference is skipped
 * rather than trusted.
 */
function queueAttachments(content: QueueRow['content']): Array<
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
      <span className={css.fileSize}>{fileSizeText(attachment.bytes)}</span>
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

/** Full props of a dock entry: InputZone owner share + session standard kit + global seat + the locale seat. */
export type QueueDockProps = PropsRuntime<'conversation.input.dock'> & QueueDockInjected & PropsLocale<'queueRecall'>

/**
 * Custom Queue dock: one item renders directly; multiple items default to a
 * collapsible count header; an empty queue renders nothing.
 * Clicking the edit button directly recalls the message to the composer draft.
 */
export function QueueDock({
  useSession,
  useInput,
  inputActions,
  updateQueue,
  notify,
  loadImage,
  t,
}: QueueDockProps) {
  const inbox = useSession(s => s.queue)
  const queue = useMemo(() => inbox.filter(row => row.placement === 'queued'), [inbox])
  const pendingSubmissions = useSession(s => s.pendingSubmissions)
  const pendingQueue = useMemo(() => {
    const admitted = new Set(queue.flatMap(row => row.rpcId === undefined ? [] : [row.rpcId]))
    return pendingSubmissions.filter(submission => (
      submission.placement === 'queued' && !admitted.has(submission.requestId)
    ))
  }, [pendingSubmissions, queue])

  const rowCount = queue.length + pendingQueue.length
  const running = useSession(s => s.running)
  const queueMutable = useSession(s => s.subagent === null || s.subagent.address.mode === 'continuable')
  const draft = useInput(s => s.draft)
  const [busy, setBusy] = useState<QueueItemId | null>(null)
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
    itemId: QueueItemId,
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

  const handleRecall = async (row: QueueRow): Promise<void> => {
    if (row.text === null) return
    const currentDraft = (draft ?? '').trim()
    const nextDraft = currentDraft === '' ? row.text : `${currentDraft}\n${row.text}`
    inputActions.setDraft(nextDraft)
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
            <span className={css.lead} aria-hidden><IconQueueOutline14 /></span>
            <span className={css.count}>{t('queue.count', { n: rowCount })}</span>
            {!listVisible && pendingQueue.length > 0 && (
              <span className={css.status} role="status">{t('queue.sending')}</span>
            )}
            <span className={css.chevron} aria-hidden>
              {expanded ? <IconChevronDownOutline14 /> : <IconChevronUpOutline14 />}
            </span>
          </button>
        )}
        <ul id={listId} className={css.list} hidden={!listVisible}>
          {listVisible && queue.map((row) => {
            const attachments = queueAttachments(row.content)
            return (
              <li key={row.id} className={css.row}>
                {rowCount === 1 && <span className={css.lead} aria-hidden><IconQueueOutline14 /></span>}
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
                <span className={css.preview}>{projectUserText(row.preview, [])}</span>
                {queueMutable && (
                  <div className={css.actions}>
                    <Tooltip label={t('queue.recall')} side="bottom" delayMs={500} disabled={row.text === null}>
                      <button
                        type="button"
                        className={css.action}
                        aria-label={t('queue.recall')}
                        title={row.text === null ? t('queue.recall.unsupported') : undefined}
                        disabled={busy !== null || row.text === null}
                        onClick={() => { void handleRecall(row) }}
                      >
                        <IconEditOutline16 size={14} />
                      </button>
                    </Tooltip>
                    <Tooltip label={t('queue.remove')} side="bottom" delayMs={500}>
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
                        <IconTrashOutline16 size={14} />
                      </button>
                    </Tooltip>
                    <Tooltip label={t('queue.steer')} side="bottom" delayMs={500} disabled={!running}>
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
                        <IconSendOutline14 />
                      </button>
                    </Tooltip>
                  </div>
                )}
              </li>
            )
          })}
          {listVisible && pendingQueue.map((submission) => {
            const attachments = (submission as unknown as { attachments?: readonly any[] }).attachments ?? []
            return (
              <li key={submission.requestId} className={`${css.row} ${css.pendingRow}`} data-submission-echo="">
                {rowCount === 1 && <span className={css.lead} aria-hidden><IconQueueOutline14 /></span>}
                {attachments.length > 0 && (
                  <span className={css.attachments}>
                    {attachments.map((attachment: any, index: number) => attachment.type === 'image'
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
                <span className={css.preview}>{projectUserText(submission.text, [])}</span>
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
                      <IconEditOutline16 size={14} />
                    </button>
                    <button
                      type="button"
                      className={css.action}
                      aria-label={t('queue.remove')}
                      title={t('queue.sending')}
                      disabled
                    >
                      <IconTrashOutline16 size={14} />
                    </button>
                    <button
                      type="button"
                      className={css.action}
                      aria-label={t('queue.steer')}
                      title={t('queue.sending')}
                      disabled
                    >
                      <IconSendOutline14 />
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
