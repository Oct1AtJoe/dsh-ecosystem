/**
 * Elect the entry on a turn that ended terminally. Pure over the owner
 * props: the turn/end reason rides the tail owner's TurnLocation. Whether
 * this is still the latest failed round, and the round's user text, are the
 * component's chat-snapshot scan.
 * @param owner - tail owner currency for the closing turn.
 * @returns the elected reason, or null to decline.
 */
export const resendSelect = (owner) => {
    const end = owner.turn.end;
    if (end === undefined)
        return null;
    const reason = end.data.reason;
    return reason.kind === 'error' || reason.kind === 'max-tokens' ? { reason: reason.kind } : null;
};
//# sourceMappingURL=slots.js.map