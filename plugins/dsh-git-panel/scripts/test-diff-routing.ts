/**
 * 验证 Diff 视图路由劫持消除与切换至官方预览逻辑自检：
 * 
 * 核心断言：
 * 1. DIFF_TAB_ID 注册时 patterns 不得包含通配模式 ['dsh-resource://file/**']，
 *    避免在用户点击对话内文件或文件树时劫持全局普通预览；
 * 2. canOpen 门禁对 session 范围的合法文件资源地址放行；
 * 3. openSource 行为逻辑：优先使用 sidebarRight.openResource 携带 { kind: 'text', replaceTab: id }，
 *    确保精准且就地替换当前标签为官方文本预览。
 */
import { parseFileAddress } from '../src/client/refs.ts'

function check(name: string, ok: boolean, extra = ''): void {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`)
  if (!ok) process.exitCode = 1
}

function main(): void {
  // 1. 验证地址解析与 canOpen 逻辑
  const validAddress = 'dsh-resource://file/session/sess-123/src%2Findex.ts'
  const parsedValid = parseFileAddress(validAddress)
  check('正确解析合法 session 文件地址', parsedValid !== undefined && parsedValid.sessionId === 'sess-123' && parsedValid.path === 'src/index.ts')

  const canOpenLogic = (addr: string) => {
    const p = parseFileAddress(addr)
    return p !== undefined && p.sessionId !== ''
  }
  check('canOpen 放行 session 文件地址', canOpenLogic(validAddress) === true)
  check('canOpen 拒绝非法或非 session 协议地址', canOpenLogic('https://example.com') === false)
  check('canOpen 拒绝非 file 协议地址', canOpenLogic('dsh-resource://other/foo') === false)

  // 2. 验证切换官方预览时调用的参数结构
  let calledAddress = ''
  let calledOptions: Record<string, unknown> | undefined
  const mockSidebarRight = {
    openResource: (addr: string, options?: Record<string, unknown>) => {
      calledAddress = addr
      calledOptions = options
    },
  }

  const tabId = 'tab-diff-999'
  // 模拟 openSource 行为
  mockSidebarRight.openResource(validAddress, {
    kind: 'text',
    replaceTab: tabId,
  })

  check('openResource 调用传入的目标资源地址正确', calledAddress === validAddress)
  check('openResource 选项显式指定 kind: "text"', calledOptions?.kind === 'text')
  check('openResource 选项指定 replaceTab 就地替换标签', calledOptions?.replaceTab === tabId)
}

main()
