import { privateTargetReason } from '../runtime/net.js';
/* 受本门管辖的两个工具。 */
const GATED_TOOLS = new Set(['tabbit_browser', 'web_fetch']);
/*
 * 把"想发起一次询问"折算成当前模式下的正确结论：
 *  - 会话审批策略覆盖为 `never`（= Full access 模式）→ 'bypass' 放行
 *    （理由见文件头：ask 注定被自动拒，发出去只会造成误伤）；
 *  - 审批服务根本没挂载（某些 headless 组合）→ 返回一个【解释了出路】的
 *    拒绝：告诉用户去 settings 把 tabbit.<key> 设为 always。若不接手，
 *    dsh 工具层的通用拒绝文案会把这条出路藏没；
 *  - 其它情况 → 正常返回 ask，交给审批 UI 问用户。
 */
function resolveAsk(ctx, exec, askReason, settingsKey) {
    // ctx.get('approval')：按名取服务的"软"方式——不在 inject 里声明硬依赖，
    // 服务缺席时拿到 undefined 而不是崩溃。
    const approval = ctx.get('approval');
    if (approval !== undefined && exec.agent !== undefined) {
        try {
            // overrideOf(session)：读该会话的审批策略覆盖（dsh-user-approval API）。
            // ⚠️ 这个 API 只能在"开着的 turn"内调用（本处理器正是在 turn 内跑的）。
            if (approval.overrideOf(exec.agent.session) === 'never')
                return 'bypass';
        }
        catch {
            /* 会话形状不认识：当普通情况处理，照常询问 */
        }
    }
    if (approval === undefined) {
        return {
            kind: 'deny',
            reason: `This action needs user confirmation (settings tabbit.${settingsKey} = ask), but no approval channel is mounted in this composition. Set settings tabbit.${settingsKey} to "always" to allow it without prompts.`,
        };
    }
    return { kind: 'ask', reason: askReason };
}
export const name = 'tabbit-permissions';
export const inject = ['tools', 'tabbit'];
export function apply(ctx) {
    // "挂账本"：已发出的内网询问，callId → 该在调用成功后授信的 (会话, origin)。
    // 只在 ask 路径上挂账——这保证授权永远不可能发给"决策当时是公网"的目标
    // （防 DNS rebinding 继承授权，见文件头）。
    const pendingIntranetGrants = new Map();
    // ── 事前拦截：tools/pre-execute 瀑布 ──────────────────────────────────
    ctx.on('tools/pre-execute', async function (exec, next) {
        // 不归我们管的工具：立刻放行给下一个处理器。
        if (!GATED_TOOLS.has(exec.name))
            return next();
        const settings = ctx.tabbit.currentSettings();
        // 总闸 never：两个工具一律拒绝。
        if (settings.pageAccess === 'never') {
            return {
                kind: 'deny',
                reason: 'Tabbit Browser page access is disabled (settings tabbit.pageAccess = never).',
            };
        }
        // ── 附加闸：web_fetch 的内网目标检查（在总闸之前查，因为它更具体）──
        if (exec.name === 'web_fetch') {
            const url = urlArgumentOf(exec.arguments);
            if (url !== undefined) {
                // 内网判定（net.ts）：返回原因字符串 = 是内网；undefined = 公网/未知。
                const reason = await privateTargetReason(url);
                if (reason !== undefined) {
                    if (settings.intranetFetch === 'never') {
                        return {
                            kind: 'deny',
                            reason: `web_fetch to a private/intranet target is disabled (${reason}; settings tabbit.intranetFetch = never).`,
                        };
                    }
                    if (settings.intranetFetch === 'ask') {
                        const agentId = exec.agent !== undefined ? String(exec.agent.id) : undefined;
                        const origin = originOf(url);
                        // 本会话对这个 origin 是否已授权过？
                        const granted = agentId !== undefined && origin !== undefined && ctx.tabbit.hasIntranetGrant(agentId, origin);
                        if (!granted) {
                            const outcome = resolveAsk(ctx, exec, `web_fetch targets a PRIVATE/INTRANET address through your browser: ${reason}. First request to ${origin ?? 'this target'} in this session — allow it? (Set settings tabbit.intranetFetch to "always" to skip these prompts.)`, 'intranetFetch');
                            if (outcome !== 'bypass') {
                                // 真的发出了询问：按 callId 挂账，等 tools/result 里对账。
                                if (outcome.kind === 'ask' && agentId !== undefined && origin !== undefined) {
                                    pendingIntranetGrants.set(String(exec.callId), { agentId, origin });
                                }
                                return outcome;
                            }
                            // bypass（Full access）：内网闸放行，继续走下面的总闸检查。
                        }
                    }
                    // intranetFetch === 'always'：不拦，继续。
                }
            }
        }
        // ── 总闸：pageAccess = ask 且本会话还没授权过 → 发起询问 ──────────
        if (settings.pageAccess === 'ask' && exec.agent !== undefined && !ctx.tabbit.hasPageAccessGrant(String(exec.agent.id))) {
            const outcome = resolveAsk(ctx, exec, 'First Tabbit Browser page access in this session: the agent will browse with your real browser profile, including logged-in sessions. Allow browser access for this session? (Set settings tabbit.pageAccess to "always" to skip this prompt.)', 'pageAccess');
            if (outcome !== 'bypass')
                return outcome;
        }
        // 所有门都过了：放行执行。
        return next();
    });
    // ── 事后记账：tools/result ────────────────────────────────────────────
    // 一次被门拦过的调用最终【成功】，说明用户点了允许（或策略放行）——把授权
    // 记进会话记忆，让询问做到"页面访问每会话一次、内网每会话每 origin 一次"，
    // 而不是每次调用都问。失败什么都不记（用户拒绝/执行出错，下次重试再问）。
    ctx.on('tools/result', (exec, result) => {
        // 先对内网挂账：找到本 callId 的账，成功才授信，成败都销账。
        const pending = pendingIntranetGrants.get(String(exec.callId));
        if (pending !== undefined) {
            pendingIntranetGrants.delete(String(exec.callId));
            if (!result.isError)
                ctx.tabbit.grantIntranet(pending.agentId, pending.origin);
        }
        // 再记总闸授权：任何受管工具的成功调用都算"用户认可过页面访问"。
        if (!GATED_TOOLS.has(exec.name))
            return;
        if (result.isError)
            return;
        if (exec.agent === undefined)
            return;
        ctx.tabbit.grantPageAccess(String(exec.agent.id));
    });
}
/* 提取 URL 的 origin（协议+主机+端口）——内网授权的记忆粒度。 */
function originOf(url) {
    try {
        return new URL(url).origin;
    }
    catch {
        return undefined;
    }
}
/* 从工具参数里安全地抠出 url 字段（参数是模型给的，形状不可信，逐层判断）。 */
function urlArgumentOf(args) {
    if (typeof args !== 'object' || args === null)
        return undefined;
    const url = args.url;
    return typeof url === 'string' ? url : undefined;
}
