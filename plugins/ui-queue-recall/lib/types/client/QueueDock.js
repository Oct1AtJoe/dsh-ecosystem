import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useState } from 'react';
import { IconChevronDownOutline14, IconChevronUpOutline14, IconEditOutline16, IconQueueOutline14, IconSendOutline14, IconTrashOutline16, projectUserText, Tooltip, } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './QueueDock.module.css';
/**
 * Durable references carried by one queued row. Queue frames are wire data
 * despite their typed face, so an image block without a reference is skipped
 * rather than trusted.
 */
function queueImageRefs(content) {
    return content.flatMap((block) => {
        if (block.type !== 'image')
            return [];
        const { attachment } = block;
        return attachment === undefined ? [] : [attachment];
    });
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
 * Custom Queue dock: one item renders directly; multiple items default to a
 * collapsible count header; an empty queue renders nothing.
 * Clicking the edit button directly recalls the message to the composer draft.
 */
export function QueueDock({ useSession, useInput, inputActions, updateQueue, notify, loadImage, t, }) {
    const inbox = useSession(s => s.queue);
    const queue = useMemo(() => inbox.filter(row => row.placement === 'queued'), [inbox]);
    const pendingSubmissions = useSession(s => s.pendingSubmissions);
    const pendingQueue = useMemo(() => {
        const admitted = new Set(queue.flatMap(row => row.rpcId === undefined ? [] : [row.rpcId]));
        return pendingSubmissions.filter(submission => (submission.placement === 'queued' && !admitted.has(submission.requestId)));
    }, [pendingSubmissions, queue]);
    const rowCount = queue.length + pendingQueue.length;
    const running = useSession(s => s.running);
    const queueMutable = useSession(s => s.subagent === null);
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
    const handleRecall = async (row) => {
        if (row.text === null)
            return;
        const currentDraft = (draft ?? '').trim();
        const nextDraft = currentDraft === '' ? row.text : `${currentDraft}\n${row.text}`;
        inputActions.setDraft(nextDraft);
        await applyAction(row.id, { kind: 'remove' }, t('queue.recallFailed'));
    };
    return (_jsx("div", { className: css.dock, "data-queue-dock": "", children: _jsxs("div", { className: css.panel, children: [rowCount > 1 && (_jsxs("button", { type: "button", className: css.header, "aria-controls": listId, "aria-expanded": expanded, disabled: interactionActive, onClick: () => { setCollapsed(value => !value); }, children: [_jsx("span", { className: css.lead, "aria-hidden": true, children: _jsx(IconQueueOutline14, {}) }), _jsx("span", { className: css.count, children: t('queue.count', { n: rowCount }) }), _jsx("span", { className: css.chevron, "aria-hidden": true, children: expanded ? _jsx(IconChevronDownOutline14, {}) : _jsx(IconChevronUpOutline14, {}) })] })), _jsxs("ul", { id: listId, className: css.list, hidden: !listVisible, children: [listVisible && queue.map((row) => {
                            const imageRefs = queueImageRefs(row.content);
                            return (_jsxs("li", { className: css.row, children: [rowCount === 1 && _jsx("span", { className: css.lead, "aria-hidden": true, children: _jsx(IconQueueOutline14, {}) }), imageRefs.length > 0 && (_jsx("span", { className: css.thumbs, children: imageRefs.map((attachment, index) => (_jsx(QueueThumb, { attachment: attachment, loadImage: loadImage, label: t('queue.image') }, `${attachment.attachmentId}:${index}`))) })), _jsx("span", { className: css.preview, children: projectUserText(row.preview, []) }), queueMutable && (_jsxs("div", { className: css.actions, children: [_jsx(Tooltip, { label: t('queue.recall'), side: "bottom", delayMs: 500, disabled: row.text === null, children: _jsx("button", { type: "button", className: css.action, "aria-label": t('queue.recall'), title: row.text === null ? t('queue.recall.unsupported') : undefined, disabled: busy !== null || row.text === null, onClick: () => { void handleRecall(row); }, children: _jsx(IconEditOutline16, { size: 14 }) }) }), _jsx(Tooltip, { label: t('queue.remove'), side: "bottom", delayMs: 500, children: _jsx("button", { type: "button", className: css.action, "aria-label": t('queue.remove'), disabled: busy !== null, onClick: () => {
                                                        void applyAction(row.id, { kind: 'remove' }, t('queue.removeFailed'));
                                                    }, children: _jsx(IconTrashOutline16, { size: 14 }) }) }), _jsx(Tooltip, { label: t('queue.steer'), side: "bottom", delayMs: 500, disabled: !running, children: _jsx("button", { type: "button", className: css.action, "aria-label": t('queue.steer'), title: running ? undefined : t('queue.steer.unavailable'), disabled: busy !== null || !running, onClick: () => {
                                                        void applyAction(row.id, { kind: 'steer' }, t('queue.steerFailed'));
                                                    }, children: _jsx(IconSendOutline14, {}) }) })] }))] }, row.id));
                        }), listVisible && pendingQueue.map(submission => (_jsxs("li", { className: css.row, "data-submission-echo": "", children: [rowCount === 1 && _jsx("span", { className: css.lead, "aria-hidden": true, children: _jsx(IconQueueOutline14, {}) }), submission.images.length > 0 && (_jsx("span", { className: css.thumbs, children: submission.images.map((image, index) => (_jsx("img", { className: css.thumb, src: image.previewUrl, alt: t('queue.image') }, `${image.previewUrl}:${index}`))) })), _jsx("span", { className: css.preview, children: projectUserText(submission.text, []) })] }, submission.requestId)))] })] }) }));
}
//# sourceMappingURL=QueueDock.js.map