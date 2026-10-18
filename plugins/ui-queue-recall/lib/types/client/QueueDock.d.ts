import type { PropsLocale, PropsRenderFactories, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { QueueAction } from '@deepseek-ai/dsh-api-session-controller/types';
import type { MessageId } from '@deepseek-ai/dsh-llm/brand';
export interface ImageAttachmentRef {
    readonly attachmentId: string;
    readonly mediaType?: string;
    readonly bytes?: number;
    readonly width?: number;
    readonly height?: number;
    readonly name?: string;
}
export interface FileAttachmentRef {
    readonly attachmentId: string;
    readonly name: string;
    readonly bytes?: number;
    readonly mediaType?: string;
}
/** Queue operations injected by the session-scoped registration. */
export interface QueueDockInjected {
    updateQueue: (itemId: MessageId, action: QueueAction) => Promise<void>;
    notify: (level: 'info' | 'error', text: string) => void;
    /** Resolve one durable queued image into a session-scoped browser URL. */
    loadImage: (attachment: ImageAttachmentRef) => Promise<string>;
}
/**
 * Full props of a dock entry: InputZone owner share + session standard kit
 * (useSession / useInput / inputActions) + global seat + the locale seat.
 */
export type QueueDockProps = PropsRuntime<'conversation.input.dock'> & QueueDockInjected & PropsLocale<'queueRecall'> & PropsRenderFactories;
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
export declare function QueueDock({ useSession, useInput, useProjection, inputActions, updateQueue, notify, loadImage, renderFactorySlot, t, }: QueueDockProps): import("react").JSX.Element | null;
//# sourceMappingURL=QueueDock.d.ts.map