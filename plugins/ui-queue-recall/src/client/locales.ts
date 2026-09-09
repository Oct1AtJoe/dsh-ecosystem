export const NS = 'queueRecall' as const

export const zh = {
  'queue.count': '{n} 条排队消息',
  'queue.image': '排队消息图片',
  'queue.recall': '撤回至输入框',
  'queue.recall.unsupported': '包含非文本内容，暂不支持撤回',
  'queue.recallFailed': '撤回排队消息失败',
  'queue.remove': '删除排队消息',
  'queue.removeFailed': '删除失败：这条消息可能已经开始发送。',
  'queue.steer': '插话发送',
  'queue.steer.unavailable': '仅运行中可插话发送',
  'queue.steerFailed': '插话发送失败，请重试。',
} as const

export const en = {
  'queue.count': '{n} queued messages',
  'queue.image': 'Queued message image',
  'queue.recall': 'Recall to draft',
  'queue.recall.unsupported': 'Contains non-text content; recall is not supported yet',
  'queue.recallFailed': 'Failed to recall queued message',
  'queue.remove': 'Remove queued message',
  'queue.removeFailed': 'Removal failed: this message may have already started sending.',
  'queue.steer': 'Steer queued message',
  'queue.steer.unavailable': 'Steering is available only while the agent is running',
  'queue.steerFailed': 'Steering failed. Try again.',
} as const

export type QueueRecallKey = keyof typeof zh
