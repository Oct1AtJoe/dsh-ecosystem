import { readFileSync, writeFileSync } from 'node:fs'

const src = readFileSync('C:/dsh-ecosystem/tmp-perf/HANDOFF-PLAN.md', 'utf8')
const b3 = src.slice(src.indexOf('### B3'))
const open = b3.indexOf('```markdown')
const close = b3.lastIndexOf('\n```')
if (open < 0 || close < 0 || close <= open) throw new Error('B3 body not found')

const body = `${b3.slice(b3.indexOf('\n', open) + 1, close).trimEnd()}\n`
writeFileSync('C:/dsh-ecosystem/tmp-perf/discussion-body.md', body, 'utf8')

const query = `mutation($repoId: ID!, $catId: ID!, $title: String!, $body: String!) {
  createDiscussion(input: {
    repositoryId: $repoId,
    categoryId: $catId,
    title: $title,
    body: $body
  }) { discussion { number url } }
}`

const payload = {
  query,
  variables: {
    repoId: 'R_kgDOT3T1gw',
    catId: 'DIC_kwDOT3T1g84DDSUb',
    title: '[Perf] 长会话切换时「载入历史」慢：初始窗口由 turnWindow 主导，首帧载荷达 1.1-2.8MB',
    body,
  },
}
writeFileSync('C:/dsh-ecosystem/tmp-perf/discussion-payload.json', JSON.stringify(payload), 'utf8')
console.log({ bytes: Buffer.byteLength(body), lines: body.split('\n').length, head: body.slice(0, 120) })
