import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useState } from 'react';
import { FileTypeIcon, fileSizeText, IconChevronDownOutlineRegular, IconChevronUpOutlineRegular, IconEditOutlineRegular, IconQueueOutlineRegular, IconSendOutlineRegular, IconTrashOutlineRegular, Tooltip, } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './QueueDock.module.css';
const EMPTY_QUEUE = [];
/**
 * Facts applied to the queue preview. The composer's own user-text widget
 * carries the full chip/mention rendering, so the dock reuses it instead of
 * re-implementing a text projection.
 */
const QUEUE_TEXT_FACTS = {
    collapseWhitespace: true,
    trimWhitespace: true,
};
/**
 * Plain text of one queued row, or `null` when it carries non-text blocks.
 * Recall merges the text into the composer draft, so an image-only row has
 * nothing to hand over and keeps the action disabled.
 */
function textOf(content) {
    if (!content.every(block => block.type === 'text'))
        return null;
    return content.map(block => block.text).join('');
}
/**
 * Durable references carried by one queued row. Inbox projections are wire
 * data despite their typed face, so an image or file block without a
 * reference is skipped rather than trusted.
 */
function queueAttachments(content) {
    const attachments = [];
    for (const block of content) {
        if (block.type === 'image') {
            const { attachment } = block;
            if (attachment !== undefined)
                attachments.push({ type: 'image', attachment });
        }
        if (block.type === 'file') {
            const { attachment } = block;
            if (attachment !== undefined)
                attachments.push({ type: 'file', attachment });
        }
    }
    return attachments;
}
/** Compact file identity used beside queue thumbnails. */
function QueueFile({ attachment, label }) {
    return (_jsxs("span", { className: css.file, "aria-label": label, title: attachment.name, children: [_jsx("span", { className: css.fileIcon, "aria-hidden": true, children: _jsx(FileTypeIcon, { path: attachment.name, size: 16 }) }), _jsx("span", { className: css.fileName, children: attachment.name }), _jsx("span", { className: css.fileSize, children: fileSizeText(attachment.bytes ?? 0) })] }));
}
/** One durable queued image as a fixed-size thumbnail; a load failure keeps the empty placeholder. */
function QueueThumb({ attachment, loadImage, label }) {
    const [url, setUrl] = useState(null);
    useEffect(() => {
        let alive = true;
        loadImage(attachment).then((resolved) => { if (alive)
            setUrl(resolved); }, () => { });
        return () => { alive = false; };
    }, [attachment, loadImage]);
    return url === null
        ? _jsx("span", { className: css.thumb, "aria-hidden": true })
        : _jsx("img", { className: css.thumb, src: url, alt: label });
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
export function QueueDock({ useSession, useInput, useProjection, inputActions, updateQueue, notify, loadImage, renderFactorySlot, t, }) {
    const inbox = useProjection('inbox');
    const pendingSubmissions = useSession(s => s.pendingSubmissions);
    const queue = useMemo(() => {
        const rows = inbox?.['next-turn'] ?? EMPTY_QUEUE;
        const inChat = new Set(pendingSubmissions.filter(item => item.placement === 'transcript').map(item => item.requestId));
        return inChat.size === 0 ? rows : rows.filter(({ source }) => (source.kind !== 'user' || !('rpcId' in source) || !inChat.has(source.rpcId)));
    }, [inbox, pendingSubmissions]);
    const pendingQueue = useMemo(() => {
        const admitted = new Set(queue.flatMap(({ source }) => (source.kind === 'user' && 'rpcId' in source ? [source.rpcId] : [])));
        return pendingSubmissions.filter(submission => (submission.placement === 'queued' && !admitted.has(submission.requestId)));
    }, [pendingSubmissions, queue]);
    const rowCount = queue.length + pendingQueue.length;
    const running = useSession(s => s.running);
    const queueMutable = useSession(s => s.subagent === null || s.subagent.address.mode === 'continuable');
    const draft = useInput(s => s.draft);
    const [busy, setBusy] = useState(null);
    const [collapsed, setCollapsed] = useState(true);
    const listId = useId();
    useEffect(() => {
        if (rowCount === 0 && !collapsed)
            setCollapsed(true);
    }, [collapsed, rowCount]);
    if (rowCount === 0)
        return null;
    const interactionActive = queueMutable && busy !== null;
    const expanded = !collapsed || interactionActive;
    const listVisible = rowCount === 1 || expanded;
    const applyAction = async (itemId, action, failure) => {
        setBusy(itemId);
        try {
            await updateQueue(itemId, action);
            return true;
        }
        catch {
            notify('error', failure);
            return false;
        }
        finally {
            setBusy(current => current === itemId ? null : current);
        }
    };
    /**
     * Hand one queued row back to the composer. The draft is replaced first so a
     * refused removal still leaves the text recoverable in the input; the queue
     * row then leaves through the same remove action the delete button uses.
     */
    const handleRecall = async (row) => {
        const text = textOf(row.content);
        if (text === null)
            return;
        const currentDraft = (draft ?? '').trim();
        inputActions.setDraft(currentDraft === '' ? text : `${currentDraft}\n${text}`);
        await applyAction(row.id, { kind: 'remove' }, t('queue.recallFailed'));
    };
    return (_jsx("div", { className: css.dock, "data-queue-dock": "", children: _jsxs("div", { className: css.panel, children: [rowCount > 1 && (_jsxs("button", { type: "button", className: css.header, "aria-controls": listId, "aria-expanded": expanded, disabled: interactionActive, onClick: () => { setCollapsed(value => !value); }, children: [_jsx("span", { className: css.lead, "aria-hidden": true, children: _jsx(IconQueueOutlineRegular, {}) }), _jsx("span", { className: css.count, children: t('queue.count', { n: rowCount }) }), !listVisible && pendingQueue.length > 0 && (_jsx("span", { className: css.status, role: "status", children: t('queue.sending') })), _jsx("span", { className: css.chevron, "aria-hidden": true, children: expanded ? _jsx(IconChevronDownOutlineRegular, {}) : _jsx(IconChevronUpOutlineRegular, {}) })] })), _jsxs("ul", { id: listId, className: css.list, hidden: !listVisible, children: [listVisible && queue.map((row) => {
                            const attachments = queueAttachments(row.content);
                            const text = textOf(row.content);
                            return (_jsxs("li", { className: css.row, children: [rowCount === 1 && _jsx("span", { className: css.lead, "aria-hidden": true, children: _jsx(IconQueueOutlineRegular, {}) }), attachments.length > 0 && (_jsx("span", { className: css.attachments, children: attachments.map((item, index) => item.type === 'image'
                                            ? (_jsx(QueueThumb, { attachment: item.attachment, loadImage: loadImage, label: t('queue.image') }, `${item.attachment.attachmentId}:${index}`))
                                            : (_jsx(QueueFile, { attachment: item.attachment, label: t('queue.file', { name: item.attachment.name }) }, `${item.attachment.attachmentId}:${item.attachment.name}:${index}`))) })), _jsx("span", { className: css.preview, children: renderFactorySlot('conversation.user.text', {
                                            text: row.content.filter(block => block.type === 'text').map(block => block.text).join(''),
                                            facts: QUEUE_TEXT_FACTS,
                                            interactive: false,
                                            ellipsis: true,
                                        }) }), queueMutable && (_jsxs("div", { className: css.actions, children: [_jsx(Tooltip, { portal: true, label: t('queue.recall'), side: "bottom", delayMs: 500, disabled: text === null, children: _jsx("button", { type: "button", className: css.action, "aria-label": t('queue.recall'), 
                                                    // Disabled buttons fire no hover events, so the
                                                    // unsupported hint stays a native title.
                                                    title: text === null ? t('queue.recall.unsupported') : undefined, disabled: busy !== null || text === null, onClick: () => { void handleRecall(row); }, children: _jsx(IconEditOutlineRegular, { size: 14 }) }) }), _jsx(Tooltip, { portal: true, label: t('queue.remove'), side: "bottom", delayMs: 500, children: _jsx("button", { type: "button", className: css.action, "aria-label": t('queue.remove'), disabled: busy !== null, onClick: () => {
                                                        void applyAction(row.id, { kind: 'remove' }, t('queue.removeFailed'));
                                                    }, children: _jsx(IconTrashOutlineRegular, { size: 14 }) }) }), _jsx(Tooltip, { portal: true, label: t('queue.steer'), side: "bottom", delayMs: 500, disabled: !running, children: _jsx("button", { type: "button", className: css.action, "aria-label": t('queue.steer'), title: running ? undefined : t('queue.steer.unavailable'), disabled: busy !== null || !running, onClick: () => {
                                                        void applyAction(row.id, { kind: 'steer' }, t('queue.steerFailed'));
                                                    }, children: _jsx(IconSendOutlineRegular, {}) }) })] }))] }, row.id));
                        }), listVisible && pendingQueue.map((submission) => {
                            return (_jsxs("li", { className: `${css.row} ${css.pendingRow}`, "data-submission-echo": "", children: [rowCount === 1 && _jsx("span", { className: css.lead, "aria-hidden": true, children: _jsx(IconQueueOutlineRegular, {}) }), submission.attachments.length > 0 && (_jsx("span", { className: css.attachments, children: submission.attachments.map((attachment, index) => attachment.type === 'image'
                                            ? (_jsx("img", { className: css.thumb, src: attachment.value.previewUrl, alt: t('queue.image') }, `${attachment.value.previewUrl}:${index}`))
                                            : (_jsx(QueueFile, { attachment: attachment.value, label: t('queue.file', { name: attachment.value.name }) }, `${attachment.value.attachmentId}:${attachment.value.name}:${index}`))) })), _jsx("span", { className: css.preview, children: renderFactorySlot('conversation.user.text', {
                                            text: submission.text,
                                            facts: QUEUE_TEXT_FACTS,
                                            interactive: false,
                                            ellipsis: true,
                                        }) }), _jsx("span", { className: css.status, role: "status", children: t('queue.sending') }), queueMutable && (_jsxs("div", { className: css.actions, children: [_jsx("button", { type: "button", className: css.action, "aria-label": t('queue.recall'), title: t('queue.sending'), disabled: true, children: _jsx(IconEditOutlineRegular, { size: 14 }) }), _jsx("button", { type: "button", className: css.action, "aria-label": t('queue.remove'), title: t('queue.sending'), disabled: true, children: _jsx(IconTrashOutlineRegular, { size: 14 }) }), _jsx("button", { type: "button", className: css.action, "aria-label": t('queue.steer'), title: t('queue.sending'), disabled: true, children: _jsx(IconSendOutlineRegular, {}) })] }))] }, submission.requestId));
                        })] })] }) }));
}
//# sourceMappingURL=QueueDock.js.map