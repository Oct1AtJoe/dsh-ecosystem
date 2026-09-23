// src/index.ts
import { realpath as realpath2 } from "node:fs/promises";

// src/host/git-service.ts
import { spawn } from "node:child_process";
import { readFile as readBytes, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join, relative as relativePath, resolve as resolvePath, sep } from "node:path";
import { existsSync, readFileSync } from "node:fs";
var OUTPUT_CAP_BYTES = 1 << 20;
var DIFF_TEXT_CAP_BYTES = 1 << 21;
function safeRelative(name) {
  if (name === "" || name.startsWith("/") || name.startsWith("\\")) return false;
  if (/^[a-zA-Z]:/u.test(name)) return false;
  if (name === ".." || name.startsWith("../") || name.includes("/../") || name.endsWith("/..")) return false;
  return true;
}
function inside(root, absolute) {
  if (absolute === root) return true;
  return absolute.startsWith(root.endsWith(sep) ? root : `${root}${sep}`);
}
function subprocessRunner(_ctx) {
  let current = null;
  return {
    cancel() {
      if (current !== null) {
        current.kill("SIGTERM");
        current = null;
      }
    },
    async run(argv, cwd) {
      return new Promise((resolve) => {
        const isWindows = process.platform === "win32";
        const homeDir = homedir();
        const env = {
          ...process.env,
          ...isWindows ? {
            USERPROFILE: process.env.USERPROFILE || homeDir,
            HOME: process.env.HOME || process.env.USERPROFILE || homeDir,
            APPDATA: process.env.APPDATA || `${homeDir}\\AppData\\Roaming`,
            LOCALAPPDATA: process.env.LOCALAPPDATA || `${homeDir}\\AppData\\Local`
          } : {},
          // 后台进程绝不进入交互式提示：没有 TTY，一旦发问就会挂到超时。
          GIT_TERMINAL_PROMPT: "0",
          // GCM 的 GUI 对话框需要有桌面会话；本进程由 launchd 后台拉起，
          // 弹窗可能无人应答而卡死，因此明确禁掉 GUI，让它直接报错。
          GCM_INTERACTIVE: "never",
          GCM_MODAL_PROMPT: "false",
          // VS Code 同款：强制英文输出 + 不分页。
          LANGUAGE: "en",
          LC_ALL: "en_US.UTF-8",
          LANG: "en_US.UTF-8",
          GIT_PAGER: "cat",
          // 企业内网 GitLab 不走代理，直连更快。
          NO_PROXY: "*sjfood.us,localhost,127.0.0.1",
          no_proxy: "*sjfood.us,localhost,127.0.0.1"
        };
        const isNetworkOp = argv.includes("pull") || argv.includes("fetch") || argv.includes("push") || argv.includes("clone");
        const timeout = isNetworkOp ? 9e4 : 2e4;
        const credPath = join(homeDir, ".git-credentials");
        const credArgs = existsSync(credPath) ? [
          "-c",
          `credential.helper=store --file=${credPath}`,
          // 我们的凭据按主机存（https://user:pass@host）；若开了 useHttpPath，
          // git 会要求按仓库路径精确匹配从而永远取不到，这里显式关闭。
          "-c",
          "credential.useHttpPath=false"
        ] : [];
        const fullArgv = [...credArgs, ...argv];
        let timedOut = false;
        const child = spawn("git", fullArgv, {
          cwd,
          windowsHide: true,
          env,
          stdio: ["ignore", "pipe", "pipe"]
        });
        current = child;
        const MAX = OUTPUT_CAP_BYTES;
        let stdout = "";
        let stderr = "";
        let settled = false;
        child.stdout?.setEncoding("utf8");
        child.stderr?.setEncoding("utf8");
        child.stdout?.on("data", (chunk) => {
          if (stdout.length < MAX) stdout += chunk;
        });
        child.stderr?.on("data", (chunk) => {
          if (stderr.length < MAX) stderr += chunk;
        });
        const timer = setTimeout(() => {
          timedOut = true;
          try {
            child.kill("SIGTERM");
          } catch {
          }
        }, timeout);
        const finish = (exitCode) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          current = null;
          if (exitCode !== 0) {
            let errMsg = stderr.trim() !== "" ? stderr.trim() : `git exited with code ${exitCode}`;
            if (timedOut) {
              errMsg = "E_TIMEOUT: operation timed out";
            }
            resolve({ exitCode, stdout, stderr: errMsg });
          } else {
            resolve({ exitCode: 0, stdout, stderr });
          }
        };
        child.on("error", (err) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          current = null;
          resolve({ exitCode: 1, stdout, stderr: err.message || String(err) });
        });
        child.on("close", (code) => finish(code ?? 1));
      });
    }
  };
}
var REC = "";
var FIELD = "";
function sanitize(text) {
  return text.replace(/[\u0000-\u001d\u007f]/g, " ");
}
function splitRecords(text) {
  return text.split(REC).map((record) => record.startsWith("\n") ? record.slice(1) : record).filter((record) => record !== "");
}
var GitService = class {
  constructor(runner, gate) {
    this.runner = runner;
    this.gate = gate;
  }
  async requireWorkspace(path) {
    const verdict = await this.gate(path);
    if (!verdict.ok) throw Object.assign(new Error(verdict.error.message), { gitError: verdict.error });
    return verdict.canonical;
  }
  /** 解析仓库显示名（顶层目录的基名）。 */
  async repoName(canonical) {
    const run = await this.runner.run(["rev-parse", "--show-toplevel"], canonical);
    if (run.exitCode !== 0) return canonical.split(/[\\/]/).pop() ?? canonical;
    return run.stdout.trim().split(/[\\/]/).pop() ?? canonical;
  }
  /** 当前分支短名（HEAD 游离时为空）。 */
  async currentBranch(canonical) {
    const run = await this.runner.run(["symbolic-ref", "--quiet", "--short", "HEAD"], canonical);
    return run.exitCode === 0 ? run.stdout.trim() : "";
  }
  /** 轻量级当前分支探测（一次或两次 git 调用），用于 chip 标签。 */
  async current(path) {
    const canonical = await this.requireWorkspace(path);
    const [repo, current] = await Promise.all([
      this.repoName(canonical),
      this.currentBranch(canonical)
    ]);
    return { repo, current };
  }
  /** 带 ahead/behind 相对上游的分支列表。 */
  async branches(path) {
    const canonical = await this.requireWorkspace(path);
    const [repo, current] = await Promise.all([
      this.repoName(canonical),
      this.currentBranch(canonical)
    ]);
    const run = await this.runner.run(
      ["for-each-ref", `--format=%(refname)${FIELD}%(objectname:short)${FIELD}%(committerdate:iso8601)${FIELD}%(subject)${FIELD}%(upstream:short)${REC}`, "refs/heads", "refs/remotes"],
      canonical
    );
    if (run.exitCode !== 0) {
      throw Object.assign(
        new Error(run.stderr.trim() || "not a git repository"),
        { gitError: { code: "not-a-repo", message: run.stderr.trim() || "not a git repository" } }
      );
    }
    const local = [];
    const remote = [];
    const withUpstream = [];
    for (const record of splitRecords(run.stdout)) {
      const [ref, sha, date, subject, upstream] = record.split(FIELD);
      if (!ref || !sha) continue;
      const isRemote = ref.startsWith("refs/remotes/");
      const name = isRemote ? ref.slice("refs/remotes/".length) : ref.slice("refs/heads/".length);
      const row = {
        name: sanitize(name),
        sha: sanitize(sha),
        date: sanitize(date),
        subject: sanitize(subject ?? "").slice(0, 80),
        current: !isRemote && name === current
      };
      if (isRemote) {
        remote.push(row);
      } else {
        local.push(row);
        if (upstream) withUpstream.push([row, upstream]);
      }
    }
    await Promise.all(withUpstream.map(async ([row, upstream]) => {
      const count = await this.runner.run(["rev-list", "--left-right", "--count", `${row.name}...${upstream}`], canonical);
      if (count.exitCode !== 0) return;
      const [a, b] = count.stdout.trim().split(/\s+/).map(Number);
      row.ahead = Number.isFinite(a) ? a : 0;
      row.behind = Number.isFinite(b) ? b : 0;
    }));
    const sortRows = (rows) => {
      rows.sort((x, y) => x.name === current ? -1 : y.name === current ? 1 : x.name.localeCompare(y.name));
      return rows;
    };
    return { repo, current, local: sortRows(local), remote: sortRows(remote) };
  }
  /** 切换到已存在的分支（或为远程分支创建本地跟踪分支）。 */
  async switchBranch(path, branch) {
    const canonical = await this.requireWorkspace(path);
    const argv = branch.startsWith("origin/") ? ["switch", "-c", branch.slice("origin/".length), "--track", branch] : ["switch", branch];
    const run = await this.runner.run(argv, canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: "switch-failed", message: run.stderr.trim() || `git switch ${branch} failed` } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /** 拉取当前分支（使用其上游）。 */
  async pull(path) {
    const canonical = await this.requireWorkspace(path);
    const run = await this.runner.run(["pull"], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: "pull-failed", message: run.stderr.trim() || "git pull failed" } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /** 拉取所有远程，并执行 prune。 */
  async fetchAll(path) {
    const canonical = await this.requireWorkspace(path);
    const run = await this.runner.run(["fetch", "--all", "--prune"], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: "fetch-failed", message: run.stderr.trim() || "git fetch failed" } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /** 重命名本地分支（git branch -m）。 */
  async renameBranch(path, from, to) {
    const canonical = await this.requireWorkspace(path);
    const run = await this.runner.run(["branch", "-m", from, to], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: "rename-failed", message: run.stderr.trim() || "git branch -m failed" } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /** 强制删除本地分支（git branch -D）。 */
  async deleteBranch(path, branch) {
    const canonical = await this.requireWorkspace(path);
    const run = await this.runner.run(["branch", "-D", branch], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: "delete-failed", message: run.stderr.trim() || "git branch -D failed" } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /** 删除远程分支（git push <remote> --delete <name>）。 */
  async deleteRemoteBranch(path, branch) {
    const canonical = await this.requireWorkspace(path);
    const slash = branch.indexOf("/");
    if (slash <= 0 || slash === branch.length - 1) {
      return { ok: false, output: "", error: { code: "bad-branch", message: `invalid remote branch: ${branch}` } };
    }
    const remote = branch.slice(0, slash);
    const name = branch.slice(slash + 1);
    const run = await this.runner.run(["push", remote, "--delete", name], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: "delete-failed", message: run.stderr.trim() || "git push --delete failed" } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /** 将某分支合入当前分支（git merge --no-edit）。 */
  async mergeBranch(path, branch) {
    const canonical = await this.requireWorkspace(path);
    const run = await this.runner.run(["merge", "--no-edit", branch], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: "merge-failed", message: run.stderr.trim() || "git merge failed" } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /** 工作区状态摘要：变更文件列表（git status --porcelain）并自动读取 MERGE_MSG。 */
  async status(path) {
    const canonical = await this.requireWorkspace(path);
    const run = await this.runner.run(["status", "--porcelain", "--untracked-files=all"], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: "", error: { code: "status-failed", message: run.stderr.trim() || "git status failed" } };
    }
    const lines = run.stdout.split("\n").filter((l) => l.trim() !== "");
    const output = lines.join("\n");
    let mergeMsg = "";
    try {
      const revTop = await this.runner.run(["rev-parse", "--git-dir"], canonical);
      const gitDir = revTop.exitCode === 0 ? revTop.stdout.trim() : ".git";
      const fullGitDir = gitDir.startsWith("/") || /^[a-zA-Z]:/.test(gitDir) ? gitDir : join(canonical, gitDir);
      const mergeMsgPath = join(fullGitDir, "MERGE_MSG");
      if (existsSync(mergeMsgPath)) {
        mergeMsg = readFileSync(mergeMsgPath, "utf8").split("\n")[0].trim();
      }
    } catch {
    }
    return { ok: true, output, mergeMsg };
  }
  /** 单个文件暂存（git add -- <file>）。 */
  async stageFile(path, file) {
    const canonical = await this.requireWorkspace(path);
    const name = file.trim();
    if (name === "" || name.startsWith("/") || name === ".." || name.includes("/../")) {
      return { ok: false, output: "", error: { code: "invalid-file", message: "\u975E\u6CD5\u6587\u4EF6\u8DEF\u5F84" } };
    }
    const run = await this.runner.run(["add", "--", name], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: "stage-failed", message: run.stderr.trim() || "git add failed" } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /** 取消单个文件暂存（git reset HEAD -- <file> 或 git restore --staged -- <file>）。 */
  async unstageFile(path, file) {
    const canonical = await this.requireWorkspace(path);
    const name = file.trim();
    if (name === "" || name.startsWith("/") || name === ".." || name.includes("/../")) {
      return { ok: false, output: "", error: { code: "invalid-file", message: "\u975E\u6CD5\u6587\u4EF6\u8DEF\u5F84" } };
    }
    const run = await this.runner.run(["reset", "HEAD", "--", name], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: "unstage-failed", message: run.stderr.trim() || "git reset failed" } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /** 放弃工作区未暂存修改（git checkout -- <file> 或 git clean for untracked）。 */
  async discardFile(path, file, untracked) {
    const canonical = await this.requireWorkspace(path);
    const name = file.trim();
    if (name === "" || name.startsWith("/") || name === ".." || name.includes("/../")) {
      return { ok: false, output: "", error: { code: "invalid-file", message: "\u975E\u6CD5\u6587\u4EF6\u8DEF\u5F84" } };
    }
    const argv = untracked ? ["clean", "-fd", "--", name] : ["checkout", "--", name];
    const run = await this.runner.run(argv, canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: "discard-failed", message: run.stderr.trim() || "discard failed" } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /** 单个文件的变更 diff（已暂存 + 未暂存，git diff HEAD -- <file>）。 */
  async diffFile(path, file) {
    const canonical = await this.requireWorkspace(path);
    const name = file.trim();
    if (name === "" || name.startsWith("/") || name === ".." || name.includes("/../")) {
      return { ok: false, output: "", error: { code: "invalid-file", message: "\u975E\u6CD5\u6587\u4EF6\u8DEF\u5F84" } };
    }
    const run = await this.runner.run(["diff", "HEAD", "--", name], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: "", error: { code: "diff-failed", message: run.stderr.trim() || "git diff failed" } };
    }
    return { ok: true, output: run.stdout };
  }
  /**
   * 暂存区（staged）的变更内容，外加仓库最近的提交主题。
   *
   * 自动生成提交信息只需这两样：`git diff --cached` 说明「改了什么」，
   * 最近的主题说明「这个仓库怎么写提交信息」（语言 / 前缀 / 语气）。
   * 暂存区为空时 diff 为空串，由调用方据此给出提示且不触发生成。
   */
  async stagedContext(path) {
    const canonical = await this.requireWorkspace(path);
    const run = await this.runner.run(["diff", "--cached"], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, error: { code: "diff-failed", message: run.stderr.trim() || "git diff --cached failed" } };
    }
    const log = await this.runner.run(["log", "-5", "--format=%s"], canonical);
    const subjects = log.exitCode === 0 ? log.stdout.split("\n").map((line) => line.trim()).filter((line) => line !== "") : [];
    return { ok: true, diff: run.stdout, subjects };
  }
  /** 获取文件 HEAD 版本的内容（git show HEAD:<仓库相对路径>）。 */
  async showHead(path, file) {
    const canonical = await this.requireWorkspace(path);
    const name = file.trim();
    if (!safeRelative(name)) {
      return { ok: false, output: "", error: { code: "invalid-file", message: "\u975E\u6CD5\u6587\u4EF6\u8DEF\u5F84" } };
    }
    const toplevel = await this.repoRoot(canonical);
    const absolute = resolvePath(canonical, name);
    if (!inside(canonical, absolute)) {
      return { ok: false, output: "", error: { code: "outside-workspace", message: "\u6587\u4EF6\u4F4D\u4E8E\u5DE5\u4F5C\u533A\u5916" } };
    }
    const tracked = relativePath(toplevel, absolute).split(sep).join("/");
    const run = await this.runner.run(["show", `HEAD:${tracked}`], toplevel);
    if (run.exitCode !== 0) {
      return { ok: false, output: "", error: { code: "show-failed", message: run.stderr.trim() || "git show HEAD failed" } };
    }
    return { ok: true, output: run.stdout };
  }
  /** 读取工作区文件的当前内容（UTF-8）；二进制与超限文件只回报元数据。 */
  async readFile(path, file) {
    const canonical = await this.requireWorkspace(path);
    const name = file.trim();
    if (!safeRelative(name)) {
      return { ok: false, text: "", bytes: 0, binary: false, truncated: false, error: { code: "invalid-file", message: "\u975E\u6CD5\u6587\u4EF6\u8DEF\u5F84" } };
    }
    const absolute = resolvePath(canonical, name);
    if (!inside(canonical, absolute)) {
      return { ok: false, text: "", bytes: 0, binary: false, truncated: false, error: { code: "outside-workspace", message: "\u6587\u4EF6\u4F4D\u4E8E\u5DE5\u4F5C\u533A\u5916" } };
    }
    try {
      const info = await stat(absolute);
      if (info.isDirectory()) {
        return { ok: false, text: "", bytes: 0, binary: false, truncated: false, error: { code: "not-a-file", message: "\u8FD9\u662F\u4E00\u4E2A\u76EE\u5F55" } };
      }
      const buffer = await readBytes(absolute);
      const binary = buffer.includes(0);
      const truncated = buffer.byteLength > DIFF_TEXT_CAP_BYTES;
      const slice = truncated ? buffer.subarray(0, DIFF_TEXT_CAP_BYTES) : buffer;
      return {
        ok: true,
        text: binary ? "" : slice.toString("utf8"),
        bytes: buffer.byteLength,
        binary,
        truncated
      };
    } catch (error) {
      if (error?.code === "ENOENT") {
        return { ok: true, text: "", bytes: 0, binary: false, truncated: false, missing: true };
      }
      return {
        ok: false,
        text: "",
        bytes: 0,
        binary: false,
        truncated: false,
        error: { code: "read-failed", message: error instanceof Error ? error.message : "\u8BFB\u53D6\u5931\u8D25" }
      };
    }
  }
  /** 保存文件内容（冲突解决或编辑回写）。 */
  async saveFile(path, file, content) {
    const canonical = await this.requireWorkspace(path);
    const name = file.trim();
    if (!safeRelative(name)) {
      return { ok: false, output: "", error: { code: "invalid-file", message: "\u975E\u6CD5\u6587\u4EF6\u8DEF\u5F84" } };
    }
    const absolute = resolvePath(canonical, name);
    if (!inside(canonical, absolute)) {
      return { ok: false, output: "", error: { code: "outside-workspace", message: "\u6587\u4EF6\u4F4D\u4E8E\u5DE5\u4F5C\u533A\u5916" } };
    }
    try {
      const { writeFile } = await import("node:fs/promises");
      await writeFile(absolute, content, "utf8");
      return { ok: true, output: "saved" };
    } catch (error) {
      return { ok: false, output: "", error: { code: "write-failed", message: error instanceof Error ? error.message : "\u5199\u5165\u5931\u8D25" } };
    }
  }
  /**
   * 变更文件清单：以工作区根为基准的相对路径（含未跟踪），供客户端做同步的
   * 「这个文件有没有 git 改动」门禁；同时回报仓库根，便于客户端展示。
   */
  async fileStatus(path) {
    const canonical = await this.requireWorkspace(path);
    const toplevel = await this.repoRoot(canonical);
    const run = await this.runner.run(["status", "--porcelain", "-z", "--untracked-files=all"], toplevel);
    if (run.exitCode !== 0) {
      return { ok: false, error: { code: "status-failed", message: run.stderr.trim() || "git status failed" } };
    }
    const entries = [];
    const chunks = run.stdout.split("\0");
    for (let index = 0; index < chunks.length; index += 1) {
      const entry = chunks[index];
      if (entry === void 0 || entry.length < 4) continue;
      const code = entry.slice(0, 2);
      const target = entry.slice(3);
      if (code.startsWith("R") || code.startsWith("C")) index += 1;
      const absolute = resolvePath(toplevel, target);
      const local = relativePath(canonical, absolute).split(sep).join("/");
      if (local === "" || local.startsWith("../") || local === "..") continue;
      entries.push({ path: local, code });
    }
    entries.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
    return {
      ok: true,
      value: { workspace: canonical, toplevel, entries }
    };
  }
  /** 仓库根：非 git 目录回退到工作区根本身。 */
  async repoRoot(canonical) {
    const run = await this.runner.run(["rev-parse", "--show-toplevel"], canonical);
    const root = run.exitCode === 0 ? run.stdout.trim() : "";
    return root === "" ? canonical : root;
  }
  /** 摘取一个提交到当前分支（git cherry-pick）。 */
  async cherryPick(path, sha) {
    const canonical = await this.requireWorkspace(path);
    const clean = sha.trim();
    if (clean === "") return { ok: false, output: "", error: { code: "empty-sha", message: "sha \u4E0D\u80FD\u4E3A\u7A7A" } };
    const run = await this.runner.run(["cherry-pick", clean], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: "cherry-pick-failed", message: run.stderr.trim() || "git cherry-pick failed" } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /** 撤销一个提交（git revert --no-edit）。 */
  async revertCommit(path, sha) {
    const canonical = await this.requireWorkspace(path);
    const clean = sha.trim();
    if (clean === "") return { ok: false, output: "", error: { code: "empty-sha", message: "sha \u4E0D\u80FD\u4E3A\u7A7A" } };
    const run = await this.runner.run(["revert", "--no-edit", clean], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: "revert-failed", message: run.stderr.trim() || "git revert failed" } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /** 一键同步（git pull --rebase + 有超前则 git push）。 */
  async sync(path) {
    const canonical = await this.requireWorkspace(path);
    const pullRun = await this.runner.run(["pull", "--rebase"], canonical);
    if (pullRun.exitCode !== 0) {
      return { ok: false, output: pullRun.stdout, error: { code: "sync-pull-failed", message: pullRun.stderr.trim() || "git pull --rebase failed" } };
    }
    const pushRun = await this.runner.run(["push"], canonical);
    if (pushRun.exitCode !== 0) {
      return { ok: false, output: pushRun.stdout, error: { code: "sync-push-failed", message: pushRun.stderr.trim() || "git push failed" } };
    }
    const out = [pullRun.stdout.trim(), pushRun.stdout.trim()].filter(Boolean).join("\n");
    return { ok: true, output: out || "Sync successful" };
  }
  /**
   * 提交已暂存的变更（git commit -m）。
   * 严格遵循暂存区隔离原则：只提交已暂存（staged）文件，不自动 add -A，
   * 未暂存（unstaged）文件一律保留在工作区。
   * 暂存区为空时返回 empty-stage 错误。
   */
  async commit(path, message) {
    const canonical = await this.requireWorkspace(path);
    const clean = message.trim();
    if (clean === "") {
      return { ok: false, output: "", error: { code: "empty-message", message: "commit message \u4E0D\u80FD\u4E3A\u7A7A" } };
    }
    const commitRun = await this.runner.run(["commit", "-m", clean], canonical);
    if (commitRun.exitCode !== 0) {
      const msg = commitRun.stderr.trim() || commitRun.stdout.trim() || "git commit failed";
      const isNothingStaged = msg.includes("nothing to commit") || msg.includes("no changes added to commit");
      return {
        ok: false,
        output: commitRun.stdout,
        error: {
          code: isNothingStaged ? "empty-stage" : "commit-failed",
          message: isNothingStaged ? "\u6682\u5B58\u533A\u4E3A\u7A7A\uFF0C\u6CA1\u6709\u8981\u63D0\u4EA4\u7684\u6539\u52A8" : msg
        }
      };
    }
    return { ok: true, output: commitRun.stdout.trim() };
  }
  /** 推送当前分支到上游（git push）。 */
  async push(path) {
    const canonical = await this.requireWorkspace(path);
    const run = await this.runner.run(["push"], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: "push-failed", message: run.stderr.trim() || "git push failed" } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /** 暂存列表（git stash list）。 */
  async stashList(path) {
    const canonical = await this.requireWorkspace(path);
    const run = await this.runner.run(["stash", "list"], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: "", error: { code: "stash-list-failed", message: run.stderr.trim() || "git stash list failed" } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /**
   * 抽屉（stash 栈）内容概览：条目数与其中涉及的文件总数。
   *
   * 两个必须注意的点，都是实测确认的：
   *
   * 1. `git stash list` 只给条目，不给文件。要知道「抽屉里有没有东西、多少个
   *    文件」必须对每条 `stash show --name-only`。
   * 2. `stash show --name-only` **默认不列出未跟踪文件**（因为 -u 产生的储藏把
   *    未跟踪部分放在第三个 parent 上），必须显式加 `-u`/`--include-untracked`，
   *    否则「储藏了 5 个文件」会被算成 2 个——数字直接骗人。
   */
  async stashSummary(path) {
    const canonical = await this.requireWorkspace(path);
    const list = await this.runner.run(["stash", "list", "--format=%gd"], canonical);
    if (list.exitCode !== 0) {
      return { ok: false, error: { code: "stash-list-failed", message: list.stderr.trim() || "git stash list failed" } };
    }
    const refs = list.stdout.split("\n").map((line) => line.trim()).filter((line) => line !== "");
    let files = 0;
    for (const ref of refs) {
      const show = await this.runner.run(["stash", "show", "--include-untracked", "--name-only", ref], canonical);
      if (show.exitCode !== 0) continue;
      files += show.stdout.split("\n").filter((line) => line.trim() !== "").length;
    }
    return { ok: true, entries: refs.length, files };
  }
  /**
   * 把当前变更收进抽屉（git stash push -u -m）。
   *
   * `-u`（--include-untracked）是必需的：裸 `git stash push` 会收走已暂存的改动
   * 与已跟踪文件的未暂存改动，**但绝不碰未跟踪文件**——于是新建的文件会留在工作区，
   * 用户看到「储藏」之后变更列表里还挂着一堆文件，以为没生效。实测：带 -u 之后
   * 已暂存 / 未暂存已跟踪 / 未跟踪三类一并收走，工作区回到干净状态。
   */
  async stashPush(path, message) {
    const canonical = await this.requireWorkspace(path);
    const argv = ["stash", "push", "-u"];
    if (message !== void 0 && message.trim() !== "") argv.push("-m", message.trim());
    const run = await this.runner.run(argv, canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: "stash-failed", message: run.stderr.trim() || "git stash push failed" } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /** 恢复最新暂存（git stash pop）。 */
  async stashPop(path) {
    const canonical = await this.requireWorkspace(path);
    const run = await this.runner.run(["stash", "pop"], canonical);
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: "stash-pop-failed", message: run.stderr.trim() || "git stash pop failed" } };
    }
    return { ok: true, output: run.stdout.trim() };
  }
  /** 用于图视图的提交 DAG（全部引用，按日期排序，有上限）。 */
  async graph(path) {
    const canonical = await this.requireWorkspace(path);
    const [repo, current, logRun, tipRun] = await Promise.all([
      this.repoName(canonical),
      this.currentBranch(canonical),
      this.runner.run(
        [
          "log",
          "--all",
          "--date-order",
          "--max-count=300",
          `--pretty=format:%H${FIELD}%P${FIELD}%an${FIELD}%ai${FIELD}%s${REC}`
        ],
        canonical
      ),
      this.runner.run(
        ["for-each-ref", `--format=%(refname:short)${FIELD}%(objectname)${REC}`, "refs/heads", "refs/remotes"],
        canonical
      )
    ]);
    const commits = [];
    const seen = /* @__PURE__ */ new Set();
    if (logRun.exitCode !== 0) {
      throw Object.assign(
        new Error(logRun.stderr.trim() || "not a git repository"),
        { gitError: { code: "not-a-repo", message: logRun.stderr.trim() || "not a git repository" } }
      );
    }
    for (const record of splitRecords(logRun.stdout)) {
      const [sha, parents, author, date, subject] = record.split(FIELD);
      if (!sha || seen.has(sha)) continue;
      seen.add(sha);
      commits.push({
        sha,
        parents: parents ? parents.split(" ") : [],
        author: sanitize(author ?? ""),
        date: sanitize(date ?? ""),
        subject: sanitize(subject ?? "").slice(0, 100)
      });
    }
    const tips = {};
    for (const record of splitRecords(tipRun.stdout)) {
      const [name, sha] = record.split(FIELD);
      if (name && sha) tips[name] = sha;
    }
    return { repo, current, commits, tips };
  }
};

// src/host/commit-message.ts
var DIFF_CAP_CHARS = 24e3;
var MESSAGE_CAP_CHARS = 2e3;
var TIMEOUT_MS = 6e4;
var SYSTEM = [
  "You write one git commit message for a staged change set.",
  "Match the repository: use the same language, the same prefix convention (e.g. feat/fix/docs/refactor) and the same tone as the recent commit subjects you are given.",
  "Describe what the change actually does, not that files were edited. Never invent work that the diff does not show.",
  "Return ONLY the commit message as plain text: no quotes, no Markdown code fences, no explanation, no trailing commentary.",
  "Use a single line unless the change genuinely needs a body; if it does, separate the subject from the body with one blank line."
].join("\n");
function cleanMessage(raw) {
  let text = raw.trim();
  const fence = /^```[^\n]*\n([\s\S]*?)\n?```$/.exec(text);
  if (fence !== null) text = fence[1].trim();
  text = text.replace(/^["'“”‘’`]+/u, "").replace(/["'“”‘’`]+$/u, "").trim();
  return text.slice(0, MESSAGE_CAP_CHARS).trim();
}
async function generateCommitMessage(ctx, service, root) {
  const llm = ctx.get("llm");
  if (llm === void 0 || typeof llm.stream !== "function") {
    return { ok: false, error: { code: "no-model", message: "LLM service is unavailable" } };
  }
  const selection = ctx.get("agentDefaultModel")?.currentSelection?.();
  const provider = typeof selection?.provider === "string" ? selection.provider : "";
  const model = typeof selection?.model === "string" ? selection.model : "";
  if (provider === "" || model === "") {
    return { ok: false, error: { code: "no-model", message: "no default model selection" } };
  }
  const staged = await service.stagedContext(root);
  if (!staged.ok) return { ok: false, error: staged.error };
  if (staged.diff.trim() === "") {
    return { ok: false, error: { code: "empty-stage", message: "nothing is staged" } };
  }
  const diff = staged.diff.length > DIFF_CAP_CHARS ? `${staged.diff.slice(0, DIFF_CAP_CHARS)}
... (diff truncated)` : staged.diff;
  const input = [
    staged.subjects.length > 0 ? `Recent commit subjects in this repository (imitate their language, prefix and tone):
${staged.subjects.map((subject) => `- ${subject}`).join("\n")}` : "This repository has no earlier commits to imitate.",
    "",
    "Staged changes (git diff --cached):",
    diff
  ].join("\n");
  let text = "";
  let failure = null;
  try {
    const stream = llm.stream({
      provider,
      model,
      system: SYSTEM,
      messages: [{
        id: "dsh-git-panel-commit-message",
        role: "user",
        content: [{ type: "text", text: input }],
        source: { kind: "user" }
      }],
      temperature: 0.2,
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    for await (const chunk of stream) {
      const part = chunk;
      if (part.type === "text-delta" && typeof part.text === "string") {
        text += part.text;
        continue;
      }
      if (part.type === "finish" && part.reason?.kind !== void 0 && part.reason.kind !== "stop") {
        failure = typeof part.reason.failure?.message === "string" ? part.reason.failure.message : String(part.reason.kind);
      }
    }
  } catch (error) {
    return {
      ok: false,
      error: { code: "generate-failed", message: error instanceof Error ? error.message : String(error) }
    };
  }
  if (failure !== null) return { ok: false, error: { code: "generate-failed", message: failure } };
  const message = cleanMessage(text);
  if (message === "") {
    return { ok: false, error: { code: "generate-failed", message: "the model returned an empty message" } };
  }
  return { ok: true, message };
}

// src/host/routes.ts
var BODY_CAP_BYTES = 1 << 20;
async function readJsonBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const part = chunk;
    total += part.length;
    if (total > BODY_CAP_BYTES) {
      req.destroy();
      return null;
    }
    chunks.push(part);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (text === "") return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
function json(res, envelope, status = 200) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(envelope));
}
function field(payload, key) {
  if (typeof payload !== "object" || payload === null) return null;
  const value = payload[key];
  return typeof value === "string" && value !== "" ? value : null;
}
var BAD_REQUEST = { code: "internal", message: "malformed request" };
function route(service, ctx) {
  return async (req, res) => {
    const url = new URL(req.url ?? "/", "http://dsh");
    const path = url.pathname;
    if (req.method !== "POST") {
      json(res, { ok: false, error: { code: "internal", message: "method not allowed" } }, 405);
      return;
    }
    const payload = await readJsonBody(req);
    const root = field(payload, "path");
    if (root === null) {
      json(res, { ok: false, error: BAD_REQUEST }, 400);
      return;
    }
    try {
      switch (path) {
        case "/git-panel/current": {
          const value = await service.current(root);
          json(res, { ok: true, value });
          return;
        }
        case "/git-panel/branches": {
          const value = await service.branches(root);
          json(res, { ok: true, value });
          return;
        }
        case "/git-panel/graph": {
          const value = await service.graph(root);
          json(res, { ok: true, value });
          return;
        }
        case "/git-panel/switch": {
          const branch = field(payload, "branch");
          if (branch === null) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          const value = await service.switchBranch(root, branch);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/pull": {
          const value = await service.pull(root);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/fetch": {
          const value = await service.fetchAll(root);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/rename": {
          const branch = field(payload, "branch");
          const newName = field(payload, "newName");
          if (branch === null || newName === null) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          const value = await service.renameBranch(root, branch, newName);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/delete": {
          const branch = field(payload, "branch");
          if (branch === null) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          const value = await service.deleteBranch(root, branch);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/delete-remote": {
          const branch = field(payload, "branch");
          if (branch === null) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          const value = await service.deleteRemoteBranch(root, branch);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/merge": {
          const branch = field(payload, "branch");
          if (branch === null) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          const value = await service.mergeBranch(root, branch);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/status": {
          const value = await service.status(root);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/commit": {
          const message = field(payload, "message");
          if (message === null) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          const value = await service.commit(root, message);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/generate-commit-message": {
          const value = await generateCommitMessage(ctx, service, root);
          json(res, value.ok ? { ok: true, value: { message: value.message } } : { ok: false, error: value.error });
          return;
        }
        case "/git-panel/push": {
          const value = await service.push(root);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/sync": {
          const value = await service.sync(root);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/stash-list": {
          const value = await service.stashList(root);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/stash-summary": {
          const value = await service.stashSummary(root);
          json(res, value.ok ? { ok: true, value: { entries: value.entries, files: value.files } } : { ok: false, error: value.error });
          return;
        }
        case "/git-panel/stash-push": {
          const message = field(payload, "message");
          const value = await service.stashPush(root, message ?? void 0);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/stash-pop": {
          const value = await service.stashPop(root);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/diff": {
          const file = field(payload, "file");
          if (file === null) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          const value = await service.diffFile(root, file);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/show-head": {
          const file = field(payload, "file");
          if (file === null) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          const value = await service.showHead(root, file);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/save-file": {
          const file = field(payload, "file");
          const content = typeof payload?.content === "string" ? payload.content : null;
          if (file === null || content === null) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          const value = await service.saveFile(root, file, content);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/read-file": {
          const file = field(payload, "file");
          if (file === null) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          const value = await service.readFile(root, file);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/cancel": {
          service.runner?.cancel?.();
          json(res, { ok: true, value: { cancelled: true } });
          return;
        }
        case "/git-panel/set-credential": {
          const host = field(payload, "host");
          const username = field(payload, "username");
          const password = field(payload, "password");
          if (!host || !username || !password) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          try {
            const { homedir: homedir2 } = await import("node:os");
            const { join: join2 } = await import("node:path");
            const { readFileSync: readFileSync2, writeFileSync, existsSync: existsSync2 } = await import("node:fs");
            const credPath = join2(homedir2(), ".git-credentials");
            const encodedUser = encodeURIComponent(username);
            const encodedPass = encodeURIComponent(password);
            let currentContent = existsSync2(credPath) ? readFileSync2(credPath, "utf8") : "";
            const lines = currentContent.split("\n").filter((l) => l.includes(`@${host}`) === false);
            lines.push(`https://${encodedUser}:${encodedPass}@${host}`);
            writeFileSync(credPath, lines.join("\n").trim() + "\n", { encoding: "utf8", mode: 384 });
            await service.runner.run(["config", "--global", `credential.https://${host}.provider`, "generic"], root);
            await service.runner.run(["config", "--global", `credential.https://${host}.modalPrompt`, "false"], root);
            await service.runner.run(["config", "--global", "--replace-all", `credential.https://${host}.helper`, "store"], root);
            json(res, { ok: true, value: "\u51ED\u636E\u5DF2\u5B89\u5168\u7ED1\u5B9A\u81F3\u5F53\u524D\u4ED3\u5E93\uFF01" });
          } catch (e) {
            json(res, { ok: false, error: { code: "credential-failed", message: e?.message || "\u4FDD\u5B58\u51ED\u636E\u5931\u8D25" } });
          }
          return;
        }
        case "/git-panel/file-status": {
          const value = await service.fileStatus(root);
          json(res, value.ok ? { ok: true, value: value.value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/stage": {
          const file = field(payload, "file");
          if (file === null) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          const value = await service.stageFile(root, file);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/unstage": {
          const file = field(payload, "file");
          if (file === null) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          const value = await service.unstageFile(root, file);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/discard": {
          const file = field(payload, "file");
          const untracked = payload.untracked === true;
          if (file === null) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          const value = await service.discardFile(root, file, untracked);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/cherry-pick": {
          const sha = field(payload, "sha");
          if (sha === null) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          const value = await service.cherryPick(root, sha);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        case "/git-panel/revert": {
          const sha = field(payload, "sha");
          if (sha === null) {
            json(res, { ok: false, error: BAD_REQUEST }, 400);
            return;
          }
          const value = await service.revertCommit(root, sha);
          json(res, value.ok ? { ok: true, value } : { ok: false, error: value.error ?? BAD_REQUEST });
          return;
        }
        default:
          json(res, { ok: false, error: { code: "internal", message: `unknown route ${path}` } }, 404);
      }
    } catch (error) {
      const gitError = error.gitError ?? { code: "internal", message: String(error instanceof Error ? error.message : error) };
      json(res, { ok: false, error: gitError });
    }
  };
}
function registerGitPanelRoutes(ctx, service) {
  return ctx.webServer.register({ kind: "prefix", path: "/git-panel", handler: route(service, ctx) });
}

// src/index.ts
var inject = ["webServer", "subprocess", "workspaceRegistry"];
function createWorkspaceGate(ctx) {
  return async (path) => {
    let canonical;
    try {
      canonical = await realpath2(path);
    } catch {
      return { ok: false, error: { code: "workspace-unknown", message: "path does not resolve on disk" } };
    }
    if (ctx.workspaceRegistry.list().some((workspace) => workspace.path === canonical)) {
      return { ok: true, canonical };
    }
    return { ok: false, error: { code: "workspace-unknown", message: "path is not a registered workspace" } };
  };
}
function apply(ctx) {
  const service = new GitService(subprocessRunner(ctx), createWorkspaceGate(ctx));
  ctx.effect(() => registerGitPanelRoutes(ctx, service), "dsh-git-panel: /git-panel routes");
}
var index_default = { apply, inject };
export {
  apply,
  index_default as default,
  inject
};
//# sourceMappingURL=index.js.map
