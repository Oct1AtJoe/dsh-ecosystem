/** `deliverables` namespace dictionaries. */
/** Dictionary namespace owned by this plugin. */
export const NS = 'deliverables'
/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'produced.label': '本次产物',
  'produced.moreOne': '+ 1 个文件',
  'produced.more': '+ {count} 个文件',
  'produced.open': '打开 {name}',
  'produced.showInFolder': '在文件夹中显示',
  'produced.expand': '展开 {name} 的修改内容',
  'produced.collapse': '收起 {name} 的修改内容',
  'produced.collapsePanel': '收起修改面板',
  'produced.collapseFiles': '收起',
  'produced.expandFilesAria': '展开其余 {count} 个文件',
  'produced.collapseFilesAria': '收起多余文件',
}
/** English dictionary (same key set). */
export const en: Record<DeliverablesKey, string> = {
  'produced.label': 'Produced',
  'produced.moreOne': '+ 1 file',
  'produced.more': '+ {count} files',
  'produced.open': 'Open {name}',
  'produced.showInFolder': 'Show in folder',
  'produced.expand': 'Show changes to {name}',
  'produced.collapse': 'Hide changes to {name}',
  'produced.collapsePanel': 'Collapse changes',
  'produced.collapseFiles': 'Collapse',
  'produced.expandFilesAria': 'Show {count} more files',
  'produced.collapseFilesAria': 'Show fewer files',
}
/** Union of this namespace's dictionary keys. */
export type DeliverablesKey = keyof typeof zh
