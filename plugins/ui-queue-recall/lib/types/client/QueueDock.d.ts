import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionFace, SessionSnapshot } from '@deepseek-ai/dsh-api-session-controller/client';
export interface ImageAttachmentRef {
    readonly attachmentId: string;
    readonly mediaType?: string;
    readonly bytes?: number;
    readonly width?: number;
    readonly height?: number;
    readonly name?: string;
}
export type QueueItemId = Parameters<SessionFace['updateQueue']>[0];
export type QueueAction = Parameters<SessionFace['updateQueue']>[1];
export type QueueRow = SessionSnapshot['queue'][number];
/** Queue operations injected by the session-scoped registration. */
export interface QueueDockInjected {
    updateQueue: (itemId: QueueItemId, action: QueueAction) => Promise<void>;
    notify: (level: 'info' | 'error', text: string) => void;
    /** Resolve one durable queued image into a session-scoped browser URL. */
    loadImage: (attachment: ImageAttachmentRef) => Promise<string>;
}
/** Full props of a dock entry: InputZone owner share + session standard kit + global seat + the locale seat. */
export type QueueDockProps = PropsRuntime<'conversation.input.dock'> & QueueDockInjected & PropsLocale<'queueRecall'>;
/**
 * Custom Queue dock: one item renders directly; multiple items default to a
 * collapsible count header; an empty queue renders nothing.
 * Clicking the edit button directly recalls the message to the composer draft.
 */
export declare function QueueDock({ useSession, useInput, inputActions, updateQueue, notify, loadImage, t, }: QueueDockProps): import("react").JSX.Element | null;
//# sourceMappingURL=QueueDock.d.ts.map