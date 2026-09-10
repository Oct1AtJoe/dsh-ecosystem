import { useEffect, useId, useMemo, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
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
 * despite their typed face, so an image block without a reference is skipped
 * rather than trusted.
 */
function queueImageRefs(content: QueueRow['content']): ImageAttachmentRef[] {
  return content.flatMap((block) => {
    if (block.type !== 'image') return []
    const { attachment } = block as { attachment?: ImageAttachmentRef }
    return attachment === undefined ? [] : [attachment]
  })
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
 * Track request IDs of submissions that were submitted while idle (placement: transcript).
 * The host temporarily places these in inbox.nextTurn during driver wakeup/assemble, which
 * emits a transient placement: queued frame. They must not flicker into the queue dock.
 */
const transcriptRequestIds = new Set<string>()

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
  const pendingSubmissions = useSession(s => s.pendingSubmissions)

  // Track any submission originating as a transcript prompt
  for (const submission of pendingSubmissions) {
    if (submission.placement === 'transcript') {
      transcriptRequestIds.add(submission.requestId)
    }
  }

  // Filter queue: exclude messages originating from an idle transcript send
  const queue = useMemo(() => inbox.filter((row) => {
    if (row.placement !== 'queued') return false
    if (row.rpcId !== undefined && transcriptRequestIds.has(row.rpcId)) return false
    return true
  }), [inbox, pendingSubmissions])

  const pendingQueue = useMemo(() => {
    const admitted = new Set(queue.flatMap(row => row.rpcId === undefined ? [] : [row.rpcId]))
    return pendingSubmissions.filter(submission => (
      submission.placement === 'queued' && !admitted.has(submission.requestId)
    ))
  }, [pendingSubmissions, queue])

  const rowCount = queue.length + pendingQueue.length
  const running = useSession(s => s.running)
  const queueMutable = useSession(s => s.subagent === null)
  const draft = useInput(s => s.draft)
  const [busy, setBusy] = useState<QueueItemId | null>(null)
  const [collapsed, setCollapsed] = useState(true)
  const listId = useId()

  useEffect(() => {
    if (rowCount === 0 && !collapsed) setCollapsed(true)
  }, [collapsed, rowCount])

  // Prune settled IDs that are no longer pending and no longer in the inbox
  useEffect(() => {
    if (transcriptRequestIds.size === 0) return
    const active = new Set([
      ...pendingSubmissions.map(s => s.requestId),
      ...inbox.flatMap(r => r.rpcId !== undefined ? [r.rpcId] : []),
    ])
    for (const id of transcriptRequestIds) {
      if (!active.has(id as never)) {
        transcriptRequestIds.delete(id)
      }
    }
  }, [inbox, pendingSubmissions])

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
            <span className={css.chevron} aria-hidden>
              {expanded ? <IconChevronDownOutline14 /> : <IconChevronUpOutline14 />}
            </span>
          </button>
        )}
        <ul id={listId} className={css.list} hidden={!listVisible}>
          {listVisible && queue.map((row) => {
            const imageRefs = queueImageRefs(row.content)
            return (
              <li key={row.id} className={css.row}>
                {rowCount === 1 && <span className={css.lead} aria-hidden><IconQueueOutline14 /></span>}
                {imageRefs.length > 0 && (
                  <span className={css.thumbs}>
                    {imageRefs.map((attachment, index) => (
                      <QueueThumb
                        key={`${attachment.attachmentId}:${index}`}
                        attachment={attachment}
                        loadImage={loadImage}
                        label={t('queue.image')}
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
          {listVisible && pendingQueue.map(submission => (
            <li key={submission.requestId} className={css.row} data-submission-echo="">
              {rowCount === 1 && <span className={css.lead} aria-hidden><IconQueueOutline14 /></span>}
              {submission.images.length > 0 && (
                <span className={css.thumbs}>
                  {submission.images.map((image, index) => (
                    <img
                      key={`${image.previewUrl}:${index}`}
                      className={css.thumb}
                      src={image.previewUrl}
                      alt={t('queue.image')}
                    />
                  ))}
                </span>
              )}
              <span className={css.preview}>{projectUserText(submission.text, [])}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
