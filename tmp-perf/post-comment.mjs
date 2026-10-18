import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const body = readFileSync('C:/dsh-ecosystem/tmp-perf/comment-body.md', 'utf8')
if (typeof body !== 'string' || body.length < 100) throw new Error('body not read')
if (body.includes('FileSystemProvider')) throw new Error('body polluted')

const query = `mutation($discussionId: ID!, $body: String!) {
  addDiscussionComment(input: { discussionId: $discussionId, body: $body }) {
    comment { id url createdAt }
  }
}`

const payload = JSON.stringify({
  query,
  variables: { discussionId: 'D_kwDOT3T1g84AqM3K', body },
})

const file = 'C:/dsh-ecosystem/tmp-perf/comment-payload.json'
writeFileSync(file, payload, 'utf8')
console.log(JSON.stringify({ bodyBytes: Buffer.byteLength(body), payloadBytes: Buffer.byteLength(payload) }))

const out = execFileSync('gh', ['api', 'graphql', '--input', file], { encoding: 'utf8' })
console.log(out)
