import type { Context } from '@deepseek-ai/cordis'
import { createUsage } from './usage.ts'

const USAGE_PATH = '/ui-theme-custom/usage'
const USAGE_TTL_MS = 3 * 1000

function refusalOf(ctx: any, req: any): number | undefined {
  const connection = ctx.get('connection')
  if (typeof connection?.requestRejection === 'function') {
    return connection.requestRejection(req)
  }
  const host = req.headers?.host
  if (host !== undefined) {
    if (!URL.canParse(`http://${host}`)) return 403
    const name = new URL(`http://${host}`).hostname
    if (name !== 'localhost' && name !== '[::1]' && !/^127\.\d+\.\d+\.\d+$/.test(name)) return 403
  }
  const site = req.headers?.['sec-fetch-site']
  if (site !== undefined && site !== 'same-origin' && site !== 'none') return 403
  const origin = req.headers?.origin
  if (origin === undefined) return undefined
  if (!URL.canParse(origin)) return 403
  return new URL(origin).host === host ? undefined : 403
}

function sendJson(res: any, status: number, payload: any) {
  const body = ((globalThis as any).Buffer ?? Buffer).from(JSON.stringify(payload))
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.byteLength),
    'cache-control': 'no-store',
  })
  res.end(body)
}

export function registerRoutes(ctx: Context, scope: any) {
  const usage = createUsage(ctx)
  const disposers: (() => void)[] = []

  const methodRefused = (req: any, res: any, methods: string[]) => {
    if (req.method !== undefined && methods.includes(req.method)) return false
    res.writeHead(405, { allow: methods.join(', ') })
    res.end()
    return true
  }

  const fenceRefused = (req: any, res: any) => {
    const refused = refusalOf(ctx, req)
    if (refused === undefined) return false
    sendJson(res, refused, { ok: false, error: refused === 401 ? 'unauthorized' : 'forbidden' })
    return true
  }

  const register = (route: any) => {
    try {
      const disposer = scope.webServer?.register(route)
      if (typeof disposer === 'function') disposers.push(disposer)
    } catch (error: any) {
      ctx.logger?.warn?.(`ui-theme-custom: route unavailable: ${error?.message ?? String(error)}`)
    }
  }

  register({
    kind: 'exact',
    path: USAGE_PATH,
    handler: (req: any, res: any) => {
      if (methodRefused(req, res, ['GET', 'HEAD'])) return
      if (fenceRefused(req, res)) return
      let snapshot = usage.snapshot()
      const stale = snapshot.value === null
        || snapshot.computing === true
        || Date.now() - (snapshot.value?.computedAt ?? 0) > USAGE_TTL_MS
      if (stale) {
        void usage.refresh()
        snapshot = usage.snapshot()
      }
      sendJson(res, 200, {
        ok: true,
        value: snapshot.value,
        computing: snapshot.computing === true,
        ...(snapshot.error !== undefined ? { error: snapshot.error } : {}),
      })
    },
  })

  return () => {
    usage.dispose()
    for (const dispose of disposers) {
      try {
        dispose()
      } catch {}
    }
  }
}
