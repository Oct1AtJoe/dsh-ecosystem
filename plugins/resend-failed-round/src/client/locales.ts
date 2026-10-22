/** `resend` namespace dictionaries. */
/** Dictionary namespace owned by this plugin. */
export const NS = 'resend'
/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'action.resend': '重新发起',
}
/** English dictionary (same key set). */
export const en: Record<ResendKey, string> = {
  'action.resend': 'Re-run',
}
/** Union of this namespace's dictionary keys. */
export type ResendKey = keyof typeof zh
