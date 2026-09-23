window.__ModuleLoader__.load({
  id: "dsh-git-panel",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  default: () => index_default,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react6 = require("react");

// src/client/api.ts
async function post(path, payload) {
  let response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    return { ok: false, error: { code: "internal", message: "git route unavailable" } };
  }
  try {
    return await response.json();
  } catch {
    return { ok: false, error: { code: "internal", message: `bad response (HTTP ${response.status})` } };
  }
}
var GitPanelApi = class {
  /** 轻量接口：仅获取当前分支（用于 chip 标签）。 */
  current(path) {
    return post("/git-panel/current", { path });
  }
  branches(path) {
    return post("/git-panel/branches", { path });
  }
  graph(path) {
    return post("/git-panel/graph", { path });
  }
  switchBranch(path, branch) {
    return post("/git-panel/switch", { path, branch });
  }
  /** 中止当前在飞的 git 进程。 */
  cancel(path) {
    return post("/git-panel/cancel", { path });
  }
  pull(path) {
    return post("/git-panel/pull", { path });
  }
  fetchAll(path) {
    return post("/git-panel/fetch", { path });
  }
  renameBranch(path, branch, newName) {
    return post("/git-panel/rename", { path, branch, newName });
  }
  deleteBranch(path, branch) {
    return post("/git-panel/delete", { path, branch });
  }
  deleteRemoteBranch(path, branch) {
    return post("/git-panel/delete-remote", { path, branch });
  }
  mergeBranch(path, branch) {
    return post("/git-panel/merge", { path, branch });
  }
  status(path) {
    return post("/git-panel/status", { path });
  }
  diffFile(path, file) {
    return post("/git-panel/diff", { path, file });
  }
  showHead(path, file) {
    return post("/git-panel/show-head", { path, file });
  }
  saveFile(path, file, content) {
    return post("/git-panel/save-file", { path, file, content });
  }
  /** 工作区变更清单（含 porcelain 状态码），文件树装饰与路由门禁共用。 */
  fileStatus(path) {
    return post("/git-panel/file-status", { path });
  }
  /** 读取工作区文件当前内容。 */
  readFile(path, file) {
    return post("/git-panel/read-file", { path, file });
  }
  stageFile(path, file) {
    return post("/git-panel/stage", { path, file });
  }
  unstageFile(path, file) {
    return post("/git-panel/unstage", { path, file });
  }
  discardFile(path, file, untracked) {
    return post("/git-panel/discard", { path, file, untracked });
  }
  cherryPick(path, sha) {
    return post("/git-panel/cherry-pick", { path, sha });
  }
  revertCommit(path, sha) {
    return post("/git-panel/revert", { path, sha });
  }
  commit(path, message) {
    return post("/git-panel/commit", { path, message });
  }
  /** 读取暂存区内容，由当前默认模型生成一条提交信息。 */
  generateCommitMessage(path) {
    return post("/git-panel/generate-commit-message", { path });
  }
  push(path) {
    return post("/git-panel/push", { path });
  }
  sync(path) {
    return post("/git-panel/sync", { path });
  }
  setCredential(path, host, username, password) {
    return post("/git-panel/set-credential", { path, host, username, password });
  }
  stashList(path) {
    return post("/git-panel/stash-list", { path });
  }
  /** 抽屉概览：条目数与其中的文件总数。 */
  stashSummary(path) {
    return post("/git-panel/stash-summary", { path });
  }
  stashPush(path, message) {
    return post("/git-panel/stash-push", { path, message: message ?? "" });
  }
  stashPop(path) {
    return post("/git-panel/stash-pop", { path });
  }
};

// src/client/i18n.ts
var import_react = require("react");
var DICTS = {
  zh: {
    "guide.gitDescription": "\u7BA1\u7406\u5206\u652F\u4E0E\u63D0\u4EA4\uFF0C\u5904\u7406\u4EE3\u7801\u51B2\u7A81",
    "panel.cancelOp": "\u53D6\u6D88\u5F53\u524D\u64CD\u4F5C",
    "diff.tagNew": "\u65B0\u589E",
    "diff.fontSizeGroup": "\u5B57\u53F7",
    "diff.stage": "\u6682\u5B58",
    "diff.processing": "\u5904\u7406\u4E2D",
    "diff.save": "\u4FDD\u5B58",
    "diff.synced": "\u5DF2\u540C\u6B65",
    "diff.empty": "\uFF08\u7A7A\uFF09",
    "tab.gitTitle": "Git \u7248\u672C\u63A7\u5236\u4E0E\u63D0\u4EA4\u56FE\u8C31",
    "diff.loadFailed": "\u8BFB\u53D6\u5931\u8D25",
    "diff.saved": "\u5DF2\u4FDD\u5B58\u5230\u5DE5\u4F5C\u533A",
    "diff.saveFailed": "\u4FDD\u5B58\u5931\u8D25",
    "diff.staged": "\u5DF2\u6682\u5B58\uFF08git add\uFF09",
    "diff.stageFailed": "\u6682\u5B58\u5931\u8D25",
    "diff.openFailed": "\u65E0\u6CD5\u6253\u5F00\u6E90\u7801\u89C6\u56FE",
    "diff.gitStatus": "git \u72B6\u6001\uFF1A{status}",
    "diff.notInHead": "HEAD \u4E2D\u4E0D\u5B58\u5728\u8FD9\u4E2A\u6587\u4EF6",
    "diff.linesAdded": "{count} \u884C\u65B0\u589E",
    "diff.linesRemoved": "{count} \u884C\u5220\u9664",
    "diff.viewSwitch": "\u89C6\u56FE\u5207\u6362",
    "diff.split": "\u53CC\u680F\u5BF9\u6BD4",
    "diff.unified": "\u5355\u680F\u5BF9\u6BD4",
    "diff.edit": "\u7F16\u8F91\u6587\u4EF6\u5185\u5BB9",
    "diff.resolveConflicts": "\u5904\u7406\u5408\u5E76\u51B2\u7A81\uFF08{count} \u5757\uFF09",
    "diff.displayOptions": "\u663E\u793A\u9009\u9879",
    "diff.wrap": "\u81EA\u52A8\u6362\u884C",
    "diff.fold": "\u6298\u53E0\u672A\u6539\u52A8\u533A\u57DF",
    "diff.fontSmaller": "\u7F29\u5C0F\u5B57\u53F7",
    "diff.fontCurrent": "\u5F53\u524D\u5B57\u53F7 {size}px",
    "diff.fontLarger": "\u653E\u5927\u5B57\u53F7",
    "diff.openOfficial": "\u7528\u5B98\u65B9\u6587\u672C\u9884\u89C8\u6253\u5F00\u8FD9\u4E2A\u6587\u4EF6\uFF08\u4EE3\u7801 / \u7EAF\u6587\u672C / Markdown \u7B49\u5B98\u65B9\u6E32\u67D3\u5668\uFF09",
    "diff.officialPreview": "\u5B98\u65B9\u9884\u89C8",
    "diff.stageFile": "\u6682\u5B58\u8BE5\u6587\u4EF6\uFF08git add\uFF09",
    "diff.saveToWorkspace": "\u4FDD\u5B58\u6539\u52A8\u5230\u5DE5\u4F5C\u533A",
    "diff.inSync": "\u5DE5\u4F5C\u533A\u5185\u5BB9\u4E0E\u89C6\u56FE\u4E00\u81F4",
    "diff.binary": "\u4E8C\u8FDB\u5236\u6587\u4EF6\uFF0C\u65E0\u6CD5\u663E\u793A\u6587\u672C\u5DEE\u5F02",
    "diff.missing": "\u5DE5\u4F5C\u533A\u4E2D\u5DF2\u4E0D\u5B58\u5728\u8BE5\u6587\u4EF6\uFF08\u53EF\u80FD\u5DF2\u5220\u9664\uFF09",
    "diff.newFile": "\u8FD9\u662F\u65B0\u589E\u6587\u4EF6\uFF1A\u5DE6\u680F\u4E3A\u7A7A\uFF0C\u5168\u90E8\u5185\u5BB9\u4E3A\u65B0\u589E",
    "diff.loading": "\u6B63\u5728\u8BFB\u53D6 git \u6570\u636E\u2026",
    "diff.expandBlock": "\u5C55\u5F00\u8FD9\u6BB5\u672A\u6539\u52A8\u7684\u4EE3\u7801",
    "diff.expandLines": "\u22EF \u5C55\u5F00 {count} \u884C\u672A\u6539\u52A8",
    "diff.allResolved": "\u672C\u6587\u4EF6\u6240\u6709\u51B2\u7A81\u5DF2\u5168\u90E8\u89E3\u51B3\uFF01\u8BF7\u70B9\u51FB\u53F3\u4E0A\u89D2\u300C\u4FDD\u5B58\u300D\u5199\u56DE\u6587\u4EF6\u3002",
    "diff.conflictHint": "\u63D0\u793A\uFF1A\u51B2\u7A81\u6838\u5FC3\u4E0E\u7D27\u90BB\u4EE3\u7801\u5DF2\u76F4\u63A5\u7F6E\u4E8E\u9996\u5C4F\uFF01\u9010\u5757\u70B9\u51FB\u6309\u94AE\u5408\u5E76\u51B2\u7A81\uFF0C\u5904\u7406\u5B8C\u70B9\u51FB\u53F3\u4E0A\u89D2\u300C\u4FDD\u5B58\u300D\u5199\u56DE\u78C1\u76D8\u3002",
    "diff.viewHistory": "\u70B9\u51FB\u67E5\u770B\u5B8C\u6574\u5386\u53F2\u4EE3\u7801",
    "diff.foldedAbove": "\u5DF2\u6298\u53E0\u4E0A\u65B9\u7B2C {from}\u2013{to} \u884C\u672A\u51B2\u7A81\u4EE3\u7801 ({count} \u884C)",
    "diff.conflictHeader": "\u51B2\u7A81 {index} / {total} \xB7 \u884C {from}\u2013{to}",
    "diff.tookOurs": "\u5DF2\u91C7\u7528\u5F53\u524D\u66F4\u6539 (\u884C {line})",
    "diff.takeOurs": "\u91C7\u7528\u5F53\u524D\u66F4\u6539 (HEAD)",
    "diff.tookTheirs": "\u5DF2\u91C7\u7528\u4F20\u5165\u66F4\u6539 ({label})",
    "diff.takeTheirs": "\u91C7\u7528\u4F20\u5165\u66F4\u6539 ({label})",
    "diff.tookBoth": "\u5DF2\u4FDD\u7559\u53CC\u65B9\u66F4\u6539",
    "diff.takeBoth": "\u4E24\u8005\u90FD\u4FDD\u7559",
    "diff.oursLabel": "HEAD / \u5F53\u524D\u5206\u652F:",
    "diff.theirsLabel": "\u4F20\u5165 / {label}:",
    "diff.expandRest": "\u70B9\u51FB\u5C55\u5F00\u5269\u4F59\u4EE3\u7801",
    "diff.foldedBelow": "\u5DF2\u6298\u53E0\u4E0B\u65B9\u7B2C {from}\u2013{to} \u884C\u672A\u51B2\u7A81\u4EE3\u7801 ({count} \u884C)",
    "auth.title": "\u5728\u6B64\u539F\u4F4D\u914D\u7F6E Git \u8BBF\u95EE\u51ED\u636E\uFF08\u514D\u7EC8\u7AEF\u914D\u7F6E\uFF0C\u81EA\u52A8\u4FDD\u5B58\uFF09\uFF1A",
    "auth.saveAndRetry": "\u8BB0\u4F4F\u51ED\u636E\u5E76\u7ACB\u5373\u91CD\u8BD5",
    "panel.pullingNow": "\u6B63\u5728\u62C9\u53D6\u66F4\u65B0\u4E2D...",
    "panel.behindHint": "\u843D\u540E\u4E0A\u6E38 {count} \u4E2A\u63D0\u4EA4\uFF0C\u70B9\u51FB\u7ACB\u5373\u62C9\u53D6\u66F4\u65B0 (git pull)",
    "panel.needCredential": "\u7F3A\u5C11 GitLab \u8BBF\u95EE\u51ED\u636E\u6216\u8BA4\u8BC1\u5931\u8D25\uFF0C\u8BF7\u5728\u4E0B\u65B9\u76F4\u63A5\u8F93\u5165\u8D26\u53F7\u5BC6\u7801\u5373\u53EF\u4E00\u952E\u4FDD\u5B58\uFF1A",
    "panel.running": "\u6B63\u5728\u6267\u884C {label}...",
    "panel.opFailed": "\u64CD\u4F5C\u5931\u8D25",
    "panel.timeout": "\u64CD\u4F5C\u8D85\u65F6\uFF1A\u7F51\u7EDC\u8FDE\u63A5\u5931\u8D25\u6216\u8FDC\u7A0B\u670D\u52A1\u5668\u65E0\u54CD\u5E94\u3002",
    "prompt.stagedFile": "\u8BF7\u5E2E\u6211\u5206\u6790\u5DF2\u6682\u5B58\u6587\u4EF6\uFF1A`{file}`",
    "changes.openFullDiff": "\u70B9\u51FB\u5728\u53F3\u4FA7\u680F\u6253\u5F00\u5B8C\u6574 Git \u5BF9\u6BD4\uFF08VS Code \u98CE\u683C\uFF09",
    "changes.inlineDiff": "\u5185\u5D4C\u67E5\u770B diff",
    "prompt.fileChange": "\u8BF7\u5E2E\u6211\u5206\u6790\u5E76\u5904\u7406\u8BE5\u6587\u4EF6\u7684\u6539\u52A8\uFF1A`{file}`",
    "prompt.reviewDiff": "\u8BF7\u5E2E\u6211 Review \u6587\u4EF6 `{file}` \u7684\u4EE5\u4E0B Diff \u6539\u52A8\uFF1A\n```diff\n{diff}\n```",
    "panel.cancelled": "\u5DF2\u53D6\u6D88\u5F53\u524D\u64CD\u4F5C\u7B49\u5F85",
    "auth.usernamePlaceholder": "\u7528\u6237\u540D\uFF08\u6216\u90AE\u7BB1\u524D\u7F00\uFF0C\u5982 jaden.tang\uFF09",
    "auth.passwordPlaceholder": "\u5BC6\u7801\u6216 GitLab Personal Access Token",
    "auth.fillBoth": "\u8BF7\u586B\u5199\u7528\u6237\u540D\u548C\u5BC6\u7801/Token",
    "auth.saving": "\u6B63\u5728\u4FDD\u5B58\u51ED\u636E\u5E76\u81EA\u52A8\u914D\u7F6E...",
    "auth.saved": "\u51ED\u636E\u5DF2\u6210\u529F\u4FDD\u5B58\uFF01\u6B63\u5728\u81EA\u52A8\u4E3A\u60A8\u91CD\u8BD5\u62C9\u53D6/\u540C\u6B65...",
    "auth.saveFailed": "\u4FDD\u5B58\u5931\u8D25: {reason}",
    "menu.busySyncing": "\u6B63\u5728\u540C\u6B65\u4E2D...",
    "menu.pull": "\u62C9\u53D6\u66F4\u65B0 (Pull)",
    "menu.fetchAll": "\u6293\u53D6\u5168\u90E8 (Fetch all)",
    "panel.title": "Git \u9762\u677F",
    "panel.empty": "\u6253\u5F00\u9879\u76EE\u4F1A\u8BDD\u540E\u663E\u793A Git \u9762\u677F",
    "tab.branches": "\u5206\u652F",
    "tab.graph": "\u56FE\u8C31",
    "loading": "\u52A0\u8F7D\u4E2D\u2026",
    "section.local": "\u672C\u5730\u5206\u652F",
    "section.remote": "\u8FDC\u7A0B\u5206\u652F",
    "empty.local": "\u65E0\u672C\u5730\u5206\u652F",
    "empty.remote": "\u65E0\u8FDC\u7A0B\u5206\u652F",
    "branches.search": "\u641C\u7D22\u5206\u652F\u6216\u63D0\u4EA4\u2026",
    "badge.current": "\u5F53\u524D",
    "fetch.all": "\u5168\u90E8\u6293\u53D6",
    "op.pull": "\u62C9\u53D6",
    "op.switch": "\u5207\u6362",
    "op.checkout": "\u68C0\u51FA",
    "op.rename": "\u91CD\u547D\u540D",
    "op.delete": "\u5220\u9664",
    "op.deleteRemote": "\u5220\u9664\u8FDC\u7A0B\u5206\u652F",
    "op.merge": "\u5408\u5E76 {branch}",
    "op.done": "{label}\u5B8C\u6210",
    "write.commit": "\u63D0\u4EA4",
    "write.commit.placeholder": "\u63D0\u4EA4\u4FE1\u606F\u2026",
    "write.commit.generate": "\u81EA\u52A8\u751F\u6210\u63D0\u4EA4\u4FE1\u606F",
    "write.commit.generating": "\u6B63\u5728\u6839\u636E\u6682\u5B58\u533A\u53D8\u66F4\u751F\u6210\u63D0\u4EA4\u4FE1\u606F\u2026",
    "write.commit.generated": "\u5DF2\u751F\u6210\u63D0\u4EA4\u4FE1\u606F\uFF0C\u8BF7\u786E\u8BA4\u540E\u63D0\u4EA4",
    "write.commit.emptyStage": "\u6682\u5B58\u533A\u4E3A\u7A7A\uFF1A\u8BF7\u5148\u6682\u5B58\u8981\u63D0\u4EA4\u7684\u6539\u52A8\uFF0C\u518D\u81EA\u52A8\u751F\u6210\u63D0\u4EA4\u4FE1\u606F\u3002",
    "write.commit.emptyStageNotice": "\u6682\u5B58\u533A\u4E3A\u7A7A\uFF0C\u65E0\u6CD5\u63D0\u4EA4\uFF1A\u8BF7\u5148\u6682\u5B58\u8981\u63D0\u4EA4\u7684\u6587\u4EF6\u3002",
    "write.commit.failed": "\u751F\u6210\u63D0\u4EA4\u4FE1\u606F\u5931\u8D25\uFF1A{reason}",
    "write.commit.noModel": "\u6CA1\u6709\u53EF\u7528\u7684\u9ED8\u8BA4\u6A21\u578B\uFF0C\u65E0\u6CD5\u751F\u6210\u63D0\u4EA4\u4FE1\u606F\u3002\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u9009\u62E9\u9ED8\u8BA4\u6A21\u578B\u3002",
    "write.push": "\u63A8\u9001",
    "write.sync": "\u540C\u6B65",
    "write.stash": "\u50A8\u85CF\u6539\u52A8",
    "write.stashPop": "\u6062\u590D\u50A8\u85CF",
    "write.stash.tip": "\u628A\u5F53\u524D\u6240\u6709\u672A\u63D0\u4EA4\u7684\u6539\u52A8\uFF08\u542B\u65B0\u5EFA\u7684\u672A\u8DDF\u8E2A\u6587\u4EF6\uFF09\u4E00\u5E76\u6536\u8FDB\u50A8\u85CF\u533A\uFF08git stash push -u\uFF09\uFF0C\u5DE5\u4F5C\u533A\u56DE\u5230\u5E72\u51C0\u72B6\u6001\u3002\u8FD9\u4E0E\u300C\u6682\u5B58\u300D\uFF08git add\uFF09\u4E0D\u662F\u4E00\u56DE\u4E8B\u3002",
    "write.stashPop.tip": "\u628A\u50A8\u85CF\u533A\u91CC\u6700\u8FD1\u4E00\u4EFD\u6539\u52A8\u5012\u56DE\u5DE5\u4F5C\u533A\uFF08git stash pop\uFF09\u3002\u6062\u590D\u540E\u8BE5\u4EFD\u50A8\u85CF\u5373\u88AB\u79FB\u9664\u3002",
    "write.stash.drawer": "\u5DF2\u50A8\u85CF {count} \u4E2A\u6587\u4EF6",
    "write.stash.drawerEntries": "\u5DF2\u50A8\u85CF {count} \u4E2A\u6587\u4EF6\uFF08{entries} \u4EFD\u50A8\u85CF\uFF09",
    "write.status": "\u72B6\u6001",
    "write.status.tip": "\u91CD\u65B0\u8BFB\u53D6 git status \u4E0E\u50A8\u85CF\u533A\u5E76\u5237\u65B0\u663E\u793A\uFF08\u4E0D\u5F71\u54CD\u5DE5\u4F5C\u533A\u5185\u5BB9\uFF09",
    "op.ok": "\u64CD\u4F5C\u6210\u529F",
    "op.refresh": "\u5237\u65B0",
    "op.cherryPick": "\u6458\u53D6\u5230\u6B64\u5206\u652F",
    "op.revert": "\u64A4\u9500\u6B64\u63D0\u4EA4",
    "changes.title": "\u53D8\u66F4\u6587\u4EF6",
    "changes.staged": "\u5DF2\u6682\u5B58\u7684\u66F4\u6539",
    "changes.unstaged": "\u66F4\u6539",
    "changes.stage": "\u6682\u5B58\u66F4\u6539",
    "changes.unstage": "\u53D6\u6D88\u6682\u5B58",
    "changes.stageAll": "\u5168\u90E8\u6682\u5B58",
    "changes.unstageAll": "\u53D6\u6D88\u5168\u90E8\u6682\u5B58",
    "changes.stageAllDone": "\u5DF2\u6682\u5B58 {count} \u4E2A\u6587\u4EF6",
    "changes.unstageAllDone": "\u5DF2\u53D6\u6D88\u6682\u5B58 {count} \u4E2A\u6587\u4EF6",
    "changes.batchFailed": "\u5DF2\u5B8C\u6210 {count} \u4E2A\u6587\u4EF6\u540E\u5931\u8D25\uFF1A{reason}",
    "changes.mark.untracked": "\u672A\u8DDF\u8E2A\uFF08\u65B0\u6587\u4EF6\uFF0C\u5C1A\u672A\u7EB3\u5165 git\uFF0C\u4E0D\u6682\u5B58\u5C31\u4E0D\u4F1A\u8FDB\u63D0\u4EA4\uFF09",
    "changes.mark.modified": "\u5DF2\u4FEE\u6539",
    "changes.mark.added": "\u65B0\u589E\uFF08\u5DF2\u6682\u5B58\uFF09",
    "changes.mark.deleted": "\u5DF2\u5220\u9664",
    "changes.mark.renamed": "\u5DF2\u91CD\u547D\u540D",
    "changes.mark.conflict": "\u51B2\u7A81",
    "changes.discard": "\u653E\u5F03\u66F4\u6539",
    "changes.discardConfirm": "\u786E\u8BA4\u653E\u5F03\u5BF9 {file} \u7684\u6240\u6709\u672A\u6682\u5B58\u66F4\u6539\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u9006\uFF01",
    "changes.conflicts": "\u5B58\u5728 {count} \u4E2A\u51B2\u7A81\u6587\u4EF6\uFF0C\u8BF7\u5148\u89E3\u51B3\u51B2\u7A81",
    "changes.conflictsGroup": "\u51B2\u7A81\u6587\u4EF6 (\u9700\u89E3\u51B3)",
    "changes.diff": "\u5DEE\u5F02",
    "changes.empty": "\uFF08\u65E0\u5DEE\u5F02\uFF09",
    "changes.copyPath": "\u590D\u5236\u6587\u4EF6\u76F8\u5BF9\u8DEF\u5F84",
    "changes.copyPathDone": "\u5DF2\u590D\u5236\u6587\u4EF6\u8DEF\u5F84",
    "changes.fileToChat": "\u5411 Agent \u63D0\u95EE\u6B64\u6587\u4EF6",
    "changes.sendToChat": "\u5C06\u6539\u52A8\u5E26\u5165\u5BF9\u8BDD\u8F93\u5165\u6846",
    "changes.sendConflictsToChat": "\u5C06\u51B2\u7A81\u5206\u6790\u5E26\u5165\u5BF9\u8BDD",
    "prompt.conflicts": "\u26A0\uFE0F \u5F53\u524D Git \u5DE5\u4F5C\u533A\u5408\u5E76\u65F6\u68C0\u6D4B\u5230\u4EE5\u4E0B {count} \u4E2A\u4EE3\u7801\u51B2\u7A81\u6587\u4EF6\uFF1A\n{conflictList}\n\n\u53E6\u5916\u8FD8\u6709 {otherCount} \u4E2A\u5DF2\u6682\u5B58/\u672A\u6682\u5B58\u7684\u66F4\u6539\u6587\u4EF6\u3002\n\u8BF7\u5E2E\u6211\u6DF1\u5165\u5206\u6790\u4E0A\u8FF0\u51B2\u7A81\u6587\u4EF6\u7684\u51B2\u7A81\u539F\u56E0\uFF0C\u5E76\u6307\u5BFC\u6211\u5982\u4F55\u6B63\u786E\u4FDD\u7559\u5F53\u524D\u5206\u652F\u6216\u5408\u5E76\u4F20\u5165\u5206\u652F\u7684\u4EE3\u7801\u4EE5\u5B89\u5168\u89E3\u51B3\u51B2\u7A81\u3002",
    "prompt.normal": "\u5F53\u524D Git \u5DE5\u4F5C\u533A\u6709\u4EE5\u4E0B {count} \u5904\u53D8\u66F4\uFF1A\n{fileList}\n\n\u8BF7\u5E2E\u6211\u68C0\u67E5\u8FD9\u4E9B\u66F4\u6539\u5E76\u6839\u636E\u89C4\u8303\u751F\u6210\u6E05\u6670\u7684 Git Commit Message\u3002",
    "op.running": "\u6B63\u5728{label}\u2026",
    "op.pulling": "\u6B63\u5728\u62C9\u53D6\u66F4\u65B0\u2026",
    "op.fetching": "\u6B63\u5728\u6293\u53D6\u8FDC\u7A0B\u2026",
    "op.pushing": "\u6B63\u5728\u63A8\u9001\u2026",
    "op.syncing": "\u6B63\u5728\u540C\u6B65\u2026",
    "changes.diffToChat": "\u5C06 Diff \u5E26\u5165\u5BF9\u8BDD\u8F93\u5165\u6846",
    "changes.sentSuccess": "\u5DF2\u586B\u5165\u8F93\u5165\u6846",
    "op.failed": "\u64CD\u4F5C\u5931\u8D25",
    "menu.copyName": "\u590D\u5236\u5206\u652F\u540D",
    "menu.copyName.done": "\u5DF2\u590D\u5236\u5206\u652F\u540D",
    "menu.rename": "\u91CD\u547D\u540D\u2026",
    "menu.delete": "\u5220\u9664",
    "menu.deleteRemote": "\u5220\u9664\u8FDC\u7A0B\u5206\u652F",
    "menu.merge": "\u5408\u5E76\u81F3\u5F53\u524D\u5206\u652F",
    "menu.push": "\u63A8\u9001 (Push)",
    "menu.sync": "\u540C\u6B65 (Pull --rebase + Push)",
    "menu.confirm": "\u786E\u8BA4",
    "menu.cancel": "\u53D6\u6D88",
    "menu.title.rename": "\u91CD\u547D\u540D\u5206\u652F {name}",
    "menu.title.delete": "\u786E\u8BA4\u5220\u9664\u5206\u652F {name}\uFF1F",
    "menu.title.deleteRemote": "\u786E\u8BA4\u5220\u9664\u8FDC\u7A0B\u5206\u652F {name}\uFF1F",
    "error.invalidName": "\u975E\u6CD5\u5206\u652F\u540D\uFF1A{name}",
    "row.title.switch": "\u53CC\u51FB\u5207\u6362\u5230\u6B64\u5206\u652F",
    "row.title.pull": "\u53CC\u51FB\u62C9\u53D6\u5F53\u524D\u5206\u652F",
    "row.title.checkout": "\u53CC\u51FB\u68C0\u51FA\u6B64\u8FDC\u7A0B\u5206\u652F",
    "graph.col.lanes": "\u7EBF\u56FE",
    "graph.col.commit": "\u63D0\u4EA4",
    "graph.col.branch": "\u5206\u652F",
    "graph.col.resize": "\u8C03\u6574\u63D0\u4EA4\u5217\u5BBD \xB7 \u53CC\u51FB\u8FD8\u539F",
    "chip.title": "\u5207\u6362\u5206\u652F",
    "chip.head": "\u672C\u5730\u5206\u652F",
    "aria.loading": "\u52A0\u8F7D\u4E2D"
  },
  en: {
    "guide.gitDescription": "Manage branches, commits and conflicts",
    "panel.cancelOp": "Cancel the current operation",
    "diff.tagNew": "New",
    "diff.fontSizeGroup": "Font size",
    "diff.stage": "Stage",
    "diff.processing": "Processing",
    "diff.save": "Save",
    "diff.synced": "In sync",
    "diff.empty": "(empty)",
    "tab.gitTitle": "Git version control and commit graph",
    "diff.loadFailed": "Failed to load",
    "diff.saved": "Saved to workspace",
    "diff.saveFailed": "Save failed",
    "diff.staged": "Staged (git add)",
    "diff.stageFailed": "Staging failed",
    "diff.openFailed": "Could not open the source view",
    "diff.gitStatus": "git status: {status}",
    "diff.notInHead": "This file does not exist in HEAD",
    "diff.linesAdded": "{count} line(s) added",
    "diff.linesRemoved": "{count} line(s) removed",
    "diff.viewSwitch": "Switch view",
    "diff.split": "Side-by-side diff",
    "diff.unified": "Unified diff",
    "diff.edit": "Edit file content",
    "diff.resolveConflicts": "Resolve merge conflicts ({count} block(s))",
    "diff.displayOptions": "Display options",
    "diff.wrap": "Word wrap",
    "diff.fold": "Collapse unchanged regions",
    "diff.fontSmaller": "Decrease font size",
    "diff.fontCurrent": "Current font size {size}px",
    "diff.fontLarger": "Increase font size",
    "diff.openOfficial": "Open this file in the official text preview (code / plain text / Markdown renderers)",
    "diff.officialPreview": "Official preview",
    "diff.stageFile": "Stage this file (git add)",
    "diff.saveToWorkspace": "Save changes to the workspace",
    "diff.inSync": "Workspace matches the view",
    "diff.binary": "Binary file \u2014 text diff is not available",
    "diff.missing": "This file no longer exists in the workspace (possibly deleted)",
    "diff.newFile": "New file: the left pane is empty and everything is an addition",
    "diff.loading": "Reading git data\u2026",
    "diff.expandBlock": "Expand this unchanged code",
    "diff.expandLines": "\u22EF Expand {count} unchanged line(s)",
    "diff.allResolved": 'All conflicts in this file are resolved! Click "Save" in the top-right to write them back.',
    "diff.conflictHint": 'Tip: conflict cores and their adjacent code are shown first. Resolve each block with the buttons, then click "Save" in the top-right to write back.',
    "diff.viewHistory": "Click to view the full historical code",
    "diff.foldedAbove": "{count} unchanged line(s) above are collapsed (lines {from}\u2013{to})",
    "diff.conflictHeader": "Conflict {index} / {total} \xB7 lines {from}\u2013{to}",
    "diff.tookOurs": "Accepted current change (line {line})",
    "diff.takeOurs": "Accept current change (HEAD)",
    "diff.tookTheirs": "Accepted incoming change ({label})",
    "diff.takeTheirs": "Accept incoming change ({label})",
    "diff.tookBoth": "Kept both changes",
    "diff.takeBoth": "Keep both",
    "diff.oursLabel": "HEAD / current branch:",
    "diff.theirsLabel": "Incoming / {label}:",
    "diff.expandRest": "Click to expand the remaining code",
    "diff.foldedBelow": "{count} unchanged line(s) below are collapsed (lines {from}\u2013{to})",
    "auth.title": "Configure Git credentials in place (no terminal needed, saved automatically):",
    "auth.saveAndRetry": "Remember and retry now",
    "panel.pullingNow": "Pulling updates...",
    "panel.behindHint": "{count} commit(s) behind upstream \u2014 click to pull now (git pull)",
    "panel.needCredential": "Missing GitLab credentials or authentication failed. Enter your account and password below to save them in one click:",
    "panel.running": "Running {label}...",
    "panel.opFailed": "Operation failed",
    "panel.timeout": "Operation timed out: network failure or the remote server is not responding.",
    "prompt.stagedFile": "Please analyze the staged file: `{file}`",
    "changes.openFullDiff": "Click to open the full Git diff in the right sidebar (VS Code style)",
    "changes.inlineDiff": "View inline diff",
    "prompt.fileChange": "Please analyze and handle the changes in this file: `{file}`",
    "prompt.reviewDiff": "Please review the following diff for `{file}`:\n```diff\n{diff}\n```",
    "panel.cancelled": "Cancelled waiting for the current operation",
    "auth.usernamePlaceholder": "Username (or email prefix, e.g. jaden.tang)",
    "auth.passwordPlaceholder": "Password or GitLab Personal Access Token",
    "auth.fillBoth": "Please fill in both username and password/token",
    "auth.saving": "Saving credentials and configuring...",
    "auth.saved": "Credentials saved! Retrying pull/sync automatically...",
    "auth.saveFailed": "Save failed: {reason}",
    "menu.busySyncing": "Syncing...",
    "menu.pull": "Pull updates",
    "menu.fetchAll": "Fetch all",
    "panel.title": "Git Panel",
    "panel.empty": "Open a project session to see the Git panel",
    "tab.branches": "Branches",
    "tab.graph": "Graph",
    "loading": "Loading\u2026",
    "section.local": "Local branches",
    "section.remote": "Remote branches",
    "empty.local": "No local branches",
    "empty.remote": "No remote branches",
    "branches.search": "Search branches or commits\u2026",
    "badge.current": "current",
    "fetch.all": "Fetch all",
    "op.pull": "Pull",
    "op.switch": "Switch",
    "op.checkout": "Checkout",
    "op.rename": "Rename",
    "op.delete": "Delete",
    "op.deleteRemote": "Delete remote branch",
    "op.merge": "Merge {branch}",
    "op.done": "{label} done",
    "write.commit": "Commit",
    "write.commit.placeholder": "Commit message\u2026",
    "write.commit.generate": "Generate commit message",
    "write.commit.generating": "Generating a commit message from the staged changes\u2026",
    "write.commit.generated": "Commit message generated \u2014 review it before committing",
    "write.commit.emptyStage": "Nothing is staged: stage the changes you want to commit, then generate.",
    "write.commit.emptyStageNotice": "Nothing is staged to commit: please stage the files you want to commit first.",
    "write.commit.failed": "Failed to generate a commit message: {reason}",
    "write.commit.noModel": "No default model is available, so a commit message cannot be generated. Pick one in settings.",
    "write.push": "Push",
    "write.sync": "Sync",
    "write.stash": "Stash changes",
    "write.stashPop": "Restore stash",
    "write.stash.tip": "Park every uncommitted change, including new untracked files, in the stash (git stash push -u), leaving a clean working tree. This is NOT the same as staging (git add).",
    "write.stashPop.tip": "Bring the most recent stash back into the working tree (git stash pop). That stash entry is removed once restored.",
    "write.stash.drawer": "{count} file(s) in the stash",
    "write.stash.drawerEntries": "{count} file(s) in the stash ({entries} entries)",
    "write.status": "Status",
    "write.status.tip": "Re-read git status and the stash, then refresh the display (does not touch the working tree)",
    "op.ok": "Done",
    "op.refresh": "Refresh",
    "op.cherryPick": "Cherry-pick here",
    "op.revert": "Revert",
    "changes.title": "Changes",
    "changes.staged": "Staged Changes",
    "changes.unstaged": "Changes",
    "changes.stage": "Stage Changes",
    "changes.unstage": "Unstage Changes",
    "changes.stageAll": "Stage all changes",
    "changes.unstageAll": "Unstage all changes",
    "changes.stageAllDone": "Staged {count} file(s)",
    "changes.unstageAllDone": "Unstaged {count} file(s)",
    "changes.batchFailed": "Failed after {count} file(s): {reason}",
    "changes.mark.untracked": "Untracked (new file, not yet in git \u2014 will not be committed unless staged)",
    "changes.mark.modified": "Modified",
    "changes.mark.added": "Added (staged)",
    "changes.mark.deleted": "Deleted",
    "changes.mark.renamed": "Renamed",
    "changes.mark.conflict": "Conflict",
    "changes.discard": "Discard Changes",
    "changes.discardConfirm": "Are you sure you want to discard changes in {file}? This cannot be undone!",
    "changes.conflicts": "{count} conflicting file(s) detected, please resolve conflicts",
    "changes.conflictsGroup": "Conflicting Files",
    "changes.diff": "Diff",
    "changes.empty": "(no diff)",
    "changes.copyPath": "Copy relative path",
    "changes.copyPathDone": "Path copied",
    "changes.fileToChat": "Ask Agent about this file",
    "changes.sendToChat": "Send changes to chat input",
    "changes.sendConflictsToChat": "Send conflict analysis to chat",
    "prompt.conflicts": "\u26A0\uFE0F Git merge conflicts detected in the following {count} file(s):\n{conflictList}\n\nAdditionally, there are {otherCount} other changed file(s).\nPlease analyze the root causes of these conflicts and guide me on how to safely resolve them (e.g. accepting current vs incoming changes).",
    "prompt.normal": "The current Git workspace has the following {count} change(s):\n{fileList}\n\nPlease inspect these changes and generate a clear, conventional Git Commit Message according to best practices.",
    "op.running": "{label} in progress\u2026",
    "op.pulling": "Pulling updates\u2026",
    "op.fetching": "Fetching remotes\u2026",
    "op.pushing": "Pushing\u2026",
    "op.syncing": "Syncing\u2026",
    "changes.diffToChat": "Send diff to chat input",
    "changes.sentSuccess": "Added to input",
    "op.failed": "Failed",
    "menu.copyName": "Copy branch name",
    "menu.copyName.done": "Branch name copied",
    "menu.rename": "Rename\u2026",
    "menu.delete": "Delete",
    "menu.deleteRemote": "Delete remote branch",
    "menu.merge": "Merge into current branch",
    "menu.push": "Push",
    "menu.sync": "Sync (pull --rebase + push)",
    "menu.confirm": "Confirm",
    "menu.cancel": "Cancel",
    "menu.title.rename": "Rename branch {name}",
    "menu.title.delete": "Delete branch {name}?",
    "menu.title.deleteRemote": "Delete remote branch {name}?",
    "error.invalidName": "Invalid branch name: {name}",
    "row.title.switch": "Double-click to switch",
    "row.title.pull": "Double-click to pull",
    "row.title.checkout": "Double-click to check out",
    "graph.col.lanes": "Lanes",
    "graph.col.commit": "Commit",
    "graph.col.branch": "Branch",
    "graph.col.resize": "Drag to resize \xB7 double-click to reset",
    "chip.title": "Switch branch",
    "chip.head": "Local branches",
    "aria.loading": "Loading"
  },
  es: {
    "guide.gitDescription": "Gestiona ramas, commits y conflictos",
    "panel.cancelOp": "Cancelar la operaci\xF3n actual",
    "diff.tagNew": "Nuevo",
    "diff.fontSizeGroup": "Tama\xF1o de fuente",
    "diff.stage": "Preparar",
    "diff.processing": "Procesando",
    "diff.save": "Guardar",
    "diff.synced": "Sincronizado",
    "diff.empty": "(vac\xEDo)",
    "tab.gitTitle": "Control de versiones Git y grafo de commits",
    "diff.loadFailed": "Error al cargar",
    "diff.saved": "Guardado en el espacio de trabajo",
    "diff.saveFailed": "Error al guardar",
    "diff.staged": "Preparado (git add)",
    "diff.stageFailed": "Error al preparar",
    "diff.openFailed": "No se pudo abrir la vista de c\xF3digo",
    "diff.gitStatus": "estado de git: {status}",
    "diff.notInHead": "Este archivo no existe en HEAD",
    "diff.linesAdded": "{count} l\xEDnea(s) a\xF1adida(s)",
    "diff.linesRemoved": "{count} l\xEDnea(s) eliminada(s)",
    "diff.viewSwitch": "Cambiar vista",
    "diff.split": "Diff en dos columnas",
    "diff.unified": "Diff unificado",
    "diff.edit": "Editar el contenido",
    "diff.resolveConflicts": "Resolver conflictos ({count} bloque(s))",
    "diff.displayOptions": "Opciones de visualizaci\xF3n",
    "diff.wrap": "Ajuste de l\xEDnea",
    "diff.fold": "Contraer zonas sin cambios",
    "diff.fontSmaller": "Reducir el tama\xF1o de fuente",
    "diff.fontCurrent": "Tama\xF1o actual {size}px",
    "diff.fontLarger": "Aumentar el tama\xF1o de fuente",
    "diff.openOfficial": "Abrir este archivo en la vista previa oficial (c\xF3digo / texto plano / Markdown)",
    "diff.officialPreview": "Vista previa oficial",
    "diff.stageFile": "Preparar este archivo (git add)",
    "diff.saveToWorkspace": "Guardar los cambios en el espacio de trabajo",
    "diff.inSync": "El espacio de trabajo coincide con la vista",
    "diff.binary": "Archivo binario: no se puede mostrar el diff de texto",
    "diff.missing": "Este archivo ya no existe en el espacio de trabajo (quiz\xE1 eliminado)",
    "diff.newFile": "Archivo nuevo: el panel izquierdo est\xE1 vac\xEDo y todo son adiciones",
    "diff.loading": "Leyendo datos de git\u2026",
    "diff.expandBlock": "Expandir este c\xF3digo sin cambios",
    "diff.expandLines": "\u22EF Expandir {count} l\xEDnea(s) sin cambios",
    "diff.allResolved": '\xA1Todos los conflictos de este archivo est\xE1n resueltos! Pulsa "Guardar" arriba a la derecha para escribirlos.',
    "diff.conflictHint": 'Consejo: los n\xFAcleos de conflicto y su c\xF3digo adyacente se muestran primero. Resuelve cada bloque con los botones y pulsa "Guardar" arriba a la derecha.',
    "diff.viewHistory": "Clic para ver el c\xF3digo hist\xF3rico completo",
    "diff.foldedAbove": "{count} l\xEDnea(s) sin conflictos arriba est\xE1n contra\xEDdas ({from}\u2013{to})",
    "diff.conflictHeader": "Conflicto {index} / {total} \xB7 l\xEDneas {from}\u2013{to}",
    "diff.tookOurs": "Cambio actual aceptado (l\xEDnea {line})",
    "diff.takeOurs": "Aceptar el cambio actual (HEAD)",
    "diff.tookTheirs": "Cambio entrante aceptado ({label})",
    "diff.takeTheirs": "Aceptar el cambio entrante ({label})",
    "diff.tookBoth": "Se conservaron ambos cambios",
    "diff.takeBoth": "Conservar ambos",
    "diff.oursLabel": "HEAD / rama actual:",
    "diff.theirsLabel": "Entrante / {label}:",
    "diff.expandRest": "Clic para expandir el c\xF3digo restante",
    "diff.foldedBelow": "{count} l\xEDnea(s) sin conflictos abajo est\xE1n contra\xEDdas ({from}\u2013{to})",
    "auth.title": "Configura las credenciales de Git aqu\xED (sin terminal, se guardan autom\xE1ticamente):",
    "auth.saveAndRetry": "Recordar y reintentar ahora",
    "panel.pullingNow": "Extrayendo actualizaciones...",
    "panel.behindHint": "{count} confirmaci\xF3n(es) por detr\xE1s del remoto \u2014 clic para extraer (git pull)",
    "panel.needCredential": "Faltan credenciales de GitLab o la autenticaci\xF3n fall\xF3. Introduce tu cuenta y contrase\xF1a abajo para guardarlas con un clic:",
    "panel.running": "Ejecutando {label}...",
    "panel.opFailed": "La operaci\xF3n fall\xF3",
    "panel.timeout": "La operaci\xF3n agot\xF3 el tiempo: fallo de red o el servidor remoto no responde.",
    "prompt.stagedFile": "Analiza el archivo preparado (staged): `{file}`",
    "changes.openFullDiff": "Clic para abrir el diff completo de Git en la barra lateral (estilo VS Code)",
    "changes.inlineDiff": "Ver diff integrado",
    "prompt.fileChange": "Analiza y gestiona los cambios de este archivo: `{file}`",
    "prompt.reviewDiff": "Revisa el siguiente diff de `{file}`:\n```diff\n{diff}\n```",
    "panel.cancelled": "Se cancel\xF3 la espera de la operaci\xF3n actual",
    "auth.usernamePlaceholder": "Usuario (o prefijo de correo, p. ej. jaden.tang)",
    "auth.passwordPlaceholder": "Contrase\xF1a o GitLab Personal Access Token",
    "auth.fillBoth": "Rellena el usuario y la contrase\xF1a/token",
    "auth.saving": "Guardando credenciales y configurando...",
    "auth.saved": "\xA1Credenciales guardadas! Reintentando pull/sync autom\xE1ticamente...",
    "auth.saveFailed": "Error al guardar: {reason}",
    "menu.busySyncing": "Sincronizando...",
    "menu.pull": "Extraer actualizaciones (Pull)",
    "menu.fetchAll": "Obtener todo (Fetch all)",
    "panel.title": "Panel de Git",
    "panel.empty": "Abre una sesi\xF3n de proyecto para ver el panel de Git",
    "tab.branches": "Ramas",
    "tab.graph": "Gr\xE1fico",
    "loading": "Cargando\u2026",
    "section.local": "Ramas locales",
    "section.remote": "Ramas remotas",
    "empty.local": "No hay ramas locales",
    "empty.remote": "No hay ramas remotas",
    "branches.search": "Buscar ramas o commits\u2026",
    "badge.current": "actual",
    "fetch.all": "Obtener todo",
    "op.pull": "Traer cambios",
    "op.switch": "Cambiar",
    "op.checkout": "Cambiar a",
    "op.rename": "Renombrar",
    "op.delete": "Eliminar",
    "op.deleteRemote": "Eliminar rama remota",
    "op.merge": "Fusionar {branch}",
    "op.done": "{label} completado",
    "write.commit": "Confirmar",
    "write.commit.placeholder": "Mensaje de commit\u2026",
    "write.commit.generate": "Generar mensaje de commit",
    "write.commit.generating": "Generando el mensaje a partir de los cambios preparados\u2026",
    "write.commit.generated": "Mensaje generado: rev\xEDsalo antes de confirmar",
    "write.commit.emptyStage": "No hay nada preparado: prepara los cambios que quieras confirmar y vuelve a generar.",
    "write.commit.emptyStageNotice": "No hay nada preparado para confirmar: prepara primero los archivos que quieras confirmar.",
    "write.commit.failed": "No se pudo generar el mensaje de commit: {reason}",
    "write.commit.noModel": "No hay un modelo predeterminado disponible, as\xED que no se puede generar el mensaje. Elige uno en ajustes.",
    "write.push": "Empujar",
    "write.sync": "Sincronizar",
    "write.stash": "Guardar cambios",
    "write.stashPop": "Restaurar guardado",
    "write.stash.tip": "Guarda todos los cambios sin confirmar, incluidos los archivos nuevos sin seguimiento, en el stash (git stash push -u) y deja el \xE1rbol de trabajo limpio. NO es lo mismo que preparar (git add).",
    "write.stashPop.tip": "Devuelve al \xE1rbol de trabajo el guardado m\xE1s reciente (git stash pop). Esa entrada se elimina al restaurarla.",
    "write.stash.drawer": "{count} archivo(s) en el guardado",
    "write.stash.drawerEntries": "{count} archivo(s) en el guardado ({entries} entradas)",
    "write.status": "Estado",
    "write.status.tip": "Vuelve a leer git status y el guardado, y actualiza la pantalla (no toca el \xE1rbol de trabajo)",
    "op.ok": "Hecho",
    "op.refresh": "Actualizar",
    "op.cherryPick": "Cherry-pick aqu\xED",
    "op.revert": "Revertir",
    "changes.title": "Cambios",
    "changes.staged": "Cambios preparados",
    "changes.unstaged": "Cambios",
    "changes.stage": "Preparar cambios",
    "changes.unstage": "Despreparar cambios",
    "changes.stageAll": "Preparar todo",
    "changes.unstageAll": "Despreparar todo",
    "changes.stageAllDone": "{count} archivo(s) preparado(s)",
    "changes.unstageAllDone": "{count} archivo(s) despreparado(s)",
    "changes.batchFailed": "Fall\xF3 tras {count} archivo(s): {reason}",
    "changes.mark.untracked": "Sin seguimiento (archivo nuevo, a\xFAn no en git \u2014 no se confirma si no se prepara)",
    "changes.mark.modified": "Modificado",
    "changes.mark.added": "A\xF1adido (preparado)",
    "changes.mark.deleted": "Eliminado",
    "changes.mark.renamed": "Renombrado",
    "changes.mark.conflict": "Conflicto",
    "changes.discard": "Descartar cambios",
    "changes.discardConfirm": "\xBFSeguro que desea descartar los cambios en {file}? \xA1No se puede deshacer!",
    "changes.conflicts": "{count} archivo(s) en conflicto detectado(s)",
    "changes.conflictsGroup": "Archivos en conflicto",
    "changes.diff": "Diff",
    "changes.empty": "(sin diff)",
    "changes.copyPath": "Copiar ruta relativa",
    "changes.copyPathDone": "Ruta copiada",
    "changes.fileToChat": "Preguntar al Agente sobre este archivo",
    "changes.sendToChat": "Enviar cambios al chat",
    "changes.sendConflictsToChat": "Enviar an\xE1lisis de conflictos al chat",
    "prompt.conflicts": "\u26A0\uFE0F Se detectaron conflictos de fusi\xF3n de Git en los siguientes {count} archivo(s):\n{conflictList}\n\nAdem\xE1s, hay otros {otherCount} archivo(s) modificados.\nPor favor, analiza la causa de estos conflictos y ori\xE9ntame sobre c\xF3mo resolverlos de forma segura (conservando cambios entrantes o locales).",
    "prompt.normal": "El espacio de trabajo Git actual tiene los siguientes {count} cambio(s):\n{fileList}\n\nPor favor, revisa estos cambios y genera un mensaje de confirmaci\xF3n (Commit Message) claro y convencional.",
    "op.running": "{label} en curso\u2026",
    "op.pulling": "Extrayendo actualizaciones\u2026",
    "op.fetching": "Obteniendo remotos\u2026",
    "op.pushing": "Empujando\u2026",
    "op.syncing": "Sincronizando\u2026",
    "changes.diffToChat": "Enviar diff al chat",
    "changes.sentSuccess": "A\xF1adido al campo de texto",
    "op.failed": "Fall\xF3",
    "menu.copyName": "Copiar nombre de rama",
    "menu.copyName.done": "Nombre de rama copiado",
    "menu.rename": "Renombrar\u2026",
    "menu.delete": "Eliminar",
    "menu.deleteRemote": "Eliminar rama remota",
    "menu.merge": "Fusionar en la rama actual",
    "menu.push": "Empujar (Push)",
    "menu.sync": "Sincronizar (pull --rebase + push)",
    "menu.confirm": "Confirmar",
    "menu.cancel": "Cancelar",
    "menu.title.rename": "Renombrar rama {name}",
    "menu.title.delete": "\xBFEliminar la rama {name}?",
    "menu.title.deleteRemote": "\xBFEliminar la rama remota {name}?",
    "error.invalidName": "Nombre de rama no v\xE1lido: {name}",
    "row.title.switch": "Doble clic para cambiar",
    "row.title.pull": "Doble clic para traer cambios",
    "row.title.checkout": "Doble clic para cambiar a esta rama",
    "graph.col.lanes": "Carriles",
    "graph.col.commit": "Commit",
    "graph.col.branch": "Rama",
    "graph.col.resize": "Arrastrar para ajustar \xB7 doble clic para restablecer",
    "chip.title": "Cambiar rama",
    "chip.head": "Ramas locales",
    "aria.loading": "Cargando"
  }
};
var locale = null;
var lang = "zh";
var revision = 0;
var listeners = /* @__PURE__ */ new Set();
function notify() {
  revision += 1;
  for (const fn of listeners) fn();
}
function detectLang() {
  const active = locale?.getLocale().active;
  if (active === "zh") return "zh";
  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("es")) return "es";
  if (active === "en") return "en";
  if (nav.startsWith("zh")) return "zh";
  return "zh";
}
function initI18n(service) {
  if (locale === service) return;
  locale = service;
  lang = detectLang();
  service.subscribe(() => {
    const next = detectLang();
    if (next !== lang) {
      lang = next;
      notify();
    }
  });
}
var subscribe = (fn) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
var getSnapshot = () => revision;
var HOST_ERRORS = {
  "invalid-file": { zh: "\u975E\u6CD5\u6587\u4EF6\u8DEF\u5F84", en: "Invalid file path", es: "Ruta de archivo no v\xE1lida" },
  "outside-workspace": { zh: "\u6587\u4EF6\u4F4D\u4E8E\u5DE5\u4F5C\u533A\u5916", en: "File is outside the workspace", es: "El archivo est\xE1 fuera del espacio de trabajo" },
  "not-a-file": { zh: "\u8FD9\u662F\u4E00\u4E2A\u76EE\u5F55", en: "This is a directory", es: "Esto es un directorio" },
  "read-failed": { zh: "\u8BFB\u53D6\u6587\u4EF6\u5931\u8D25", en: "Failed to read the file", es: "Error al leer el archivo" },
  "write-failed": { zh: "\u5199\u5165\u6587\u4EF6\u5931\u8D25", en: "Failed to write the file", es: "Error al escribir el archivo" },
  "empty-sha": { zh: "sha \u4E0D\u80FD\u4E3A\u7A7A", en: "sha must not be empty", es: "sha no puede estar vac\xEDo" },
  "empty-message": { zh: "commit message \u4E0D\u80FD\u4E3A\u7A7A", en: "commit message must not be empty", es: "El mensaje de commit no puede estar vac\xEDo" },
  "empty-stage": { zh: "\u6682\u5B58\u533A\u4E3A\u7A7A\uFF0C\u6CA1\u6709\u8981\u63D0\u4EA4\u7684\u6539\u52A8", en: "Nothing is staged to commit", es: "No hay nada preparado para confirmar" },
  "credential-failed": { zh: "\u4FDD\u5B58\u51ED\u636E\u5931\u8D25", en: "Failed to save credentials", es: "Error al guardar las credenciales" },
  "not-a-repo": { zh: "\u5F53\u524D\u76EE\u5F55\u4E0D\u662F Git \u4ED3\u5E93", en: "The current directory is not a Git repository", es: "El directorio actual no es un repositorio Git" },
  "bad-branch": { zh: "\u975E\u6CD5\u5206\u652F\u540D", en: "Invalid branch name", es: "Nombre de rama no v\xE1lido" },
  "status-failed": { zh: "\u8BFB\u53D6\u5DE5\u4F5C\u533A\u72B6\u6001\u5931\u8D25", en: "Failed to read the working tree status", es: "Error al leer el estado del \xE1rbol de trabajo" },
  "internal": { zh: "\u5185\u90E8\u9519\u8BEF", en: "Internal error", es: "Error interno" },
  "timeout": { zh: "\u64CD\u4F5C\u8D85\u65F6\uFF08\u8D85\u8FC7 90 \u79D2\uFF09\uFF1A\u7F51\u7EDC\u7F13\u6162\u6216\u8FDC\u7A0B\u670D\u52A1\u5668\u65E0\u54CD\u5E94\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u6216\u68C0\u67E5\u4EE3\u7406\u3002", en: "Operation timed out (over 90s): slow network or unresponsive remote. Retry later or check your proxy.", es: "La operaci\xF3n agot\xF3 el tiempo (m\xE1s de 90 s): red lenta o remoto sin respuesta. Reintenta o revisa el proxy." }
};
var TIMEOUT_TOKEN = "E_TIMEOUT";
function tError(code, fallback) {
  if (code !== void 0 && HOST_ERRORS[code] !== void 0) return HOST_ERRORS[code][lang];
  if (fallback.includes(TIMEOUT_TOKEN) || fallback.includes("\u8D85\u65F6") || fallback.includes("timed out")) {
    return HOST_ERRORS.timeout[lang];
  }
  return fallback;
}
function t(key, params) {
  const text = DICTS[lang][key] ?? DICTS.zh[key] ?? key;
  if (params === void 0) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);
}
function useT() {
  (0, import_react.useSyncExternalStore)(subscribe, getSnapshot);
  return t;
}

// src/client/GitTab.tsx
var import_react4 = require("react");

// src/client/Panel.tsx
var import_react3 = require("react");

// src/client/batch-stage.ts
async function runBatch(files, apply2) {
  let done = 0;
  for (const file of files) {
    const result = await apply2(file);
    if (!result.ok) return { done, failure: result.error };
    done += 1;
  }
  return { done, failure: null };
}

// src/client/git-status.ts
var TTL_MS = 3e3;
function statusLetter(code) {
  if (code === "??") return "U";
  if (code === "!!") return "U";
  const index = code[0] ?? " ";
  const work = code[1] ?? " ";
  const pair = `${index}${work}`;
  if (pair === "DD" || pair === "AU" || pair === "UD" || pair === "UA" || pair === "DU" || pair === "AA" || pair === "UU") return "C";
  if (index === "D" || work === "D") return "D";
  if (index === "R" || work === "R") return "R";
  if (index === "A" || work === "A" || index === "C" || work === "C") return "A";
  return "M";
}
var STATUS_COLORS = {
  M: "#e2c08d",
  A: "#73c991",
  U: "#73c991",
  D: "#c74e39",
  R: "#e2c08d",
  C: "#e06c75",
  /** 目录聚合标记：只表示「下面有改动」，因此用中性灰。 */
  "\u2022": "#9198a1"
};
var GitStatusCache = class {
  constructor(api) {
    this.api = api;
  }
  snapshots = /* @__PURE__ */ new Map();
  inflight = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  /** 每次内容变化递增，装饰层用它判断是否需要重绘。 */
  generation = 0;
  /** 内容版本号：快照变化即递增。 */
  get version() {
    return this.generation;
  }
  /**
   * 观察清单变化。
   * @param listener - 同步失效回调。
   * @returns 退订函数。
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  /**
   * 同步读取一个文件的状态字母。
   * @param root - 工作区根（会话 cwd）。
   * @param relative - 工作区相对路径。
   * @returns 状态字母；无缓存或该文件无改动时返回 undefined。
   */
  letterOf(root, relative) {
    const snapshot = this.snapshots.get(root);
    if (snapshot === void 0) return void 0;
    const code = snapshot.codes.get(relative);
    return code === void 0 ? void 0 : statusLetter(code);
  }
  /**
   * 同步判断一个文件此刻是否被认为有 git 改动，供路由门禁使用。
   * @param root - 工作区根（会话 cwd）。
   * @param relative - 工作区相对路径。
   * @returns 有改动为 true；没有缓存时保守地返回 false。
   */
  isChanged(root, relative) {
    return this.letterOf(root, relative) !== void 0;
  }
  /**
   * 读取一个工作区的快照（可能为空）。
   * @param root - 工作区根。
   * @returns 最近一次成功拉取的视图。
   */
  viewOf(root) {
    return this.snapshots.get(root)?.view;
  }
  /**
   * 已经建立过快照的工作区根。
   * @returns 根路径列表。
   */
  roots() {
    return [...this.snapshots.keys()];
  }
  /**
   * 确保某个工作区的清单是新鲜的。
   * @param root - 工作区根（会话 cwd）。
   * @param fresh - 忽略 TTL，强制重新拉取。
   * @returns 拉取完成（成功或失败都静默）后的 promise。
   */
  async ensure(root, fresh = false) {
    if (root === "") return;
    const held = this.snapshots.get(root);
    if (!fresh && held !== void 0 && Date.now() - held.at < TTL_MS) return;
    const running = this.inflight.get(root);
    if (running !== void 0) return running;
    const task = this.pull(root).finally(() => {
      this.inflight.delete(root);
    });
    this.inflight.set(root, task);
    return task;
  }
  /** 发一次请求并替换快照。 */
  async pull(root) {
    let envelope;
    try {
      envelope = await this.api.fileStatus(root);
    } catch {
      return;
    }
    if (!envelope.ok) return;
    const view = envelope.value;
    const codes = /* @__PURE__ */ new Map();
    for (const entry of view.entries) codes.set(entry.path, entry.code);
    const changed = this.differs(this.snapshots.get(root), view, codes);
    this.snapshots.set(root, { view, at: Date.now(), codes });
    if (changed) {
      this.generation += 1;
      for (const listener of [...this.listeners]) {
        try {
          listener();
        } catch (error) {
          console.warn("dsh-git-panel: status listener failed", error);
        }
      }
    }
  }
  /** 快照是否与旧值不同（决定要不要通知）。 */
  differs(previous, view, codes) {
    if (previous === void 0) return true;
    if (previous.view.entries.length !== view.entries.length) return true;
    if (previous.codes.size !== codes.size) return true;
    for (const [path, code] of codes) if (previous.codes.get(path) !== code) return true;
    return false;
  }
};

// src/client/change-groups.ts
function changeBadgeOf(code) {
  return statusLetter(code);
}
function classifyChanges(changes) {
  const conflicts = changes.filter((c) => statusLetter(c.code) === "C");
  return {
    // X 位非空格且非 `?`：index 里有改动（`M ` / `A ` / `D ` / `R ` …）。
    staged: changes.filter((c) => c.code[0] !== " " && c.code[0] !== "?" && !conflicts.includes(c)),
    // Y 位有改动，或未跟踪（`??`）。注意 ` M` 的 X 位是空格，必须靠 Y 位识别。
    unstaged: changes.filter((c) => (c.code[1] !== " " || c.code === "??") && !conflicts.includes(c)),
    conflicts
  };
}

// src/client/graph.ts
function layoutGraph(commits) {
  const order = commits.map((commit, index) => ({ commit, index })).reverse();
  const lanes = [];
  const placed = /* @__PURE__ */ new Map();
  for (const { commit, index } of order) {
    const row = index;
    let lane = lanes.findIndex((owner) => owner !== null && commit.parents.includes(owner));
    if (lane === -1) {
      lane = lanes.findIndex((owner) => owner === null);
      if (lane === -1) {
        lanes.push(null);
        lane = lanes.length - 1;
      }
    }
    const layout = { ...commit, row, lane };
    placed.set(commit.sha, layout);
    lanes[lane] = commit.sha;
  }
  return commits.map((commit) => placed.get(commit.sha));
}

// src/client/icons.tsx
var import_react2 = require("react");
var SHAPES = {
  refresh: [
    { d: "M13.2 8a5.2 5.2 0 1 1-1.5-3.7" },
    { d: "M13.4 2.6v2.9h-2.9" }
  ],
  file: [
    { d: "M4.2 1.8h4.3L12 5.3v8.9H4.2z" },
    { d: "M8.4 1.8v3.6H12" }
  ],
  split: [
    { rect: { x: 2.2, y: 3.2, width: 11.6, height: 9.6, rx: 1.4 } },
    { d: "M8 3.2v9.6" }
  ],
  unified: [{ d: "M3 4.6h10M3 8h10M3 11.4h5.5" }],
  edit: [
    { d: "M10.9 2.4l2.7 2.7-7.2 7.2H3.7v-2.7z" },
    { d: "M9.6 3.7l2.7 2.7" }
  ],
  conflict: [
    { d: "M8 2.4l5.7 10.2H2.3z" },
    { d: "M8 6.4v3.1M8 11.4h.01" }
  ],
  wrap: [
    { d: "M3 4.4h10M3 11.6h4M3 8h7.2a2 2 0 010 4H8.4" },
    { d: "M9.6 10.4L8.2 12l1.4 1.6" }
  ],
  fold: [{ d: "M4.4 6.2L8 2.9l3.6 3.3M4.4 9.8L8 13.1l3.6-3.3" }],
  code: [{ d: "M5.9 4.2L2.4 8l3.5 3.8M10.1 4.2L13.6 8l-3.5 3.8" }],
  plus: [{ d: "M8 3.2v9.6M3.2 8h9.6" }],
  minus: [{ d: "M3.4 8h9.2" }],
  save: [{ d: "M8 2.6v6.4M5.2 6.4L8 9.2l2.8-2.8M3.4 13h9.2" }],
  check: [{ d: "M3.4 8.4l3 3 6.2-6.8" }],
  close: [{ d: "M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2" }],
  copy: [
    { rect: { x: 5.4, y: 5.4, width: 8.2, height: 8.2, rx: 1.5 } },
    { d: "M10.6 3.6V3a1.4 1.4 0 0 0-1.4-1.4H3.6A1.4 1.4 0 0 0 2.2 3v5.6a1.4 1.4 0 0 0 1.4 1.4h.4" }
  ],
  chat: [{ d: "M13.4 9.4a2.4 2.4 0 0 1-2.4 2.4H6.2L2.6 14.4V4.6a2.4 2.4 0 0 1 2.4-2.4h6a2.4 2.4 0 0 1 2.4 2.4z" }],
  undo: [
    { d: "M3.2 8h7a2.8 2.8 0 0 1 0 5.6H7.4" },
    { d: "M3.2 8l2.8-2.8M3.2 8l2.8 2.8" }
  ],
  arrowUp: [{ d: "M8 12.8V3.2M4.6 6.6L8 3.2l3.4 3.4" }],
  arrowDown: [{ d: "M8 3.2v9.6M4.6 9.4L8 12.8l3.4-3.4" }],
  sync: [
    { d: "M3.4 6.6a4.6 4.6 0 0 1 7.6-2.2M12.6 9.4a4.6 4.6 0 0 1-7.6 2.2" },
    { d: "M11 2.4v2.2H8.8M5 13.6v-2.2h2.2" }
  ],
  fetch: [
    { d: "M4.6 11.4a2.8 2.8 0 0 1-.3-5.6 3.6 3.6 0 0 1 7-1 2.6 2.6 0 0 1 .3 5.2" },
    { d: "M8 8.4v3.6M6.4 10.6L8 12.4l1.6-1.8" }
  ],
  trash: [{ d: "M3.4 4.6h9.2M6.4 4.6V3.2h3.2v1.4M5 4.6l.6 8.2h4.8l.6-8.2" }],
  key: [
    { circle: { cx: 5.6, cy: 10.4, r: 2.4 } },
    { d: "M7.4 8.6l5-5M10.4 5.6l1.6 1.6M12 4l1.4 1.4" }
  ],
  bulb: [
    { d: "M8 2.6a3.6 3.6 0 0 0-2.1 6.5c.4.3.6.8.6 1.3v.4h3v-.4c0-.5.2-1 .6-1.3A3.6 3.6 0 0 0 8 2.6z" },
    { d: "M6.6 12.6h2.8" }
  ],
  branch: [
    { circle: { cx: 4.6, cy: 4, r: 1.6 } },
    { circle: { cx: 4.6, cy: 12, r: 1.6 } },
    { circle: { cx: 11.4, cy: 6.4, r: 1.6 } },
    { d: "M4.6 5.6v4.8M11.4 8c0 2.2-2 3.2-4.6 3.4" }
  ],
  both: [
    { d: "M4 3.4h2.2a2.4 2.4 0 0 1 2.4 2.4v4.4a2.4 2.4 0 0 0 2.4 2.4H13" },
    { d: "M4 12.6h2.2a2.4 2.4 0 0 0 2.4-2.4" }
  ],
  info: [
    { circle: { cx: 8, cy: 8, r: 5.6 } },
    { d: "M8 7.4v4M8 4.8h.01" }
  ],
  list: [{ d: "M5.4 4.4h8M5.4 8h8M5.4 11.6h8M2.8 4.4h.01M2.8 8h.01M2.8 11.6h.01" }],
  external: [
    { d: "M9.4 2.6h4v4" },
    { d: "M13.4 2.6L7.6 8.4" },
    { d: "M12 10v2.6a1.4 1.4 0 0 1-1.4 1.4H3.4A1.4 1.4 0 0 1 2 12.6V5.4A1.4 1.4 0 0 1 3.4 4H6" }
  ],
  // Lucide「sparkles」语义：一颗四角星 + 两枚霰点，读作「由模型生成」，
  // 比通用的五角星（易被读成收藏 / 星标）更贴合本按钮的职责。
  // 主星四臂朝上下左右、中心在 (8,8)，霰点落在对角留白处，整体不偏不倚。
  sparkles: [
    { d: "M8 2.4Q8.5 7.5 13.6 8Q8.5 8.5 8 13.6Q7.5 8.5 2.4 8Q7.5 7.5 8 2.4Z" },
    { d: "M13.1 2.5v2.3M11.95 3.65h2.3" },
    { d: "M2.9 11.2v2.3M1.75 12.35h2.3" }
  ]
};
function icon(name, size = 14) {
  const children = (SHAPES[name] ?? []).map((shape, i) => {
    if (shape.rect !== void 0) return (0, import_react2.createElement)("rect", { key: i, ...shape.rect });
    if (shape.circle !== void 0) return (0, import_react2.createElement)("circle", { key: i, ...shape.circle });
    return (0, import_react2.createElement)("path", { key: i, d: shape.d });
  });
  return (0, import_react2.createElement)(
    "svg",
    {
      className: "dsh-icon",
      viewBox: "0 0 16 16",
      width: size,
      height: size,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.5,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false"
    },
    ...children
  );
}

// src/client/tooltip.ts
var node = null;
function showTip(target, text) {
  hideTip();
  if (text === "") return;
  const el = document.createElement("div");
  el.className = "dsh-gp-tip";
  el.textContent = text;
  el.setAttribute("role", "tooltip");
  document.body.appendChild(el);
  node = el;
  const rect = target.getBoundingClientRect();
  const own = el.getBoundingClientRect();
  let top = rect.top - own.height - 6;
  if (top < 4) top = rect.bottom + 6;
  let left = rect.left + rect.width / 2 - own.width / 2;
  left = Math.max(6, Math.min(left, window.innerWidth - own.width - 6));
  el.style.top = `${Math.round(top)}px`;
  el.style.left = `${Math.round(left)}px`;
}
function hideTip() {
  node?.remove();
  node = null;
}

// src/client/Panel.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var STYLE = `
.dsh-gp { --bg:#ffffff; --fg:#24292f; --muted:#6e7781; --border:rgba(128,128,128,0.25);
  --accent:#1976d2; --hover:rgba(0,0,0,0.05); --current:#1a7f37; --danger:#cf222e;
  /* \u53D8\u66F4\u5B57\u6BCD\u300C\u5DF2\u4FEE\u6539\u300D\u7684\u7425\u73C0\uFF1A\u9009 --dsh-gp-warn \u7684\u6D45\u8272\u503C\uFF0C\u767D\u5E95\u5BF9\u6BD4\u5EA6\u7EA6 5.4:1\u3002
     \u523B\u610F\u4E0D\u6CBF\u7528\u6587\u4EF6\u6811 STATUS_COLORS \u7684 #e2c08d\u2014\u2014\u90A3\u662F VS Code \u6DF1\u8272\u4E3B\u9898\u8272\uFF0C
     \u767D\u5E95\u4E0A\u5BF9\u6BD4\u5EA6\u4E0D\u8DB3 1.5:1\uFF0C\u51E0\u4E4E\u770B\u4E0D\u6E05\u3002 */
  --dsh-gp-modified:#9a6700;
  --panel-bg:#f6f8fa; color:var(--fg); background:var(--bg);
  --dsh-gp-lane-0:#1565c0; --dsh-gp-lane-1:#c62828; --dsh-gp-lane-2:#2e7d32; --dsh-gp-lane-3:#6a1b9a;
  --dsh-gp-lane-4:#00838f; --dsh-gp-lane-5:#e65100; --dsh-gp-lane-6:#4527a0; --dsh-gp-lane-7:#558b2f;
  --dsh-gp-lane-8:#ad1457; --dsh-gp-lane-9:#0277bd; --dsh-gp-lane-10:#ef6c00; --dsh-gp-lane-11:#00695c;
  display:flex; flex-direction:column; height:100%; font-size:13px; }
[data-ds-dark-theme] .dsh-gp { --bg:#1f2328; --fg:#d1d9e0; --muted:#9198a1;
  --border:rgba(255,255,255,0.14); --accent:#58a6ff; --hover:rgba(255,255,255,0.07);
  --current:#3fb950; --danger:#f85149; --panel-bg:#161b22;
  --dsh-gp-modified:#e3b341;
  --dsh-gp-lane-0:#58a6ff; --dsh-gp-lane-1:#ff7b72; --dsh-gp-lane-2:#3fb950; --dsh-gp-lane-3:#bc8cff;
  --dsh-gp-lane-4:#39c5cf; --dsh-gp-lane-5:#f0883e; --dsh-gp-lane-6:#a371f7; --dsh-gp-lane-7:#7ee787;
  --dsh-gp-lane-8:#ffa198; --dsh-gp-lane-9:#76e3ea; --dsh-gp-lane-10:#e3b341; --dsh-gp-lane-11:#56d364; }
.dsh-gp * { box-sizing:border-box; }
.dsh-gp-head { display:flex; align-items:center; gap:6px; padding:8px 10px;
  border-bottom:1px solid var(--border); font-weight:600; }
.dsh-gp-head .spacer { flex:1; }
/* \u64CD\u4F5C\u8FDB\u884C\u4E2D\u7684 loading\uFF1A\u8F6C\u5708 spinner + \u9876\u90E8\u4E0D\u786E\u5B9A\u8FDB\u5EA6\u6761 */
@keyframes dsh-gp-spin { to { transform: rotate(360deg); } }
@keyframes dsh-gp-slide { 0% { left:-40%; width:40%; } 50% { width:60%; } 100% { left:100%; width:40%; } }
.dsh-gp-spinner { display:inline-block; width:11px; height:11px; flex:none; border-radius:50%;
  border:1.5px solid currentColor; border-top-color:transparent; animation:dsh-gp-spin .7s linear infinite;
  vertical-align:-1px; }
.dsh-gp-spinner.lg { width:13px; height:13px; border-width:2px; }
.dsh-gp-progress { position:relative; height:2px; overflow:hidden; flex:none;
  background:color-mix(in srgb, var(--accent) 18%, transparent); }
.dsh-gp-progress::before { content:''; position:absolute; top:0; bottom:0; background:var(--accent);
  border-radius:0 2px 2px 0; animation:dsh-gp-slide 1.15s ease-in-out infinite; }
.dsh-gp-btn { border:1px solid var(--border); background:transparent; color:var(--fg);
  border-radius:4px; padding:2px 8px; font-size:11px; cursor:pointer; }
.dsh-gp-btn:hover { background:var(--hover); }
.dsh-gp-btn:disabled { opacity:0.5; cursor:default; }
.dsh-gp-tabs { display:flex; border-bottom:1px solid var(--border); }
.dsh-gp-tab { flex:1; text-align:center; padding:6px 0; cursor:pointer; color:var(--muted); }
.dsh-gp-tab.active { color:var(--accent); border-bottom:2px solid var(--accent); font-weight:600; }
.dsh-gp-body { flex:1; overflow:auto; padding:4px 0; }
.dsh-gp-section { padding:8px 10px 4px; color:var(--muted); font-size:12px; font-weight:600;
  text-transform:uppercase; letter-spacing:0.4px; }
.dsh-gp-branch-search { width:calc(100% - 16px); margin:4px 8px 4px; padding:4px 8px; font-size:12px;
  color:var(--fg); background:var(--panel-bg); border:1px solid var(--border); border-radius:6px; outline:none; box-sizing:border-box; }
.dsh-gp-branch-search:focus { border-color:var(--accent); }
.dsh-gp-row { display:flex; flex-direction:column; gap:2px; padding:6px 10px; cursor:pointer;
  border-radius:6px; margin:1px 4px; transition:background 0.1s ease; }
.dsh-gp-row:hover { background:var(--hover); }
.dsh-gp-row-top { display:flex; align-items:center; gap:6px; min-width:0; }
.dsh-gp-row-top .name { font-weight:600; font-size:12.5px; color:var(--fg); white-space:nowrap;
  overflow:hidden; text-overflow:ellipsis; flex:1; min-width:0; }
.dsh-gp-row-top .badges { display:flex; align-items:center; gap:4px; flex:none; }
.dsh-gp-row-bottom { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--muted); min-width:0; }
.dsh-gp-row-bottom .commit-msg { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; min-width:0; }
.dsh-gp-row-bottom .commit-date { flex:none; opacity:0.85; font-variant-numeric:tabular-nums; }
.dsh-gp-badge { font-size:11px; padding:1px 6px; border-radius:8px; background:var(--panel-bg); color:var(--muted); white-space:nowrap; }
.dsh-gp-badge.current { background:var(--current); color:#fff; }
.dsh-gp-badge.ahead { color:var(--current); }
.dsh-gp-badge.behind { color:var(--accent); }
.dsh-gp-msg { margin:6px 10px; padding:6px 8px; border-radius:4px; font-size:11px;
  background:var(--panel-bg); white-space:pre-wrap; word-break:break-all; }
.dsh-gp-msg.err { border:1px solid var(--danger); color:var(--danger); }
.dsh-gp-msg.ok { border:1px solid var(--current); color:var(--current); }
.dsh-gp-menu-backdrop { position:fixed; inset:0; z-index:950; }
.dsh-gp-menu { position:fixed; z-index:951; min-width:170px; padding:4px;
  background:var(--panel-bg); border:1px solid var(--border); border-radius:8px;
  box-shadow:0 8px 24px rgba(0,0,0,0.18); font-size:12px; }
.dsh-gp-menu-ico { display:inline-flex; align-items:center; margin-right:6px; vertical-align:-2px; }
.dsh-gp-menu-item { display:flex; align-items:center; padding:6px 10px; border-radius:6px; cursor:pointer; color:var(--fg); white-space:nowrap; }
.dsh-gp-menu-item:hover { background:var(--hover); }
.dsh-gp-menu-item.danger { color:var(--danger); }
.dsh-gp-menu-title { padding:4px 10px 8px; color:var(--muted); font-size:11px; }
.dsh-gp-menu-input { width:100%; box-sizing:border-box; padding:5px 8px; margin-bottom:6px;
  font-size:12px; color:var(--fg); background:var(--bg);
  border:1px solid var(--border); border-radius:6px; outline:none; }
.dsh-gp-menu-input:focus { border-color:var(--accent); }
.dsh-gp-menu-actions { display:flex; gap:6px; padding:2px 2px 4px; }
.dsh-gp-menu-actions .dsh-gp-btn { flex:1; }
.dsh-gp-write { display:flex; flex-direction:column; gap:6px; padding:6px 8px; border-bottom:1px solid var(--border); }
.dsh-gp-write-row { display:flex; gap:6px; align-items:center; }
.dsh-gp-write .dsh-gp-btn { flex:none; }
/* \u63D0\u4EA4\u4FE1\u606F\u8F93\u5165\u6846 + \u5176\u53F3\u7AEF\u5185\u90E8\u7684\u300C\u81EA\u52A8\u751F\u6210\u300D\u6309\u94AE\uFF1A\u6309\u94AE\u7EDD\u5BF9\u5B9A\u4F4D\u8D34\u5728\u8F93\u5165\u6846
   \u53F3\u7F18\u5185\u4FA7\uFF0C\u89C6\u89C9\u4E0A\u660E\u786E\u5C5E\u4E8E\u8F93\u5165\u6846\uFF0C\u800C\u4E0D\u662F\u53C8\u4E00\u884C\u5E76\u6392\u7684\u5DE5\u5177\u680F\u6309\u94AE\u3002 */
.dsh-gp-input-wrap { position:relative; flex:1; min-width:0; display:flex; align-items:stretch; }
.dsh-gp-input { flex:1; min-width:0; padding:4px 8px; font-size:12px; color:var(--fg);
  background:var(--panel-bg); border:1px solid var(--border); border-radius:6px; outline:none; }
.dsh-gp-input:focus { border-color:var(--current); }
/* \u63D0\u4EA4\u4FE1\u606F\u662F\u591A\u884C\u6587\u672C\uFF08\u751F\u6210\u7684\u4FE1\u606F\u5E38\u5E26\u6B63\u6587\uFF09\uFF0C\u56E0\u6B64\u7528 textarea \u6309\u5185\u5BB9\u81EA\u52A8\u6491\u9AD8\uFF0C
   \u957F\u6587\u672C\u6362\u884C\u663E\u793A\uFF0C\u4E0D\u9700\u8981\u6A2A\u5411\u6EDA\u52A8\uFF1B\u53F3\u4E0B\u89D2\u4FDD\u7559\u539F\u751F\u7684\u7EB5\u5411\u62D6\u62FD\u628A\u624B\uFF0C\u9AD8\u5EA6\u7531\u7528\u6237
   \u81EA\u5DF1\u51B3\u5B9A\u3002
   overflow-y:auto \u800C\u4E0D\u662F hidden\uFF1A\u7528\u6237\u628A\u6846\u62D6\u5F97\u6BD4\u5185\u5BB9\u8FD8\u77EE\u65F6\uFF0C\u5185\u5BB9\u4ECD\u7136\u53EF\u8FBE
   \uFF08hidden \u4F1A\u628A\u5185\u5BB9\u88C1\u6389\u4E14\u65E0\u6CD5\u6EDA\u52A8\u67E5\u770B\uFF09\u3002\u6B63\u5E38\u957F\u5EA6\u7684\u5185\u5BB9\u4E0D\u4F1A\u89E6\u53D1\u6EDA\u52A8\u6761\u3002
   max-height \u53EA\u662F\u5B89\u5168\u7F51\uFF0C\u9632\u6B62\u5F02\u5E38\u957F\u7684\u6A21\u578B\u8F93\u51FA\u628A\u6574\u4E2A\u9762\u677F\u6324\u51FA\u89C6\u91CE\u3002 */
.dsh-gp-textarea { display:block; resize:vertical; overflow-y:auto; line-height:1.5;
  min-height:26px; max-height:40vh; font-family:inherit; }
.dsh-gp-input-wrap .dsh-gp-textarea { padding-right:26px; }
/* \u751F\u6210\u6309\u94AE\u8D34\u8F93\u5165\u6846\u53F3\u4E0A\uFF1A\u5355\u884C\uFF0826px \u9AD8\uFF09\u65F6\u6B63\u597D\u5782\u76F4\u5C45\u4E2D\uFF0C\u591A\u884C\u65F6\u8D34\u9876\u4E0D\u8DDF\u7740\u4E0B\u6C89\u3002
   \u7EDD\u5BF9\u5B9A\u4F4D\u4F7F\u5176\u8131\u79BB flex \u6D41\uFF0C\u56E0\u6B64\u4E0D\u4F1A\u5F71\u54CD textarea \u81EA\u8EAB\u7684\u9AD8\u5EA6\u8BA1\u7B97\u3002 */
.dsh-gp-input-btn { position:absolute; right:3px; top:3px;
  width:20px; height:20px; padding:0; display:inline-flex; align-items:center; justify-content:center;
  border:1px solid transparent; background:transparent; color:var(--muted); cursor:pointer; border-radius:5px;
  transition:background .12s ease, color .12s ease, border-color .12s ease; }
.dsh-gp-input-btn:hover:not(:disabled) { background:var(--hover); border-color:var(--border); color:var(--fg); }
.dsh-gp-input-btn:disabled { cursor:default; opacity:0.55; }
.dsh-gp-input-btn .dsh-gp-spinner { width:11px; height:11px; }
/* \u72B6\u6001\u6458\u8981\uFF1A\u5185\u5BB9\u662F\u4EBA\u8BDD\uFF08\u53EF\u80FD\u8F83\u957F\uFF09\uFF0C\u6362\u884C\u663E\u793A\u800C\u4E0D\u662F\u7701\u7565\u53F7\u622A\u65AD\u2014\u2014\u622A\u65AD\u4F1A\u628A
   \u300C12 \u4E2A\u6587\u4EF6\u5DF2\u6539\u52A8 \xB7 4 \u5DF2\u6682\u5B58 \xB7 8 \u672A\u6682\u5B58\u300D\u7684\u5173\u952E\u6570\u5B57\u5403\u6389\uFF0C\u90A3\u6B63\u662F\u5B83\u5B58\u5728\u7684\u610F\u4E49\u3002
   \u5B8C\u6574\u7684 porcelain \u539F\u6587\u4ECD\u6302\u5728 title \u4E0A\u4F9B\u60AC\u505C\u67E5\u770B\u3002 */
.dsh-gp-write-status { flex:1; min-width:0; font-size:11px; color:var(--muted); line-height:1.45; }
.dsh-gp-detail-actions { display:flex; gap:6px; margin-top:6px; }
.dsh-gp-detail-actions .dsh-gp-btn { font-size:11px; padding:2px 8px; }
.dsh-gp-changes { border-top:1px solid var(--border); padding:6px 8px; display:flex; flex-direction:column; gap:6px; }
.dsh-gp-conflict-banner { background:rgba(210,153,34,0.15); border:1px solid rgba(210,153,34,0.4);
  color:#d29922; border-radius:6px; padding:4px 8px; font-size:11px; font-weight:600; display:flex; align-items:center; gap:4px; }
[data-ds-dark-theme] .dsh-gp-conflict-banner { color:#e3b341; border-color:rgba(227,179,65,0.4); }
.dsh-gp-changes-group { display:flex; flex-direction:column; gap:2px; }
.dsh-gp-changes-group-head { font-size:10.5px; color:var(--muted); font-weight:600; padding:2px 4px; display:flex; align-items:center; justify-content:space-between; gap:6px; }
/* \u5206\u7EC4\u5934\u53F3\u4FA7\u7684\u6279\u91CF\u64CD\u4F5C\uFF1A\u4E0E\u5206\u7EC4\u6807\u9898\u540C\u4E00\u884C\u3001\u7D27\u8D34\u53F3\u7F18\uFF0C\u7528\u6BD4\u884C\u5185\u52A8\u4F5C\u66F4\u8F7B\u7684
   \u56FE\u6807\u6309\u94AE\uFF08\u590D\u7528 .dsh-gp-act \u7684\u89C6\u89C9\u8BED\u8A00\uFF09\uFF0C\u4E0D\u989D\u5916\u589E\u52A0\u4E00\u884C\u7684\u9AD8\u5EA6\u3002 */
.dsh-gp-group-actions { display:flex; align-items:center; gap:2px; flex:none; }
.dsh-gp-changes-group-head .dsh-gp-act { opacity:1; }
.dsh-gp-changes-title { display:flex; align-items:center; justify-content:space-between; gap:6px; padding:2px 0 4px; font-size:11px; color:var(--muted); }
.dsh-gp-changes-list { display:flex; flex-direction:column; gap:2px; max-height:140px; overflow-y:auto; }
.dsh-gp-changes-item { display:flex; align-items:center; gap:4px; padding:3px 6px; border-radius:5px;
  font-size:11px; color:var(--fg); cursor:pointer; min-width:0; }
.dsh-gp-changes-item:hover { background:var(--hover); }
/* \u53D8\u66F4\u884C\u9996\u7684\u72B6\u6001\u5FBD\u7AE0\uFF1A\u5C55\u793A\u5355\u4E2A\u8BED\u4E49\u5B57\u6BCD\uFF08U \u672A\u8DDF\u8E2A / M \u5DF2\u4FEE\u6539 / A \u65B0\u589E /
   D \u5220\u9664 / R \u91CD\u547D\u540D / C \u51B2\u7A81\uFF09\uFF0C\u4E0D\u518D\u663E\u793A porcelain \u539F\u59CB\u7801\u2014\u2014\u300C M\u300D\u7684\u524D\u5BFC\u7A7A\u683C\u5728
   \u754C\u9762\u4E0A\u5B8C\u5168\u4E0D\u53EF\u89C1\uFF0C\u300C??\u300D\u4E5F\u4E0D\u8BF4\u660E\u300C\u8FD9\u662F\u65B0\u6587\u4EF6\u4E14\u5C1A\u672A\u7EB3\u5165 git\u300D\u3002
   \u8BCD\u6C47\u4E0E\u6587\u4EF6\u6811\u88C5\u9970\u4E00\u81F4\uFF08\u540C\u4E00\u4E2A\u6587\u4EF6\u4E24\u5904\u540C\u5B57\u6BCD\uFF09\uFF0C\u914D\u8272\u8D70\u4E3B\u9898\u4EE4\u724C\u4FDD\u8BC1\u6DF1\u6D45\u8272\u53EF\u8BFB\u3002
   \u6CE8\uFF1A\u672C\u6BB5\u5728\u6A21\u677F\u5B57\u7B26\u4E32\u5185\uFF0C\u6CE8\u91CA\u91CC\u7981\u6B62\u4F7F\u7528\u53CD\u5F15\u53F7\u3002 */
.dsh-gp-changes-code { flex:none; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:10px;
  width:20px; font-weight:700; text-align:center; color:var(--fg); }
.dsh-gp-changes-code[data-letter="U"], .dsh-gp-changes-code[data-letter="A"] { color:var(--current); }
.dsh-gp-changes-code[data-letter="M"], .dsh-gp-changes-code[data-letter="R"] { color:var(--dsh-gp-modified); }
.dsh-gp-changes-code[data-letter="D"], .dsh-gp-changes-code[data-letter="C"] { color:var(--danger); }
.dsh-gp-changes-file { flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
/* \u53D8\u66F4\u884C\u5C3E\u64CD\u4F5C\u6309\u94AE\uFF1A\u7EDF\u4E00\u56FE\u6807\u6309\u94AE\uFF0C\u60AC\u505C\u51FA\u73B0 + \u5373\u65F6 tooltip */
.dsh-gp-act { opacity:0; width:22px; height:20px; padding:0; display:inline-flex; align-items:center;
  justify-content:center; border:1px solid transparent; background:transparent; color:var(--muted);
  cursor:pointer; border-radius:5px; flex:none;
  transition:background .12s ease, color .12s ease, border-color .12s ease, opacity .12s ease; }
.dsh-gp-changes-item:hover .dsh-gp-act, .dsh-gp-act:focus-visible { opacity:1; }
.dsh-gp-act:hover { background:var(--panel-bg); border-color:var(--border); color:var(--fg); }
.dsh-gp-act.danger:hover { color:var(--danger); border-color:color-mix(in srgb, var(--danger) 45%, transparent); }
.dsh-gp-msg-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.dsh-gp-msg-text { display:inline-flex; align-items:center; gap:6px; min-width:0; }
.dsh-gp-msg-text .dsh-gp-spinner { color:var(--accent); }
/* \u53D6\u6D88\u6309\u94AE\uFF1A\u56FE\u6807 + \u6587\u5B57\u540C\u4E00\u884C\uFF0C\u7D27\u51D1\u4E14\u4E0E\u9762\u677F\u98CE\u683C\u4E00\u81F4 */
.dsh-gp-cancel { display:inline-flex; align-items:center; gap:4px; flex:none; cursor:pointer;
  font-size:10.5px; line-height:1; padding:3px 7px; border-radius:5px;
  color:var(--danger); background:transparent; border:1px solid color-mix(in srgb, var(--danger) 40%, transparent);
  transition:background .12s ease, color .12s ease; }
.dsh-gp-cancel:hover { background:color-mix(in srgb, var(--danger) 12%, transparent); }
.dsh-gp-cancel .dsh-icon { vertical-align:0; }
/* \u5373\u65F6 tooltip\uFF1A\u56FA\u5B9A\u5B9A\u4F4D\u6302\u5728 body \u4E0B\uFF0C\u4E0D\u4F1A\u88AB\u5217\u8868\u7684 overflow \u88C1\u6389 */
.dsh-gp-tip { position:fixed; z-index:9999; pointer-events:none; padding:3px 8px; border-radius:6px;
  font-size:11px; line-height:16px; white-space:nowrap; color:#fff; background:rgba(28,32,38,.96);
  box-shadow:0 4px 14px rgba(0,0,0,.28); }
.dsh-gp-btn-ico { display:inline-flex; align-items:center; margin-right:4px; vertical-align:-2px; }
/* \u7EDF\u4E00\u56FE\u6807\u57FA\u7EBF\uFF1A\u9ED8\u8BA4\u884C\u5185\uFF0C\u907F\u514D\u5728\u6309\u94AE\u91CC\u628A\u6587\u5B57\u6324\u5230\u4E0B\u4E00\u884C\uFF1Bflex \u5BB9\u5668\u5185\u4ECD\u662F flex:none */
.dsh-icon { display:inline-block; vertical-align:-2px; flex:none; }
.dsh-gp-changes-diff { border:1px solid var(--border); border-radius:6px; margin-top:4px; overflow:hidden; }
.dsh-gp-changes-diff .dsh-gp-changes-head { padding:4px 6px; background:var(--panel-bg); }
.dsh-gp-changes-pre { max-height:240px; overflow:auto; font-size:11px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  line-height:1.5; padding:4px 0; margin:0; background:var(--bg); }
.dsh-gp-diff-line { padding:0 6px; white-space:pre-wrap; word-break:break-all; display:flex; gap:8px; }
.dsh-gp-diff-line-num { width:28px; text-align:right; color:var(--muted); opacity:0.6; flex:none; user-select:none; font-variant-numeric:tabular-nums; }
.dsh-gp-diff-line-text { flex:1; min-width:0; }
.dsh-gp-diff-line.add { background:rgba(46,160,67,0.15); color:var(--current); }
.dsh-gp-diff-line.del { background:rgba(248,81,73,0.15); color:var(--danger); }
.dsh-gp-diff-line.hunk { background:rgba(56,139,253,0.15); color:var(--accent); font-weight:600; }
.dsh-gp-changes-empty { padding:8px; font-size:11px; color:var(--muted); }
.dsh-gp-empty { padding:20px 10px; text-align:center; color:var(--muted); }
.dsh-gp-warn { flex:1; display:flex; align-items:center; justify-content:center;
  padding:24px; text-align:center; color:#9a6700; font-size:12px; line-height:1.7; }
[data-ds-dark-theme] .dsh-gp-warn { color:#d4a72c; }
.dsh-gp-detail { border-top:1px solid var(--border); padding:6px 10px; font-size:11px;
  background:var(--panel-bg); max-height:120px; overflow:auto; word-break:break-word; line-height:1.45; }
.dsh-gp-col-resize { position:absolute; top:0; height:28px; cursor:col-resize; touch-action:none; z-index:5; }
.dsh-gp-col-resize::after { content:''; position:absolute; left:2.5px; top:6px; bottom:6px;
  width:1px; background:var(--border); opacity:0.7; }
.dsh-gp-col-resize:hover::after, .dsh-gp-col-resize:active::after { background:var(--accent); opacity:1; }
`;
var styleInjected = false;
function ensureStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-git-panel";
  tag.textContent = STYLE;
  document.head.appendChild(tag);
}
function injectTextToChatInput(text) {
  const el = document.querySelector('[contenteditable="true"], [data-lexical-editor="true"], [role="textbox"], textarea');
  if (!el) return false;
  el.focus();
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const proto = Object.getPrototypeOf(el);
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set || Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    const cur = el.value || "";
    const next = cur ? `${cur}

${text}` : text;
    if (nativeSetter) {
      nativeSetter.call(el, next);
    } else {
      el.value = next;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.selectionStart = el.value.length;
    el.selectionEnd = el.value.length;
    return true;
  }
  const sel = window.getSelection();
  if (sel) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  const prefix = el.textContent && el.textContent.trim() !== "" ? "\n\n" : "";
  const success = document.execCommand("insertText", false, prefix + text);
  if (!success) {
    el.dispatchEvent(new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: prefix + text
    }));
  }
  return true;
}
var GLOBAL_GIT_BUSY_MAP = /* @__PURE__ */ new Map();
function menuIcon(name) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-menu-ico", children: icon(name, 13) });
}
function tipProps(text) {
  return {
    onMouseEnter: (event) => showTip(event.currentTarget, text),
    onMouseLeave: hideTip,
    onFocus: (event) => showTip(event.currentTarget, text),
    onBlur: hideTip
  };
}
var BADGE_LABEL_KEY = {
  U: "changes.mark.untracked",
  M: "changes.mark.modified",
  A: "changes.mark.added",
  D: "changes.mark.deleted",
  R: "changes.mark.renamed",
  C: "changes.mark.conflict"
};
function ChangeBadge(props) {
  const t2 = useT();
  const letter = changeBadgeOf(props.code);
  const label = t2(BADGE_LABEL_KEY[letter] ?? "changes.mark.modified");
  const tip = letter === "C" ? `${label} (${props.code})` : label;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-changes-code", "data-letter": letter, ...tipProps(tip), children: letter });
}
function RowAction(props) {
  const { icon: name, label, danger, onClick } = props;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "button",
    {
      type: "button",
      className: `dsh-gp-act${danger === true ? " danger" : ""}`,
      "aria-label": label,
      onMouseEnter: (event) => showTip(event.currentTarget, label),
      onMouseLeave: hideTip,
      onFocus: (event) => showTip(event.currentTarget, label),
      onBlur: hideTip,
      onClick,
      children: icon(name, 13)
    }
  );
}
var BranchRowView = (0, import_react3.memo)(function BranchRowView2(props) {
  const { row, isRemote, current, busy, onActivate, onPull, onContextMenu } = props;
  const t2 = useT();
  const isCurrent = !isRemote && row.name === current;
  const badges = [
    !isRemote && row.ahead ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsh-gp-badge ahead", children: [
      icon("arrowUp", 11),
      row.ahead
    ] }, "a") : null,
    !isRemote && row.behind ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "span",
      {
        className: `dsh-gp-badge behind ${busy && isCurrent ? "busy" : ""}`,
        style: { cursor: isCurrent && !busy ? "pointer" : "default" },
        title: busy && isCurrent ? t2("panel.pullingNow") : t2("panel.behindHint", { count: String(row.behind) }),
        onClick: (e) => {
          if (isCurrent && !busy && onPull) {
            e.stopPropagation();
            onPull();
          }
        },
        children: [
          busy && isCurrent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-spinner" }) : icon("arrowDown", 11),
          busy && isCurrent ? t2("panel.pullingNow") : row.behind
        ]
      },
      "b"
    ) : null,
    isCurrent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-badge current", children: t2("badge.current") }, "c") : null
  ];
  const dateText = row.date ? row.date.slice(5, 16).replace("T", " ") : "";
  const commitFull = `${row.subject ?? ""}${dateText ? ` (${dateText})` : ""}`;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      className: "dsh-gp-row",
      title: `${row.name}
${commitFull}`,
      onDoubleClick: () => {
        if (busy) return;
        onActivate(row.name);
      },
      onContextMenu: (event) => {
        event.preventDefault();
        onContextMenu(event, row, isRemote);
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-row-top", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "name", title: row.name, children: row.name }),
          badges.some(Boolean) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "badges", children: badges }) : null
        ] }),
        row.subject || dateText ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-row-bottom", title: commitFull, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "commit-msg", children: row.subject || "\u2014" }),
          dateText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "commit-date", children: dateText }) : null
        ] }) : null
      ]
    }
  );
});
var ROW_HEIGHT = 24;
var LANE_WIDTH = 14;
var NODE_RADIUS = 4;
var PAD_LEFT = 10;
var PAD_TOP = 10;
var LANE_COLOR_COUNT = 12;
var GRAPH_BUFFER_ROWS = 10;
var laneColor = (lane) => `var(--dsh-gp-lane-${lane % LANE_COLOR_COUNT})`;
var fitByWidth = (text, maxWidth) => {
  let w = 0;
  for (let i = 0; i < text.length; i += 1) {
    w += text.charCodeAt(i) > 255 ? 12 : 6.5;
    if (w > maxWidth) return `${text.slice(0, i)}\u2026`;
  }
  return text;
};
var GraphSvg = (0, import_react3.memo)(function GraphSvg2(props) {
  const { layout, graph, textX, commitWidth, labelZone, graphWidth, height, onSelect } = props;
  const rootRef = (0, import_react3.useRef)(null);
  const [viewport, setViewport] = (0, import_react3.useState)({ first: 0, last: Infinity });
  (0, import_react3.useLayoutEffect)(() => {
    const root = rootRef.current;
    if (!root) return;
    const scroller = root.closest(".dsh-gp-body");
    if (!scroller) return;
    const measure = () => {
      const rect = root.getBoundingClientRect();
      const srect = scroller.getBoundingClientRect();
      const v0 = srect.top - rect.top;
      const v1 = v0 + scroller.clientHeight;
      const first = Math.max(0, Math.floor((v0 - PAD_TOP) / ROW_HEIGHT) - GRAPH_BUFFER_ROWS);
      const last2 = Math.min(layout.length - 1, Math.ceil((v1 - PAD_TOP) / ROW_HEIGHT) + GRAPH_BUFFER_ROWS);
      setViewport((prev) => prev.first === first && prev.last === last2 ? prev : { first, last: last2 });
    };
    measure();
    let raf = 0;
    const onScroll = () => {
      if (raf !== 0) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        measure();
      });
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (raf !== 0) cancelAnimationFrame(raf);
    };
  }, [layout]);
  const bySha = (0, import_react3.useMemo)(() => {
    const map = /* @__PURE__ */ new Map();
    for (const c of layout) map.set(c.sha, c);
    return map;
  }, [layout]);
  const xOf = (lane) => PAD_LEFT + lane * LANE_WIDTH;
  const yOf = (row) => PAD_TOP + row * ROW_HEIGHT;
  const tipBranches = (0, import_react3.useMemo)(
    () => Object.entries(graph.tips).filter(([, sha]) => bySha.has(sha)),
    [graph.tips, bySha]
  );
  const tipLabelByRow = (0, import_react3.useMemo)(() => {
    const byRow = /* @__PURE__ */ new Map();
    const sorted = [...tipBranches].sort(([a], [b]) => {
      const aCur = a === graph.current ? 0 : 1;
      const bCur = b === graph.current ? 0 : 1;
      return aCur - bCur || a.localeCompare(b);
    });
    for (const [branch, sha] of sorted) {
      const commit = bySha.get(sha);
      if (!commit) continue;
      const key = commit.row;
      if (!byRow.has(key)) byRow.set(key, branch);
    }
    return byRow;
  }, [tipBranches, bySha, graph.current]);
  const subjects = (0, import_react3.useMemo)(
    () => new Map(layout.map((c) => [c.sha, fitByWidth(c.subject, commitWidth - 2)])),
    [layout, commitWidth]
  );
  const tipTexts = (0, import_react3.useMemo)(
    () => new Map([...tipLabelByRow.entries()].map(([row, b]) => [row, fitByWidth(b, labelZone - 6)])),
    [tipLabelByRow, labelZone]
  );
  const isTipCommit = (commit) => tipBranches.some(([, sha]) => sha === commit.sha);
  const nodeFill = (commit) => {
    const isCurrentTip = tipBranches.some(([branch, sha]) => sha === commit.sha && branch === graph.current);
    return isCurrentTip ? "var(--current)" : laneColor(commit.lane);
  };
  const last = Math.min(viewport.last, layout.length - 1);
  const inWindow = (row) => row >= viewport.first && row <= last;
  const edges = [];
  const nodes = [];
  layout.forEach((commit) => {
    const parents = commit.parents.map((parentSha) => bySha.get(parentSha)).filter((parent) => parent !== void 0);
    const drawEdges = inWindow(commit.row) || parents.some((parent) => inWindow(parent.row));
    if (!drawEdges) return;
    const x = xOf(commit.lane);
    const y = yOf(commit.row);
    const color = laneColor(commit.lane);
    parents.forEach((parent) => {
      const px = xOf(parent.lane);
      const py = yOf(parent.row);
      if (parent.lane === commit.lane) {
        edges.push(
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "line",
            {
              x1: x,
              y1: y,
              x2: px,
              y2: py,
              stroke: color,
              strokeWidth: "1.2",
              opacity: "0.85"
            },
            `e-${commit.sha}-${parent.sha}`
          )
        );
      } else {
        const dy = Math.min(12, (py - y) / 2);
        const d = `M ${x} ${y} C ${x} ${y + dy}, ${px} ${py - dy}, ${px} ${py}`;
        edges.push(
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "path",
            {
              d,
              fill: "none",
              stroke: color,
              strokeWidth: "1.2",
              opacity: "0.85"
            },
            `e-${commit.sha}-${parent.sha}`
          )
        );
      }
    });
    if (!inWindow(commit.row)) return;
    nodes.push(
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { onClick: () => onSelect(commit), style: { cursor: "pointer" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("title", { children: `${commit.subject}

SHA: ${commit.sha}
Author: ${commit.author}
Date: ${commit.date}` }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: x, cy: y, r: NODE_RADIUS + 2, fill: "transparent" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "circle",
          {
            cx: x,
            cy: y,
            r: NODE_RADIUS,
            fill: nodeFill(commit),
            stroke: isTipCommit(commit) ? "var(--bg)" : "none",
            strokeWidth: isTipCommit(commit) ? 1.5 : 0
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { x: textX, y: y + 3.5, fontSize: "12", fill: "var(--fg)", style: { pointerEvents: "none" }, children: subjects.get(commit.sha) ?? commit.subject })
      ] }, `n-${commit.sha}`)
    );
  });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ref: rootRef, width: graphWidth, height, style: { display: "block", cursor: "default" }, children: [
    edges,
    nodes,
    [...tipLabelByRow.entries()].filter(([row]) => inWindow(row)).map(([row, branch]) => {
      const isCurrent = branch === graph.current;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "text",
        {
          x: graphWidth - 4,
          y: yOf(row) + 4,
          fontSize: "11",
          textAnchor: "end",
          fontWeight: isCurrent ? 700 : 400,
          fill: isCurrent ? "var(--current)" : "var(--muted)",
          style: { cursor: "default" },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("title", { children: branch }),
            tipTexts.get(row) ?? branch
          ]
        },
        `tip-${row}`
      );
    })
  ] });
});
var GraphViewComponent = (0, import_react3.memo)(function GraphViewComponent2(props) {
  const { graph, width, onCherryPick, onRevert } = props;
  const t2 = useT();
  const [selected, setSelected] = (0, import_react3.useState)(null);
  const layout = (0, import_react3.useMemo)(() => layoutGraph(graph.commits), [graph]);
  const onSelect = (0, import_react3.useCallback)((commit) => setSelected(commit), []);
  const lanes = Math.max(1, ...layout.map((c) => c.lane + 1));
  const laneRight = PAD_LEFT + lanes * LANE_WIDTH;
  const height = PAD_TOP + layout.length * ROW_HEIGHT + 12;
  const readSaved = (key) => {
    try {
      const saved = Number(localStorage.getItem(key));
      return Number.isFinite(saved) && saved >= 40 ? saved : 0;
    } catch {
      return 0;
    }
  };
  const [commitOverride, setCommitOverride] = (0, import_react3.useState)(() => readSaved("dsh-gp-graph-col-commit"));
  const commitRef = (0, import_react3.useRef)(commitOverride);
  (0, import_react3.useEffect)(() => {
    commitRef.current = commitOverride;
  }, [commitOverride]);
  const [gapOverride, setGapOverride] = (0, import_react3.useState)(() => readSaved("dsh-gp-graph-col-gap"));
  const gapRef = (0, import_react3.useRef)(gapOverride);
  (0, import_react3.useEffect)(() => {
    gapRef.current = gapOverride;
  }, [gapOverride]);
  const gap = gapOverride > 0 ? gapOverride : 14;
  const textX = laneRight + gap;
  const usableWidth = Math.max(260, width - 16);
  const BRANCH_COL_WIDTH = 96;
  const labelZone = BRANCH_COL_WIDTH;
  const autoCommit = Math.max(80, usableWidth - textX - labelZone - 8);
  const commitWidth = commitOverride > 0 ? commitOverride : autoCommit;
  const commitRight = textX + commitWidth;
  const graphWidth = Math.max(usableWidth, commitRight + labelZone + 8);
  const labelLeft = graphWidth - labelZone;
  const startResize = (key, valueRef, set, start, min, max) => (event) => {
    event.preventDefault();
    event.stopPropagation();
    const startClientX = event.clientX;
    const onMove = (ev) => {
      set(Math.min(max, Math.max(min, start + (ev.clientX - startClientX))));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      try {
        localStorage.setItem(key, String(valueRef.current));
      } catch {
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };
  const resetResize = (key, set) => () => {
    set(0);
    try {
      localStorage.removeItem(key);
    } catch {
    }
  };
  const startCommitResize = startResize("dsh-gp-graph-col-commit", commitRef, setCommitOverride, commitWidth, 60, 900);
  const startLeftResize = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const startClientX = event.clientX;
    const startCommitRight = commitRight;
    const startGap = gap;
    const onMove = (ev) => {
      const maxGap = Math.max(4, startCommitRight - laneRight - 60);
      const minGap = Math.max(4, startCommitRight - laneRight - 900);
      const next = Math.min(maxGap, Math.max(minGap, startGap + (ev.clientX - startClientX)));
      setGapOverride(next);
      setCommitOverride(startCommitRight - (laneRight + next));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      try {
        localStorage.setItem("dsh-gp-graph-col-gap", String(gapRef.current));
        localStorage.setItem("dsh-gp-graph-col-commit", String(commitRef.current));
      } catch {
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 8px", position: "relative", width: "max-content" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        style: {
          position: "relative",
          width: graphWidth,
          height: 28,
          fontSize: 13,
          color: "var(--muted)",
          userSelect: "none"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { position: "absolute", left: PAD_LEFT, top: 8, fontWeight: 600 }, children: t2("graph.col.lanes") }),
          lanes >= 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              className: "dsh-gp-col-resize",
              title: t2("graph.col.resize"),
              onPointerDown: startLeftResize,
              onDoubleClick: resetResize("dsh-gp-graph-col-gap", setGapOverride),
              style: { left: textX - 10, width: 6 }
            }
          ) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { position: "absolute", left: textX, top: 8, fontWeight: 600 }, children: t2("graph.col.commit") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              className: "dsh-gp-col-resize",
              title: t2("graph.col.resize"),
              onPointerDown: startCommitResize,
              onDoubleClick: resetResize("dsh-gp-graph-col-commit", setCommitOverride),
              style: { left: commitRight - 3, width: 6 }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { position: "absolute", left: labelLeft, top: 8, fontWeight: 600 }, children: t2("graph.col.branch") })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      GraphSvg,
      {
        layout,
        graph,
        textX,
        commitWidth,
        labelZone,
        graphWidth,
        height,
        onSelect
      }
    ),
    selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-detail", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: selected.subject }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        selected.sha,
        " \xB7 ",
        selected.author,
        " \xB7 ",
        selected.date
      ] }),
      onCherryPick !== void 0 || onRevert !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-detail-actions", children: [
        onCherryPick !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh-gp-btn", onClick: () => onCherryPick(selected.sha), children: t2("op.cherryPick") }) : null,
        onRevert !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh-gp-btn", onClick: () => onRevert(selected.sha), children: t2("op.revert") }) : null
      ] }) : null
    ] }) : null
  ] });
});
function GitPanel(props) {
  const { path, api, onOpenDiff, onRefreshStatus } = props;
  const t2 = useT();
  const [tab, setTab] = (0, import_react3.useState)("branches");
  const [branches, setBranches] = (0, import_react3.useState)(null);
  const [graph, setGraph] = (0, import_react3.useState)(null);
  const [loading, setLoading] = (0, import_react3.useState)(false);
  const loadSeq = (0, import_react3.useRef)(0);
  const pathRef = (0, import_react3.useRef)(path);
  pathRef.current = path;
  const [busy, setBusyState] = (0, import_react3.useState)(() => GLOBAL_GIT_BUSY_MAP.get(path)?.busy ?? false);
  const [message, setMessageState] = (0, import_react3.useState)(() => GLOBAL_GIT_BUSY_MAP.get(path)?.message ?? null);
  const [pendingOp, setPendingOpState] = (0, import_react3.useState)(() => GLOBAL_GIT_BUSY_MAP.get(path)?.pendingOp ?? null);
  const setBusy = (val) => {
    setBusyState(val);
    const cur = GLOBAL_GIT_BUSY_MAP.get(path) || {};
    GLOBAL_GIT_BUSY_MAP.set(path, { ...cur, busy: val });
  };
  const setPendingOp = (op) => {
    setPendingOpState(op);
    const cur = GLOBAL_GIT_BUSY_MAP.get(path) || {};
    GLOBAL_GIT_BUSY_MAP.set(path, { ...cur, pendingOp: op });
  };
  const setMessage = (msg) => {
    setMessageState(msg);
    const cur = GLOBAL_GIT_BUSY_MAP.get(path) || {};
    GLOBAL_GIT_BUSY_MAP.set(path, { ...cur, message: msg });
  };
  (0, import_react3.useEffect)(() => {
    setGenerating(false);
    setChanges([]);
    setStash(null);
    const globalState = GLOBAL_GIT_BUSY_MAP.get(path);
    if (globalState) {
      if (globalState.busy !== void 0) setBusyState(globalState.busy);
      if (globalState.pendingOp !== void 0) setPendingOpState(globalState.pendingOp);
      if (globalState.message !== void 0) setMessageState(globalState.message);
    }
  }, [path]);
  const [width, setWidth] = (0, import_react3.useState)(300);
  const [menu, setMenu] = (0, import_react3.useState)(null);
  const [menuMode, setMenuMode] = (0, import_react3.useState)("main");
  const [renameValue, setRenameValue] = (0, import_react3.useState)("");
  const [commitMsg, setCommitMsg] = (0, import_react3.useState)("");
  const [generating, setGenerating] = (0, import_react3.useState)(false);
  const commitRef = (0, import_react3.useRef)(null);
  const appliedHeightRef = (0, import_react3.useRef)(null);
  const [statusText, setStatusText] = (0, import_react3.useState)("");
  const [stash, setStash] = (0, import_react3.useState)(null);
  const [changes, setChanges] = (0, import_react3.useState)([]);
  const { conflicts, staged, unstaged } = (0, import_react3.useMemo)(() => classifyChanges(changes), [changes]);
  const [diffState, setDiffState] = (0, import_react3.useState)(null);
  const [branchSearch, setBranchSearch] = (0, import_react3.useState)("");
  ensureStyle();
  (0, import_react3.useLayoutEffect)(() => {
    const el = commitRef.current;
    if (el === null) return;
    if (commitMsg === "") {
      el.style.height = "";
      appliedHeightRef.current = null;
      return;
    }
    if (appliedHeightRef.current !== null && el.style.height !== appliedHeightRef.current) return;
    el.style.height = "auto";
    const border = el.offsetHeight - el.clientHeight;
    const next = `${el.scrollHeight + border}px`;
    el.style.height = next;
    appliedHeightRef.current = next;
  }, [commitMsg]);
  const load = (0, import_react3.useCallback)(async () => {
    if (!path) return;
    const seq = ++loadSeq.current;
    setLoading(true);
    setBranches(null);
    setGraph(null);
    setMessage(null);
    const [b, g] = await Promise.all([api.branches(path), api.graph(path)]);
    if (seq !== loadSeq.current) return;
    if (b.ok) setBranches(b.value);
    if (g.ok) setGraph(g.value);
    if (!b.ok) setMessage({ text: tError(b.error.code, b.error.message), kind: "err" });
    else if (!g.ok) setMessage({ text: tError(g.error.code, g.error.message), kind: "err" });
    setLoading(false);
  }, [path, api]);
  (0, import_react3.useEffect)(() => {
    void load();
  }, [load]);
  const refreshStatus = (0, import_react3.useCallback)(async () => {
    if (!path) return;
    const result = await api.status(path);
    const output = result.ok ? result.value.output : "";
    setStatusText(output);
    const list = [];
    for (const line of output.split("\n")) {
      if (line.trim() === "" || line.length < 4) continue;
      const code = line.slice(0, 2);
      const file = line.slice(3).trim();
      if (file !== "") list.push({ code, file });
    }
    setChanges(list);
  }, [path, api]);
  const refreshStash = (0, import_react3.useCallback)(async () => {
    if (!path) return;
    const result = await api.stashSummary(path);
    setStash(result.ok ? result.value : null);
  }, [path, api]);
  const loadDiff = (0, import_react3.useCallback)(async (file) => {
    if (!path) return;
    setDiffState({ file, content: "", busy: true });
    const result = await api.diffFile(path, file);
    setDiffState({ file, content: result.ok ? result.value.output : tError(result.error?.code, result.error?.message ?? ""), busy: false });
  }, [path, api]);
  (0, import_react3.useEffect)(() => {
    void refreshStatus();
    void refreshStash();
  }, [refreshStatus, refreshStash]);
  const runWrite = (0, import_react3.useCallback)(async (action, extra) => {
    if (!path || busy) return;
    setBusy(true);
    setPendingOp(action);
    setMessage(null);
    let result;
    try {
      if (action === "commit") {
        if (staged.length === 0) {
          setMessage({ text: t2("write.commit.emptyStageNotice"), kind: "err" });
          setPendingOp(null);
          setBusy(false);
          return;
        }
        result = await api.commit(path, extra ?? commitMsg);
      } else if (action === "push") {
        result = await api.push(path);
      } else if (action === "sync") {
        result = await api.sync(path);
      } else if (action === "stash-push") {
        result = await api.stashPush(path, extra);
      } else if (action === "stash-pop") {
        result = await api.stashPop(path);
      } else if (action === "stage") {
        result = await api.stageFile(path, extra ?? "");
      } else if (action === "unstage") {
        result = await api.unstageFile(path, extra ?? "");
      } else {
        const [file, untracked] = (extra ?? "").split("|");
        result = await api.discardFile(path, file, untracked === "untracked");
      }
    } catch (error) {
      result = { ok: false, error: { code: "internal", message: error instanceof Error ? error.message : String(error) } };
    }
    if (result.ok) {
      setMessage({ text: result.output ?? t2("op.ok"), kind: "ok" });
      if (action === "commit" || action === "stash-pop") setCommitMsg("");
      void refreshStatus();
      void refreshStash();
      void load();
      onRefreshStatus?.();
    } else {
      let errMsg = tError(result.error?.code, result.error?.message ?? t2("op.failed"));
      let showAuthForm = false;
      if (errMsg.includes("OAuth") || errMsg.includes("Authentication") || errMsg.includes("fatal: could not read Username") || errMsg.includes("terminal prompts disabled")) {
        errMsg = t2("panel.needCredential");
        showAuthForm = true;
      }
      setMessage({ text: errMsg, kind: "err", showAuthForm });
    }
    setPendingOp(null);
    setBusy(false);
  }, [path, api, busy, commitMsg, t2, refreshStatus, refreshStash, load, onRefreshStatus, staged.length]);
  const runBatchStage = (0, import_react3.useCallback)(async (files, action) => {
    if (!path || busy || files.length === 0) return;
    setBusy(true);
    setPendingOp(action);
    setMessage({ text: t2("panel.running", { label: t2(action === "stage" ? "changes.stageAll" : "changes.unstageAll") }), kind: "ok" });
    const outcome = await runBatch(files, async (file) => {
      try {
        return await (action === "stage" ? api.stageFile(path, file) : api.unstageFile(path, file));
      } catch (error) {
        return { ok: false, error: { code: "internal", message: error instanceof Error ? error.message : String(error) } };
      }
    });
    if (outcome.failure === null) {
      setMessage({ text: t2(action === "stage" ? "changes.stageAllDone" : "changes.unstageAllDone", { count: String(outcome.done) }), kind: "ok" });
    } else {
      setMessage({
        text: t2("changes.batchFailed", {
          count: String(outcome.done),
          reason: tError(outcome.failure.code, outcome.failure.message)
        }),
        kind: "err"
      });
    }
    void refreshStatus();
    void load();
    onRefreshStatus?.();
    setPendingOp(null);
    setBusy(false);
  }, [path, api, busy, t2, refreshStatus, load, onRefreshStatus]);
  const generateMessage = (0, import_react3.useCallback)(async () => {
    if (!path || generating || busy) return;
    const target = path;
    setGenerating(true);
    setMessage({ text: t2("write.commit.generating"), kind: "ok" });
    let result;
    try {
      result = await api.generateCommitMessage(target);
    } catch (error) {
      result = { ok: false, error: { code: "internal", message: error instanceof Error ? error.message : String(error) } };
    }
    if (pathRef.current !== target) {
      setGenerating(false);
      return;
    }
    if (result.ok) {
      const text = result.value.message.trim();
      if (text !== "") {
        setCommitMsg(text);
        setMessage({ text: t2("write.commit.generated"), kind: "ok" });
      } else {
        setMessage({ text: t2("write.commit.failed", { reason: t2("op.failed") }), kind: "err" });
      }
    } else if (result.error.code === "empty-stage") {
      setMessage({ text: t2("write.commit.emptyStage"), kind: "err" });
    } else if (result.error.code === "no-model") {
      setMessage({ text: t2("write.commit.noModel"), kind: "err" });
    } else {
      setMessage({ text: t2("write.commit.failed", { reason: tError(result.error.code, result.error.message) }), kind: "err" });
    }
    setGenerating(false);
  }, [path, api, generating, busy, t2]);
  (0, import_react3.useEffect)(() => {
    const onSwitched = () => {
      void load();
    };
    window.addEventListener("dsh-git-panel:switched", onSwitched);
    return () => window.removeEventListener("dsh-git-panel:switched", onSwitched);
  }, [load]);
  (0, import_react3.useEffect)(() => {
    const measure = () => setWidth(Math.max(240, (document.querySelector("[data-git-panel-col]")?.clientWidth ?? 300) - 16));
    measure();
    const observer = new ResizeObserver(measure);
    const col = document.querySelector("[data-git-panel-col]");
    if (col) observer.observe(col);
    return () => observer.disconnect();
  }, []);
  if (!path) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-head", children: t2("panel.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-empty", children: t2("panel.empty") })
    ] });
  }
  const runOp = (0, import_react3.useCallback)(async (label, op, kind) => {
    setBusy(true);
    setPendingOp(kind ?? label);
    setMessage({ text: t2("panel.running", { label }), kind: "ok" });
    const result = await op();
    if (result.ok) {
      setMessage({ text: result.value.output || t2("op.done", { label }), kind: "ok" });
      await load();
    } else {
      let errMsg = tError(result.error.code, result.error.message || t2("panel.opFailed"));
      let showAuthForm = false;
      if (errMsg.includes("OAuth") || errMsg.includes("Authentication") || errMsg.includes("fatal: could not read Username") || errMsg.includes("terminal prompts disabled")) {
        errMsg = t2("panel.needCredential");
        showAuthForm = true;
      }
      setMessage({ text: errMsg, kind: "err", showAuthForm });
    }
    setPendingOp(null);
    setBusy(false);
  }, [load, t2]);
  const repoName = branches?.repo ?? "";
  const drawerSummary = (() => {
    if (stash === null || stash.files === 0) return "";
    return t2("write.stash.drawer", { count: String(stash.files), entries: String(stash.entries) });
  })();
  const pendingOpLabel = pendingOp === "pull" ? t2("op.pulling") : pendingOp === "push" ? t2("op.pushing") : pendingOp === "sync" ? t2("op.syncing") : pendingOp === "fetch" ? t2("op.fetching") : pendingOp !== null ? t2("panel.running", { label: pendingOp }) : null;
  const openMenu = (0, import_react3.useCallback)((event, row, isRemote) => {
    setMenu({
      x: Math.min(event.clientX, window.innerWidth - 190),
      y: Math.min(event.clientY, window.innerHeight - 180),
      row,
      isRemote,
      isCurrent: !isRemote && row.name === branches?.current
    });
    setMenuMode("main");
    setRenameValue(row.name);
  }, [branches?.current]);
  const activateLocal = (0, import_react3.useCallback)((branch) => {
    if (branch === branches?.current) {
      void runOp(t2("op.pull"), () => api.pull(path), "pull");
    } else {
      void runOp(t2("op.switch"), () => api.switchBranch(path, branch));
    }
  }, [branches?.current, runOp, api, path]);
  const activateRemote = (0, import_react3.useCallback)((branch) => {
    void runOp(t2("op.checkout"), () => api.switchBranch(path, branch));
  }, [runOp, api, path]);
  const closeMenu = () => setMenu(null);
  const confirmRename = async () => {
    if (!menu) return;
    const name = renameValue.trim();
    if (name === "" || name === menu.row.name) {
      closeMenu();
      return;
    }
    if (!/^[^\s~^:?*[\\]+$/.test(name) || name.startsWith("-")) {
      setMessage({ text: t2("error.invalidName", { name }), kind: "err" });
      return;
    }
    const current = menu.row.name;
    closeMenu();
    await runOp(t2("op.rename"), () => api.renameBranch(path, current, name));
  };
  const confirmDelete = async () => {
    if (!menu) return;
    const { row, isRemote } = menu;
    closeMenu();
    if (isRemote) {
      await runOp(t2("op.deleteRemote"), () => api.deleteRemoteBranch(path, row.name));
    } else {
      await runOp(t2("op.delete"), () => api.deleteBranch(path, row.name));
    }
  };
  const mergeInto = async () => {
    if (!menu) return;
    const branch = menu.row.name;
    closeMenu();
    await runOp(t2("op.merge", { branch }), () => api.mergeBranch(path, branch));
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t2("panel.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--muted)", fontWeight: 400, fontSize: 11 }, children: repoName }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "spacer" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsh-gp-btn", disabled: loading || busy, onClick: () => void load(), title: t2("op.refresh"), children: loading || busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-spinner", role: "status", "aria-label": busy && pendingOp === "pull" ? t2("op.pulling") : t2("op.refresh") }) : icon("refresh", 13) })
    ] }),
    busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-progress", role: "progressbar", "aria-label": pendingOpLabel ?? t2("op.refresh") }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-tabs", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `dsh-gp-tab${tab === "branches" ? " active" : ""}`, onClick: () => setTab("branches"), children: t2("tab.branches") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `dsh-gp-tab${tab === "graph" ? " active" : ""}`, onClick: () => setTab("graph"), children: t2("tab.graph") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-write", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-write-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-input-wrap", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "textarea",
            {
              ref: commitRef,
              className: "dsh-gp-input dsh-gp-textarea",
              rows: 1,
              value: commitMsg,
              placeholder: t2("write.commit.placeholder"),
              onChange: (event) => setCommitMsg(event.target.value),
              onKeyDown: (event) => {
                if (event.key === "Enter" && !event.shiftKey && commitMsg.trim() !== "") {
                  event.preventDefault();
                  void runWrite("commit");
                }
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: "dsh-gp-input-btn",
              disabled: busy || generating,
              "aria-label": t2("write.commit.generate"),
              ...tipProps(t2("write.commit.generate")),
              onClick: () => void generateMessage(),
              children: generating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-spinner", role: "status", "aria-label": t2("write.commit.generating") }) : icon("sparkles", 13)
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            className: "dsh-gp-btn",
            disabled: busy || commitMsg.trim() === "",
            onClick: () => void runWrite("commit"),
            children: t2("write.commit")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            className: "dsh-gp-btn",
            disabled: busy,
            onClick: () => void runWrite("push"),
            children: pendingOp === "push" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-spinner" }),
              " ",
              t2("op.pushing")
            ] }) : t2("write.push")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            className: "dsh-gp-btn",
            disabled: busy,
            onClick: () => void runWrite("sync"),
            children: pendingOp === "sync" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-spinner" }),
              " ",
              t2("op.syncing")
            ] }) : t2("write.sync")
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-write-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            className: "dsh-gp-btn",
            disabled: busy,
            ...tipProps(t2("write.stash.tip")),
            onClick: () => void runWrite("stash-push"),
            children: t2("write.stash")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            className: "dsh-gp-btn",
            disabled: busy,
            ...tipProps(t2("write.stashPop.tip")),
            onClick: () => void runWrite("stash-pop"),
            children: t2("write.stashPop")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            className: "dsh-gp-btn",
            disabled: busy,
            ...tipProps(t2("write.status.tip")),
            onClick: () => {
              void refreshStatus();
              void refreshStash();
            },
            children: t2("write.status")
          }
        ),
        drawerSummary !== "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-write-status", ...tipProps(drawerSummary), children: drawerSummary }) : null
      ] }),
      (() => {
        if (changes.length === 0) return null;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-changes", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-changes-title", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
              t2("changes.title"),
              " (",
              changes.length,
              ")"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "button",
              {
                type: "button",
                className: "dsh-gp-btn",
                title: conflicts.length > 0 ? t2("changes.sendConflictsToChat") : t2("changes.sendToChat"),
                style: { fontSize: 11, padding: "1px 6px" },
                onClick: () => {
                  let prompt;
                  if (conflicts.length > 0) {
                    const conflictList = conflicts.map((c) => `- \`${c.file}\` (CONFLICT)`).join("\n");
                    prompt = t2("prompt.conflicts", {
                      count: String(conflicts.length),
                      conflictList,
                      otherCount: String(changes.length - conflicts.length)
                    });
                  } else {
                    const fileLines = changes.map((c) => `- \`${c.code}\` ${c.file}`).join("\n");
                    prompt = t2("prompt.normal", { count: String(changes.length), fileList: fileLines });
                  }
                  if (injectTextToChatInput(prompt)) {
                    setMessage({ kind: "ok", text: t2("changes.sentSuccess") });
                  }
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-btn-ico", children: icon(conflicts.length > 0 ? "conflict" : "chat", 13) }),
                  conflicts.length > 0 ? t2("changes.sendConflictsToChat") : t2("changes.sendToChat")
                ]
              }
            )
          ] }),
          conflicts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-conflict-banner", children: [
            icon("conflict", 13),
            " ",
            t2("changes.conflicts", { count: String(conflicts.length) })
          ] }) : null,
          conflicts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-changes-group", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-changes-group-head", style: { color: "var(--danger)" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
              t2("changes.conflictsGroup"),
              " (",
              conflicts.length,
              ")"
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-changes-list", children: conflicts.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-changes-item", onClick: () => void loadDiff(c.file), children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChangeBadge, { code: c.code }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-changes-file", title: c.file, children: c.file })
            ] }, c.file)) })
          ] }) : null,
          staged.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-changes-group", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-changes-group-head", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                t2("changes.staged"),
                " (",
                staged.length,
                ")"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-group-actions", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                RowAction,
                {
                  icon: "minus",
                  label: t2("changes.unstageAll"),
                  onClick: (e) => {
                    e.stopPropagation();
                    void runBatchStage(staged.map((c) => c.file), "unstage");
                  }
                }
              ) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-changes-list", children: staged.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-changes-item", onClick: () => void loadDiff(c.file), children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChangeBadge, { code: c.code }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-changes-file", title: c.file, children: c.file }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                RowAction,
                {
                  icon: "copy",
                  label: t2("changes.copyPath"),
                  onClick: (e) => {
                    e.stopPropagation();
                    try {
                      navigator.clipboard.writeText(c.file);
                      setMessage({ kind: "ok", text: t2("changes.copyPathDone") });
                    } catch {
                    }
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                RowAction,
                {
                  icon: "chat",
                  label: t2("changes.fileToChat"),
                  onClick: (e) => {
                    e.stopPropagation();
                    const prompt = t2("prompt.stagedFile", { file: c.file });
                    if (injectTextToChatInput(prompt)) {
                      setMessage({ kind: "ok", text: t2("changes.sentSuccess") });
                    }
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                RowAction,
                {
                  icon: "minus",
                  label: t2("changes.unstage"),
                  onClick: (e) => {
                    e.stopPropagation();
                    void runWrite("unstage", c.file);
                  }
                }
              )
            ] }, c.file)) })
          ] }) : null,
          unstaged.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-changes-group", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-changes-group-head", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                t2("changes.unstaged"),
                " (",
                unstaged.length,
                ")"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-group-actions", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                RowAction,
                {
                  icon: "plus",
                  label: t2("changes.stageAll"),
                  onClick: (e) => {
                    e.stopPropagation();
                    void runBatchStage(unstaged.map((c) => c.file), "stage");
                  }
                }
              ) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-changes-list", children: unstaged.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "div",
              {
                className: "dsh-gp-changes-item",
                title: t2("changes.openFullDiff"),
                onClick: () => {
                  if (onOpenDiff?.(c.file) === true) return;
                  void loadDiff(c.file);
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChangeBadge, { code: c.code }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-changes-file", title: c.file, children: c.file }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    RowAction,
                    {
                      icon: "unified",
                      label: t2("changes.inlineDiff"),
                      onClick: (e) => {
                        e.stopPropagation();
                        void loadDiff(c.file);
                      }
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    RowAction,
                    {
                      icon: "copy",
                      label: t2("changes.copyPath"),
                      onClick: (e) => {
                        e.stopPropagation();
                        try {
                          navigator.clipboard.writeText(c.file);
                          setMessage({ kind: "ok", text: t2("changes.copyPathDone") });
                        } catch {
                        }
                      }
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    RowAction,
                    {
                      icon: "chat",
                      label: t2("changes.fileToChat"),
                      onClick: (e) => {
                        e.stopPropagation();
                        const prompt = t2("prompt.fileChange", { file: c.file });
                        if (injectTextToChatInput(prompt)) {
                          setMessage({ kind: "ok", text: t2("changes.sentSuccess") });
                        }
                      }
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    RowAction,
                    {
                      icon: "plus",
                      label: t2("changes.stage"),
                      onClick: (e) => {
                        e.stopPropagation();
                        void runWrite("stage", c.file);
                      }
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    RowAction,
                    {
                      icon: "undo",
                      danger: true,
                      label: t2("changes.discard"),
                      onClick: (e) => {
                        e.stopPropagation();
                        if (window.confirm(t2("changes.discardConfirm", { file: c.file }))) {
                          void runWrite("discard", `${c.file}|${c.code === "??" ? "untracked" : ""}`);
                        }
                      }
                    }
                  )
                ]
              },
              c.file
            )) })
          ] }) : null,
          diffState !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-changes-diff", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-changes-head", style: { display: "flex", alignItems: "center", gap: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: [
                t2("changes.diff"),
                ": ",
                diffState.file
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                "button",
                {
                  type: "button",
                  className: "dsh-gp-btn",
                  title: t2("changes.diffToChat"),
                  style: { marginLeft: "auto", fontSize: 11, padding: "0 6px", whiteSpace: "nowrap" },
                  onClick: () => {
                    const prompt = t2("prompt.reviewDiff", { file: diffState.file, diff: diffState.content.slice(0, 8e3) });
                    if (injectTextToChatInput(prompt)) {
                      setMessage({ kind: "ok", text: t2("changes.sentSuccess") });
                    }
                  },
                  children: [
                    icon("chat", 13),
                    " ",
                    t2("changes.diffToChat")
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  type: "button",
                  className: "dsh-gp-btn",
                  onClick: () => setDiffState(null),
                  style: { fontSize: 11, padding: "0 6px" },
                  children: icon("close", 13)
                }
              )
            ] }),
            diffState.busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-changes-empty", children: "\u2026" }) : diffState.content === "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-changes-empty", children: t2("changes.empty") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-changes-pre", children: (() => {
              let oldNum = 0;
              let newNum = 0;
              return diffState.content.slice(0, 3e4).split("\n").map((line, idx) => {
                let kind = "";
                let numStr = "";
                if (line.startsWith("@@")) {
                  kind = "hunk";
                  const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
                  if (m) {
                    oldNum = parseInt(m[1], 10);
                    newNum = parseInt(m[2], 10);
                  }
                  numStr = "@@";
                } else if (line.startsWith("+") && !line.startsWith("+++")) {
                  kind = "add";
                  numStr = String(newNum++);
                } else if (line.startsWith("-") && !line.startsWith("---")) {
                  kind = "del";
                  numStr = String(oldNum++);
                } else if (line.startsWith(" ") || line === "") {
                  numStr = String(newNum++);
                  oldNum++;
                }
                return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `dsh-gp-diff-line ${kind}`, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-diff-line-num", children: numStr }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-diff-line-text", children: line || " " })
                ] }, idx);
              });
            })() })
          ] }) : null
        ] });
      })()
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-body", children: [
      loading && !branches && !graph ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-empty", children: t2("loading") }) : null,
      !loading && message && !branches && !graph ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-warn", children: message.text }) : null,
      message && (branches || graph) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `dsh-gp-msg ${message.kind}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-msg-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsh-gp-msg-text", children: [
            busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-spinner", "aria-hidden": "true" }) : null,
            message.text
          ] }),
          busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "button",
            {
              type: "button",
              className: "dsh-gp-cancel",
              title: t2("panel.cancelOp"),
              "aria-label": t2("panel.cancelOp"),
              onClick: () => {
                void api.cancel(path);
                setPendingOp(null);
                setBusy(false);
                setMessage({ text: t2("panel.cancelled"), kind: "ok" });
              },
              children: [
                icon("close", 12),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t2("menu.cancel") })
              ]
            }
          ) : null
        ] }),
        message.showAuthForm ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
          background: "rgba(128,128,128,0.12)",
          padding: 8,
          borderRadius: 6,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginTop: 4
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 5, fontWeight: 600, fontSize: 11 }, children: [
            icon("key", 13),
            t2("auth.title")
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              id: "dsh-git-auth-user",
              className: "dsh-gp-input",
              placeholder: t2("auth.usernamePlaceholder"),
              defaultValue: "jaden.tang"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              id: "dsh-git-auth-pass",
              type: "password",
              className: "dsh-gp-input",
              placeholder: t2("auth.passwordPlaceholder")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 2 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "button",
              {
                type: "button",
                className: "dsh-gp-btn",
                onClick: async () => {
                  const u = document.getElementById("dsh-git-auth-user")?.value.trim();
                  const p = document.getElementById("dsh-git-auth-pass")?.value.trim();
                  if (!u || !p) {
                    alert(t2("auth.fillBoth"));
                    return;
                  }
                  setMessage({ text: t2("auth.saving"), kind: "ok" });
                  const res = await api.setCredential(path, "gitlab.sjfood.us", u, p);
                  if (res.ok) {
                    setMessage({ text: t2("auth.saved"), kind: "ok" });
                    void runOp(t2("op.pull"), () => api.pull(path), "pull");
                  } else {
                    setMessage({ text: t2("auth.saveFailed", { reason: tError(res.error?.code, res.error?.message ?? String(res)) }), kind: "err" });
                  }
                },
                children: [
                  icon("save", 13),
                  " ",
                  t2("auth.saveAndRetry")
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                type: "button",
                className: "dsh-gp-btn",
                onClick: () => setMessage(null),
                children: t2("menu.cancel")
              }
            )
          ] })
        ] }) : null
      ] }) : null,
      tab === "branches" && branches ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: "dsh-gp-branch-search",
            value: branchSearch,
            placeholder: t2("branches.search"),
            onChange: (e) => setBranchSearch(e.target.value)
          }
        ),
        (() => {
          const q = branchSearch.trim().toLowerCase();
          const match = (name) => q === "" || name.toLowerCase().includes(q);
          const localFiltered = branches.local.filter((r) => match(r.name) || r.subject && r.subject.toLowerCase().includes(q));
          const remoteFiltered = branches.remote.filter((r) => match(r.name) || r.subject && r.subject.toLowerCase().includes(q));
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-section", children: [
              t2("section.local"),
              " (",
              localFiltered.length,
              ")"
            ] }),
            localFiltered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-empty", children: t2("empty.local") }) : null,
            localFiltered.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              BranchRowView,
              {
                row,
                isRemote: false,
                current: branches.current,
                busy,
                onActivate: activateLocal,
                onPull: () => void runOp(t2("op.pull"), () => api.pull(path), "pull"),
                onContextMenu: openMenu
              },
              row.name
            )),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-section", children: [
              t2("section.remote"),
              " (",
              remoteFiltered.length,
              ")"
            ] }),
            remoteFiltered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-empty", children: t2("empty.remote") }) : null,
            remoteFiltered.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              BranchRowView,
              {
                row,
                isRemote: true,
                current: branches.current,
                busy,
                onActivate: activateRemote,
                onContextMenu: openMenu
              },
              row.name
            ))
          ] });
        })(),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsh-gp-btn", disabled: busy, onClick: () => void runOp(t2("fetch.all"), () => api.fetchAll(path), "fetch"), children: t2("fetch.all") }) })
      ] }) : null,
      tab === "graph" && graph ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        GraphViewComponent,
        {
          graph,
          width,
          onCherryPick: (sha) => void runOp(t2("op.cherryPick"), () => api.cherryPick(path, sha)),
          onRevert: (sha) => void runOp(t2("op.revert"), () => api.revertCommit(path, sha))
        }
      ) : null
    ] }),
    menu ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          className: "dsh-gp-menu-backdrop",
          onClick: closeMenu,
          onContextMenu: (event) => {
            event.preventDefault();
            closeMenu();
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-menu", style: { left: menu.x, top: menu.y }, children: menuMode === "rename" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-menu-title", children: t2("menu.title.rename", { name: menu.row.name }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: "dsh-gp-menu-input",
            value: renameValue,
            autoFocus: true,
            onChange: (event) => setRenameValue(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Enter") void confirmRename();
              if (event.key === "Escape") setMenuMode("main");
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-menu-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsh-gp-btn", onClick: () => void confirmRename(), children: t2("menu.confirm") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsh-gp-btn", onClick: () => setMenuMode("main"), children: t2("menu.cancel") })
        ] })
      ] }) : menuMode === "confirm-delete" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-menu-title", children: menu.isRemote ? t2("menu.title.deleteRemote", { name: menu.row.name }) : t2("menu.title.delete", { name: menu.row.name }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gp-menu-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              className: "dsh-gp-btn",
              style: { color: "var(--danger)" },
              onClick: () => void confirmDelete(),
              children: t2("menu.delete")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsh-gp-btn", onClick: () => setMenuMode("main"), children: t2("menu.cancel") })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-menu-item", onClick: () => {
          if (navigator?.clipboard?.writeText) {
            void navigator.clipboard.writeText(menu.row.name);
            setMessage({ text: `${t2("menu.copyName.done")}: ${menu.row.name}`, kind: "ok" });
          }
          closeMenu();
        }, children: t2("menu.copyName") }),
        menu.isCurrent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            className: `dsh-gp-menu-item ${busy ? "disabled" : ""}`,
            style: busy ? { opacity: 0.4, cursor: "not-allowed", pointerEvents: "none" } : void 0,
            onClick: () => {
              if (busy) return;
              closeMenu();
              void runOp(t2("op.pull"), () => api.pull(path), "pull");
            },
            children: busy && pendingOp === "pull" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-spinner" }),
              " ",
              t2("op.pulling")
            ] }) : busy ? t2("menu.busySyncing") : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              menuIcon("arrowDown"),
              t2("menu.pull")
            ] })
          }
        ) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            className: `dsh-gp-menu-item ${busy ? "disabled" : ""}`,
            style: busy ? { opacity: 0.4, cursor: "not-allowed", pointerEvents: "none" } : void 0,
            onClick: () => {
              if (busy) return;
              closeMenu();
              void runOp(t2("fetch.all"), () => api.fetchAll(path), "fetch");
            },
            children: busy && pendingOp === "fetch" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-gp-spinner" }),
              " ",
              t2("op.fetching")
            ] }) : busy ? t2("menu.busySyncing") : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              menuIcon("fetch"),
              t2("menu.fetchAll")
            ] })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-menu-item", onClick: () => setMenuMode("rename"), children: t2("menu.rename") }),
        !menu.isCurrent && !menu.isRemote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-menu-item danger", onClick: () => setMenuMode("confirm-delete"), children: t2("menu.delete") }) : null,
        menu.isRemote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-menu-item danger", onClick: () => setMenuMode("confirm-delete"), children: t2("menu.deleteRemote") }) : null,
        !menu.isCurrent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gp-menu-item", onClick: () => void mergeInto(), children: t2("menu.merge") }) : null
      ] }) })
    ] }) : null
  ] });
}

// src/client/GitTab.tsx
function readPath(sessions) {
  if (!sessions) return "";
  const snapshot = sessions.list.getSnapshot();
  const sessionId = snapshot.current;
  const cwd = sessionId === void 0 ? void 0 : snapshot.byId[sessionId]?.cwd;
  return typeof cwd === "string" ? cwd : "";
}
function addressOf(sessionId, relative) {
  const encoded = relative.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  return `dsh-resource://file/session/${encodeURIComponent(sessionId)}/${encoded}`;
}
function GitTabBody(props) {
  const { sessions, statusCache } = props;
  const [api] = (0, import_react4.useState)(() => props.api ?? new GitPanelApi());
  const [path, setPath] = (0, import_react4.useState)(() => props.path ?? readPath(sessions));
  const info = props.useTabInfo?.();
  (0, import_react4.useEffect)(() => {
    if (!sessions) return void 0;
    const update = () => setPath(readPath(sessions));
    update();
    return sessions.list.subscribe(update);
  }, [sessions]);
  const openDiff = (0, import_react4.useCallback)((relative) => {
    const snapshot = sessions?.list.getSnapshot();
    const sessionId = snapshot?.current;
    if (sessionId === void 0 || relative === "") return false;
    try {
      info?.tab.actions.openResource(addressOf(sessionId, relative), { kind: "git-diff" });
      return true;
    } catch (error) {
      console.warn("dsh-git-panel: open diff failed", error);
      return false;
    }
  }, [info, sessions]);
  const refreshStatus = (0, import_react4.useCallback)(() => {
    if (statusCache !== void 0 && path !== "") void statusCache.ensure(path, true);
  }, [statusCache, path]);
  return (0, import_react4.createElement)(GitPanel, { path, api, onOpenDiff: openDiff, onRefreshStatus: refreshStatus });
}

// src/client/GitDiffView.tsx
var import_react5 = require("react");

// src/client/diff.ts
var LCS_CELL_CAP = 4e6;
function splitLines(text) {
  if (text === "") return [];
  return text.replace(/\r\n?/gu, "\n").split("\n");
}
function diffRows(before, after) {
  const left = splitLines(before);
  const right = splitLines(after);
  let head = 0;
  while (head < left.length && head < right.length && left[head] === right[head]) head += 1;
  let tail = 0;
  while (tail < left.length - head && tail < right.length - head && left[left.length - 1 - tail] === right[right.length - 1 - tail]) tail += 1;
  const rows = [];
  for (let index = 0; index < head; index += 1) {
    rows.push({
      kind: "equal",
      left: { num: index + 1, text: left[index] ?? "" },
      right: { num: index + 1, text: right[index] ?? "" }
    });
  }
  const leftMiddle = left.slice(head, left.length - tail);
  const rightMiddle = right.slice(head, right.length - tail);
  rows.push(...middleRows(leftMiddle, rightMiddle, head));
  for (let index = 0; index < tail; index += 1) {
    const leftNum = left.length - tail + index + 1;
    const rightNum = right.length - tail + index + 1;
    rows.push({
      kind: "equal",
      left: { num: leftNum, text: left[leftNum - 1] ?? "" },
      right: { num: rightNum, text: right[rightNum - 1] ?? "" }
    });
  }
  return rows;
}
function middleRows(left, right, offset) {
  if (left.length === 0 && right.length === 0) return [];
  if (left.length === 0) {
    return right.map((text, index2) => ({ kind: "ins", right: { num: offset + index2 + 1, text } }));
  }
  if (right.length === 0) {
    return left.map((text, index2) => ({ kind: "del", left: { num: offset + index2 + 1, text } }));
  }
  const script = left.length * right.length <= LCS_CELL_CAP ? lcsScript(left, right) : pairedScript(left, right);
  const rows = [];
  let index = 0;
  while (index < script.length) {
    const step = script[index];
    if (step === void 0) break;
    if (step.kind === "equal") {
      const leftLine = step.left ?? 0;
      const rightLine = step.right ?? 0;
      rows.push({
        kind: "equal",
        left: { num: offset + leftLine + 1, text: left[leftLine] ?? "" },
        right: { num: offset + rightLine + 1, text: right[rightLine] ?? "" }
      });
      index += 1;
      continue;
    }
    const dels = [];
    const inss = [];
    while (index < script.length && script[index]?.kind === "del") {
      dels.push(script[index]);
      index += 1;
    }
    while (index < script.length && script[index]?.kind === "ins") {
      inss.push(script[index]);
      index += 1;
    }
    const span = Math.max(dels.length, inss.length);
    for (let at = 0; at < span; at += 1) {
      const del = dels[at];
      const ins = inss[at];
      const leftLine = del?.left;
      const rightLine = ins?.right;
      rows.push({
        kind: leftLine !== void 0 && rightLine !== void 0 ? "change" : leftLine !== void 0 ? "del" : "ins",
        ...leftLine === void 0 ? {} : { left: { num: offset + leftLine + 1, text: left[leftLine] ?? "" } },
        ...rightLine === void 0 ? {} : { right: { num: offset + rightLine + 1, text: right[rightLine] ?? "" } }
      });
    }
  }
  return rows;
}
function lcsScript(left, right) {
  const rows = left.length;
  const columns = right.length;
  const width = columns + 1;
  const table = new Int32Array((rows + 1) * width);
  for (let i2 = rows - 1; i2 >= 0; i2 -= 1) {
    for (let j2 = columns - 1; j2 >= 0; j2 -= 1) {
      table[i2 * width + j2] = left[i2] === right[j2] ? (table[(i2 + 1) * width + j2 + 1] ?? 0) + 1 : Math.max(table[(i2 + 1) * width + j2] ?? 0, table[i2 * width + j2 + 1] ?? 0);
    }
  }
  const script = [];
  let i = 0;
  let j = 0;
  while (i < rows && j < columns) {
    if (left[i] === right[j]) {
      script.push({ kind: "equal", left: i, right: j });
      i += 1;
      j += 1;
    } else if ((table[(i + 1) * width + j] ?? 0) >= (table[i * width + j + 1] ?? 0)) {
      script.push({ kind: "del", left: i });
      i += 1;
    } else {
      script.push({ kind: "ins", right: j });
      j += 1;
    }
  }
  while (i < rows) {
    script.push({ kind: "del", left: i });
    i += 1;
  }
  while (j < columns) {
    script.push({ kind: "ins", right: j });
    j += 1;
  }
  return script;
}
function pairedScript(left, right) {
  const script = [];
  let i = 0;
  let j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) {
      script.push({ kind: "equal", left: i, right: j });
      i += 1;
      j += 1;
      continue;
    }
    if (i < left.length) {
      script.push({ kind: "del", left: i });
      i += 1;
    }
    if (j < right.length) {
      script.push({ kind: "ins", right: j });
      j += 1;
    }
  }
  return script;
}
function diffStat(rows) {
  let added = 0;
  let removed = 0;
  for (const row of rows) {
    if (row.kind === "equal") continue;
    if (row.right !== void 0) added += 1;
    if (row.left !== void 0) removed += 1;
  }
  return { added, removed };
}

// src/client/refs.ts
var FILE_PREFIX = "dsh-resource://file/";
function parseFileAddress(address) {
  if (typeof address !== "string" || !address.startsWith(FILE_PREFIX)) return void 0;
  const cut = address.search(/[?#]/u);
  const rest = address.slice(FILE_PREFIX.length, cut === -1 ? void 0 : cut);
  const segments = rest.split("/");
  const scope = segments.shift();
  if (scope !== "session") return void 0;
  const session = segments.shift();
  if (session === void 0 || session === "" || segments.length === 0) return void 0;
  try {
    return {
      sessionId: decodeURIComponent(session),
      path: segments.map((segment) => decodeURIComponent(segment)).join("/")
    };
  } catch {
    return void 0;
  }
}
function basenameOf(path) {
  const normalized = path.replace(/\\/gu, "/").replace(/\/+$/u, "");
  const at = normalized.lastIndexOf("/");
  return at === -1 ? normalized : normalized.slice(at + 1);
}

// src/client/GitDiffView.tsx
var CONTEXT_LINES = 3;
function readCwd(sessions, sessionId) {
  if (!sessions) return "";
  const snapshot = sessions.list.getSnapshot();
  const cwd = snapshot.byId[sessionId]?.cwd;
  return typeof cwd === "string" ? cwd : "";
}
function parseConflicts(text) {
  const lines = text.replace(/\r\n?/gu, "\n").split("\n");
  const blocks = [];
  let start = -1;
  let middle = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (line.startsWith("<<<<<<<")) {
      start = index;
      middle = -1;
      continue;
    }
    if (start !== -1 && middle === -1 && line.startsWith("=======")) {
      middle = index;
      continue;
    }
    if (start !== -1 && middle !== -1 && line.startsWith(">>>>>>>")) {
      blocks.push({
        start,
        middle,
        end: index,
        ours: lines.slice(start + 1, middle).join("\n"),
        theirs: lines.slice(middle + 1, index).join("\n"),
        label: line.slice(7).trim() || "incoming"
      });
      start = -1;
      middle = -1;
    }
  }
  return { blocks, lines };
}
function applyResolution(text, block, choice) {
  const { lines } = parseConflicts(text);
  const ours = block.ours === "" ? [] : block.ours.split("\n");
  const theirs = block.theirs === "" ? [] : block.theirs.split("\n");
  const replacement = choice === "ours" ? ours : choice === "theirs" ? theirs : [...ours, ...theirs];
  const next = [...lines.slice(0, block.start), ...replacement, ...lines.slice(block.end + 1)];
  return next.join("\n");
}
function buildDisplay(rows, expanded) {
  const items = [];
  let index = 0;
  while (index < rows.length) {
    const row = rows[index];
    if (row === void 0) break;
    if (row.kind !== "equal") {
      items.push({ kind: "row", row, key: `r${index}` });
      index += 1;
      continue;
    }
    let end = index;
    while (end < rows.length && rows[end]?.kind === "equal") end += 1;
    const count = end - index;
    if (count <= CONTEXT_LINES * 2 + 1 || expanded.has(index)) {
      for (let at = index; at < end; at += 1) {
        const held = rows[at];
        if (held !== void 0) items.push({ kind: "row", row: held, key: `r${at}` });
      }
    } else {
      for (let at = index; at < index + CONTEXT_LINES; at += 1) {
        const held = rows[at];
        if (held !== void 0) items.push({ kind: "row", row: held, key: `r${at}` });
      }
      items.push({ kind: "gap", from: index + CONTEXT_LINES, to: end - CONTEXT_LINES, key: `g${index}` });
      for (let at = end - CONTEXT_LINES; at < end; at += 1) {
        const held = rows[at];
        if (held !== void 0) items.push({ kind: "row", row: held, key: `r${at}` });
      }
    }
    index = end;
  }
  return items;
}
var styleReady = false;
function ensureStyle2() {
  if (styleReady || typeof document === "undefined") return;
  styleReady = true;
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-git-panel-diff";
  tag.textContent = STYLE2;
  document.head.appendChild(tag);
}
var GLYPH_MAP = {
  file: "file",
  split: "split",
  unified: "unified",
  edit: "edit",
  conflict: "conflict",
  wrap: "wrap",
  fold: "fold",
  code: "code",
  stage: "plus",
  save: "save",
  check: "check",
  both: "both"
};
function glyph(kind) {
  return icon(GLYPH_MAP[kind] ?? "info", 15);
}
function iconButton(id, label, active, onClick, kind, danger = false) {
  return (0, import_react5.createElement)("button", {
    type: "button",
    "data-gd-btn": id,
    className: `dsh-gd-ico-btn${active ? " on" : ""}${danger ? " danger" : ""}`,
    title: label,
    "aria-label": label,
    "aria-pressed": active,
    onClick
  }, glyph(kind));
}
function GitDiffView(props) {
  useT();
  ensureStyle2();
  const info = props.useTabInfo?.();
  const tab = info?.tab;
  const fromDocumentSlot = typeof props.resourceAddress === "string" && props.resourceAddress !== "";
  const address = fromDocumentSlot ? props.resourceAddress ?? "" : typeof tab?.contentId === "string" ? tab.contentId : "";
  const parsed = (0, import_react5.useMemo)(() => parseFileAddress(address), [address]);
  const sessionId = parsed?.sessionId ?? "";
  const file = parsed?.path ?? "";
  const [api] = (0, import_react5.useState)(() => props.api ?? new GitPanelApi());
  const [cwd, setCwd] = (0, import_react5.useState)(() => readCwd(props.sessions, sessionId));
  const [head, setHead] = (0, import_react5.useState)("");
  const [working, setWorking] = (0, import_react5.useState)("");
  const [baseline, setBaseline] = (0, import_react5.useState)("");
  const [status, setStatus] = (0, import_react5.useState)(void 0);
  const [isNew, setIsNew] = (0, import_react5.useState)(false);
  const [missing, setMissing] = (0, import_react5.useState)(false);
  const [binary, setBinary] = (0, import_react5.useState)(false);
  const [error, setError] = (0, import_react5.useState)(null);
  const [loading, setLoading] = (0, import_react5.useState)(true);
  const [mode, setMode] = (0, import_react5.useState)("split");
  const [wrap, setWrap] = (0, import_react5.useState)(true);
  const [collapse, setCollapse] = (0, import_react5.useState)(true);
  const [expanded, setExpanded] = (0, import_react5.useState)(() => /* @__PURE__ */ new Set());
  const [busy, setBusy] = (0, import_react5.useState)(false);
  const [note, setNote] = (0, import_react5.useState)(null);
  const [fontSize, setFontSize] = (0, import_react5.useState)(12);
  const scrollRef = (0, import_react5.useRef)(null);
  (0, import_react5.useEffect)(() => {
    if (!props.sessions) return void 0;
    const update = () => setCwd(readCwd(props.sessions, sessionId));
    update();
    return props.sessions.list.subscribe(update);
  }, [props.sessions, sessionId]);
  const load = (0, import_react5.useCallback)(async () => {
    if (cwd === "" || file === "") return;
    setLoading(true);
    setError(null);
    try {
      const [headResult, workResult, statusResult] = await Promise.all([
        api.showHead(cwd, file),
        api.readFile(cwd, file),
        api.fileStatus(cwd)
      ]);
      const headOk = headResult.ok && headResult.value.ok;
      setHead(headOk ? headResult.value.output : "");
      setIsNew(!headOk);
      if (workResult.ok && workResult.value.ok) {
        const value = workResult.value;
        setWorking(value.text);
        setBinary(value.binary);
        setMissing(value.missing === true);
      } else {
        setWorking("");
        setError(workResult.ok ? tError(workResult.value.error?.code, workResult.value.error?.message ?? t("diff.loadFailed")) : tError(workResult.error.code, workResult.error.message));
      }
      if (statusResult.ok) {
        const entry = statusResult.value.entries.find((candidate) => candidate.path === file);
        setStatus(entry === void 0 ? void 0 : statusLetter(entry.code));
      } else {
        setStatus(void 0);
      }
    } finally {
      setLoading(false);
    }
  }, [api, cwd, file]);
  (0, import_react5.useEffect)(() => {
    void load();
  }, [load]);
  (0, import_react5.useEffect)(() => {
    setBaseline(working);
  }, [loading]);
  const rows = (0, import_react5.useMemo)(() => diffRows(head, working), [head, working]);
  const stat = (0, import_react5.useMemo)(() => diffStat(rows), [rows]);
  const conflicts = (0, import_react5.useMemo)(() => parseConflicts(working).blocks, [working]);
  const dirty = working !== baseline;
  const display = (0, import_react5.useMemo)(
    () => collapse ? buildDisplay(rows, expanded) : rows.map((row, index) => ({ kind: "row", row, key: `r${index}` })),
    [rows, collapse, expanded]
  );
  (0, import_react5.useEffect)(() => {
    if (conflicts.length > 0) setMode("conflict");
  }, [conflicts.length]);
  const save = (0, import_react5.useCallback)(async () => {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const result = await api.saveFile(cwd, file, working);
      if (result.ok && result.value.ok) {
        setBaseline(working);
        setNote({ text: t("diff.saved"), kind: "ok" });
        await load();
      } else {
        setNote({ text: result.ok ? tError(result.value.error?.code, result.value.error?.message ?? t("diff.saveFailed")) : tError(result.error.code, result.error.message), kind: "err" });
      }
    } finally {
      setBusy(false);
    }
  }, [api, busy, cwd, file, load, working]);
  const stage = (0, import_react5.useCallback)(async () => {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const result = await api.stageFile(cwd, file);
      setNote(result.ok && result.value.ok ? { text: t("diff.staged"), kind: "ok" } : { text: result.ok ? tError(result.value.error?.code, result.value.error?.message ?? t("diff.stageFailed")) : tError(result.error.code, result.error.message), kind: "err" });
    } finally {
      setBusy(false);
    }
  }, [api, busy, cwd, file]);
  const openSource = (0, import_react5.useCallback)(() => {
    try {
      if (props.sidebarRight && typeof props.sidebarRight.openResource === "function") {
        props.sidebarRight.openResource(address, {
          kind: "text",
          ...tab?.id ? { replaceTab: tab.id } : {}
        });
      } else if (tab?.actions) {
        tab.actions.openResource(address, { replaceTab: true });
      }
    } catch (openError) {
      setNote({ text: openError instanceof Error ? openError.message : t("diff.openFailed"), kind: "err" });
    }
  }, [address, props.sidebarRight, tab]);
  const color = status === void 0 ? void 0 : STATUS_COLORS[status];
  const name = basenameOf(file);
  return (0, import_react5.createElement)(
    "div",
    { className: "dsh-gd" },
    (0, import_react5.createElement)(
      "div",
      { className: "dsh-gd-head" },
      // ---- 左：身份区（文件名 / 状态 / 完整路径 / 增删统计）----
      (0, import_react5.createElement)(
        "div",
        { className: "dsh-gd-id" },
        (0, import_react5.createElement)("span", { className: "dsh-gd-glyph", "aria-hidden": "true" }, glyph("file")),
        (0, import_react5.createElement)("span", { className: "dsh-gd-name", title: file }, name),
        status !== void 0 && (0, import_react5.createElement)("span", {
          className: "dsh-gd-badge",
          style: { color, borderColor: `${color}66`, background: `${color}1f` },
          title: t("diff.gitStatus", { status })
        }, status),
        isNew && (0, import_react5.createElement)("span", { className: "dsh-gd-tag", title: t("diff.notInHead") }, t("diff.tagNew")),
        (0, import_react5.createElement)("span", { className: "dsh-gd-path", title: file }, file),
        (0, import_react5.createElement)(
          "span",
          { className: "dsh-gd-stat" },
          (0, import_react5.createElement)("span", { className: "dsh-gd-add", title: t("diff.linesAdded", { count: String(stat.added) }) }, `+${stat.added}`),
          (0, import_react5.createElement)("span", { className: "dsh-gd-del", title: t("diff.linesRemoved", { count: String(stat.removed) }) }, `\u2212${stat.removed}`)
        )
      ),
      (0, import_react5.createElement)("span", { className: "dsh-gd-spacer" }),
      // ---- 右：控件区（视图 / 选项 / 动作）----
      (0, import_react5.createElement)(
        "div",
        { className: "dsh-gd-tools" },
        (0, import_react5.createElement)(
          "div",
          { className: "dsh-gd-seg", role: "group", "aria-label": t("diff.viewSwitch") },
          iconButton("dsh-gd-split", t("diff.split"), mode === "split", () => setMode("split"), "split"),
          iconButton("dsh-gd-unified", t("diff.unified"), mode === "unified", () => setMode("unified"), "unified"),
          iconButton("dsh-gd-edit", t("diff.edit"), mode === "edit", () => setMode("edit"), "edit"),
          conflicts.length > 0 && iconButton(
            "dsh-gd-conflict",
            t("diff.resolveConflicts", { count: String(conflicts.length) }),
            mode === "conflict",
            () => setMode("conflict"),
            "conflict",
            true
          )
        ),
        (0, import_react5.createElement)("span", { className: "dsh-gd-sep", "aria-hidden": "true" }),
        (0, import_react5.createElement)(
          "div",
          { className: "dsh-gd-seg", role: "group", "aria-label": t("diff.displayOptions") },
          iconButton("dsh-gd-wrap", t("diff.wrap"), wrap, () => setWrap((value) => !value), "wrap"),
          iconButton("dsh-gd-fold", t("diff.fold"), collapse, () => setCollapse((value) => !value), "fold")
        ),
        (0, import_react5.createElement)(
          "div",
          { className: "dsh-gd-stepper", role: "group", "aria-label": t("diff.fontSizeGroup") },
          (0, import_react5.createElement)("button", {
            type: "button",
            className: "dsh-gd-step",
            title: t("diff.fontSmaller"),
            "aria-label": t("diff.fontSmaller"),
            onClick: () => setFontSize((value) => Math.max(10, value - 1))
          }, "A\u2212"),
          (0, import_react5.createElement)("span", { className: "dsh-gd-size", title: t("diff.fontCurrent", { size: String(fontSize) }) }, String(fontSize)),
          (0, import_react5.createElement)("button", {
            type: "button",
            className: "dsh-gd-step",
            title: t("diff.fontLarger"),
            "aria-label": t("diff.fontLarger"),
            onClick: () => setFontSize((value) => Math.min(20, value + 1))
          }, "A+")
        ),
        (0, import_react5.createElement)("span", { className: "dsh-gd-sep", "aria-hidden": "true" }),
        (0, import_react5.createElement)(
          "div",
          { className: "dsh-gd-actions" },
          (0, import_react5.createElement)("button", {
            type: "button",
            "data-gd-btn": "source",
            className: "dsh-gd-btn",
            title: t("diff.openOfficial"),
            onClick: openSource
          }, glyph("code"), (0, import_react5.createElement)("span", null, t("diff.officialPreview"))),
          (0, import_react5.createElement)("button", {
            type: "button",
            className: "dsh-gd-btn",
            title: t("diff.stageFile"),
            disabled: busy,
            onClick: () => void stage()
          }, glyph("stage"), (0, import_react5.createElement)("span", null, t("diff.stage"))),
          (0, import_react5.createElement)("button", {
            type: "button",
            "data-gd-btn": "save",
            className: `dsh-gd-btn${dirty ? " primary dirty" : " synced"}`,
            title: dirty ? t("diff.saveToWorkspace") : t("diff.inSync"),
            disabled: busy || !dirty,
            onClick: () => void save()
          }, glyph(dirty ? "save" : "check"), (0, import_react5.createElement)("span", null, busy ? t("diff.processing") : dirty ? t("diff.save") : t("diff.synced")))
        )
      )
    ),
    (note !== null || error !== null || binary || missing || isNew) && (0, import_react5.createElement)(
      "div",
      { className: "dsh-gd-notes" },
      error !== null && (0, import_react5.createElement)("span", { className: "dsh-gd-note err" }, error),
      binary && (0, import_react5.createElement)("span", { className: "dsh-gd-note" }, t("diff.binary")),
      missing && (0, import_react5.createElement)("span", { className: "dsh-gd-note" }, t("diff.missing")),
      isNew && (0, import_react5.createElement)("span", { className: "dsh-gd-note" }, t("diff.newFile")),
      note !== null && (0, import_react5.createElement)("span", { className: `dsh-gd-note ${note.kind}` }, note.text)
    ),
    (0, import_react5.createElement)(
      "div",
      { className: "dsh-gd-body", ref: scrollRef },
      loading ? (0, import_react5.createElement)("div", { className: "dsh-gd-empty" }, t("diff.loading")) : mode === "conflict" ? renderConflicts(conflicts, working, setWorking, setNote) : mode === "edit" ? (0, import_react5.createElement)("textarea", {
        className: "dsh-gd-editor",
        style: { fontSize: `${fontSize}px`, whiteSpace: wrap ? "pre-wrap" : "pre" },
        spellCheck: false,
        value: working,
        onChange: (event) => setWorking(event.target.value)
      }) : (0, import_react5.createElement)(
        "div",
        { className: "dsh-gd-scroll" },
        (0, import_react5.createElement)(
          "div",
          {
            className: `dsh-gd-rows${wrap ? " wrap" : ""}${mode === "unified" ? " unified" : ""}`,
            style: { fontSize: `${fontSize}px` }
          },
          display.map(
            (item) => item.kind === "gap" ? (0, import_react5.createElement)("div", {
              key: item.key,
              className: "dsh-gd-gap",
              onClick: () => setExpanded((held) => /* @__PURE__ */ new Set([...held, item.from - CONTEXT_LINES])),
              title: t("diff.expandBlock")
            }, t("diff.expandLines", { count: String(item.to - item.from) })) : mode === "unified" ? renderUnifiedRow(item.row, item.key) : renderSplitRow(item.row, item.key)
          )
        )
      )
    )
  );
}
function renderSplitRow(row, key) {
  return (0, import_react5.createElement)(
    "div",
    { className: `dsh-gd-row ${row.kind}`, key },
    (0, import_react5.createElement)(
      "div",
      { className: `dsh-gd-cell left ${row.kind}` },
      (0, import_react5.createElement)("span", { className: "dsh-gd-num" }, row.left === void 0 ? "" : String(row.left.num)),
      (0, import_react5.createElement)("span", { className: "dsh-gd-txt", title: row.left?.text }, row.left?.text ?? "")
    ),
    (0, import_react5.createElement)(
      "div",
      { className: `dsh-gd-cell right ${row.kind}` },
      (0, import_react5.createElement)("span", { className: "dsh-gd-num" }, row.right === void 0 ? "" : String(row.right.num)),
      (0, import_react5.createElement)("span", { className: "dsh-gd-txt", title: row.right?.text }, row.right?.text ?? "")
    )
  );
}
function renderUnifiedRow(row, key) {
  const text = row.kind === "del" ? row.left?.text : row.right?.text ?? row.left?.text;
  const num = row.kind === "del" ? row.left?.num : row.right?.num ?? row.left?.num;
  const marker = row.kind === "ins" ? "+" : row.kind === "del" ? "-" : row.kind === "change" ? "\xB1" : " ";
  return (0, import_react5.createElement)(
    "div",
    { className: `dsh-gd-row unified ${row.kind}`, key },
    (0, import_react5.createElement)("span", { className: "dsh-gd-marker" }, marker),
    (0, import_react5.createElement)("span", { className: "dsh-gd-num" }, num === void 0 ? "" : String(num)),
    (0, import_react5.createElement)("span", { className: "dsh-gd-txt", title: text }, text ?? ""),
    row.kind === "change" && (0, import_react5.createElement)("span", { className: "dsh-gd-txt after" }, row.right?.text ?? "")
  );
}
function renderConflicts(conflicts, working, setWorking, setNote) {
  if (conflicts.length === 0) {
    return (0, import_react5.createElement)("div", { className: "dsh-gd-empty ok" }, icon("check", 14), t("diff.allResolved"));
  }
  const lines = working.split("\n");
  const CONTEXT_AROUND = 8;
  const elements = [];
  let lineIdx = 0;
  elements.push(
    (0, import_react5.createElement)(
      "div",
      {
        className: "dsh-gd-conflict-hint",
        key: "hint",
        style: {
          padding: "8px 12px",
          background: "rgba(210, 153, 34, 0.12)",
          borderBottom: "1px solid rgba(210, 153, 34, 0.25)",
          color: "var(--fg)",
          fontSize: 12
        }
      },
      icon("bulb", 14),
      t("diff.conflictHint")
    )
  );
  for (let cIdx = 0; cIdx < conflicts.length; cIdx += 1) {
    const block = conflicts[cIdx];
    const contextStart = Math.max(lineIdx, block.start - CONTEXT_AROUND);
    if (contextStart > lineIdx) {
      const skippedCount = contextStart - lineIdx;
      const fromLine = lineIdx + 1;
      const toLine = contextStart;
      elements.push(
        (0, import_react5.createElement)(
          "div",
          {
            className: "dsh-gd-gap",
            key: `gap-before-${cIdx}`,
            style: {
              padding: "6px 12px",
              margin: "4px 0",
              background: "rgba(128,128,128,0.08)",
              borderRadius: 4,
              fontSize: 11,
              color: "var(--muted)",
              cursor: "pointer",
              textAlign: "center"
            },
            title: t("diff.viewHistory"),
            onClick: () => {
              const el = document.getElementById(`gap-body-${cIdx}`);
              if (el) el.style.display = el.style.display === "none" ? "block" : "none";
            }
          },
          icon("fold", 13),
          t("diff.foldedAbove", { from: String(fromLine), to: String(toLine), count: String(skippedCount) })
        ),
        (0, import_react5.createElement)(
          "div",
          {
            id: `gap-body-${cIdx}`,
            key: `gap-body-content-${cIdx}`,
            style: { display: "none" }
          },
          lines.slice(lineIdx, contextStart).map((lText, i) => {
            const num = lineIdx + i + 1;
            return (0, import_react5.createElement)(
              "div",
              { className: "dsh-gd-row normal", key: `line-${num}` },
              (0, import_react5.createElement)("span", { className: "dsh-gd-marker" }, " "),
              (0, import_react5.createElement)("span", { className: "dsh-gd-num" }, String(num)),
              (0, import_react5.createElement)("span", { className: "dsh-gd-txt", style: { whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace" } }, lText)
            );
          })
        )
      );
      lineIdx = contextStart;
    }
    while (lineIdx < block.start) {
      const num = lineIdx + 1;
      const text = lines[lineIdx] ?? "";
      elements.push(
        (0, import_react5.createElement)(
          "div",
          { className: "dsh-gd-row normal", key: `line-${num}` },
          (0, import_react5.createElement)("span", { className: "dsh-gd-marker" }, " "),
          (0, import_react5.createElement)("span", { className: "dsh-gd-num" }, String(num)),
          (0, import_react5.createElement)("span", { className: "dsh-gd-txt", style: { whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace" } }, text)
        )
      );
      lineIdx += 1;
    }
    elements.push(
      (0, import_react5.createElement)(
        "div",
        {
          id: `conflict-block-${cIdx}`,
          className: "dsh-gd-conflict-block",
          key: `conflict-${block.start}-${block.middle}`,
          style: {
            margin: "8px 0",
            border: "1px solid var(--danger, #ef4444)",
            borderRadius: 6,
            overflow: "hidden",
            background: "rgba(239, 68, 68, 0.04)"
          }
        },
        (0, import_react5.createElement)(
          "div",
          {
            className: "dsh-gd-conflict-head",
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              background: "rgba(239, 68, 68, 0.12)",
              borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
              fontSize: 11.5
            }
          },
          (0, import_react5.createElement)("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600, color: "var(--danger, #ef4444)" } }, icon("conflict", 14), t("diff.conflictHeader", { index: String(cIdx + 1), total: String(conflicts.length), from: String(block.start + 1), to: String(block.end + 1) })),
          (0, import_react5.createElement)("span", { className: "dsh-gd-spacer", style: { flex: 1 } }),
          (0, import_react5.createElement)(
            "button",
            {
              type: "button",
              className: "dsh-gd-btn",
              style: { padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 },
              onClick: () => {
                setWorking(applyResolution(working, block, "ours"));
                setNote({ text: t("diff.tookOurs", { line: String(block.start + 1) }), kind: "ok" });
              }
            },
            icon("check", 13),
            t("diff.takeOurs")
          ),
          (0, import_react5.createElement)(
            "button",
            {
              type: "button",
              className: "dsh-gd-btn",
              style: { padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 },
              onClick: () => {
                setWorking(applyResolution(working, block, "theirs"));
                setNote({ text: t("diff.tookTheirs", { label: block.label }), kind: "ok" });
              }
            },
            icon("check", 13),
            t("diff.takeTheirs", { label: block.label })
          ),
          (0, import_react5.createElement)(
            "button",
            {
              type: "button",
              className: "dsh-gd-btn",
              style: { padding: "3px 8px", fontSize: 11, cursor: "pointer" },
              onClick: () => {
                setWorking(applyResolution(working, block, "both"));
                setNote({ text: t("diff.tookBoth"), kind: "ok" });
              }
            },
            icon("both", 13),
            t("diff.takeBoth")
          )
        ),
        (0, import_react5.createElement)(
          "div",
          { className: "dsh-gd-conflict-panes", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(128,128,128,0.15)" } },
          (0, import_react5.createElement)(
            "div",
            { style: { padding: "8px 10px", background: "rgba(59, 130, 246, 0.08)" } },
            (0, import_react5.createElement)("div", { style: { fontSize: 10.5, color: "var(--accent, #3b82f6)", marginBottom: 4, fontWeight: 600 } }, t("diff.oursLabel")),
            (0, import_react5.createElement)("pre", { style: { margin: 0, fontSize: 12, fontFamily: "ui-monospace, monospace", whiteSpace: "pre-wrap" } }, block.ours || t("diff.empty"))
          ),
          (0, import_react5.createElement)(
            "div",
            { style: { padding: "8px 10px", background: "rgba(34, 197, 94, 0.08)" } },
            (0, import_react5.createElement)("div", { style: { fontSize: 10.5, color: "var(--current, #22c55e)", marginBottom: 4, fontWeight: 600 } }, t("diff.theirsLabel", { label: block.label })),
            (0, import_react5.createElement)("pre", { style: { margin: 0, fontSize: 12, fontFamily: "ui-monospace, monospace", whiteSpace: "pre-wrap" } }, block.theirs || t("diff.empty"))
          )
        )
      )
    );
    lineIdx = block.end + 1;
    const contextEnd = Math.min(lines.length, lineIdx + CONTEXT_AROUND);
    while (lineIdx < contextEnd) {
      const num = lineIdx + 1;
      const text = lines[lineIdx] ?? "";
      elements.push(
        (0, import_react5.createElement)(
          "div",
          { className: "dsh-gd-row normal", key: `line-${num}` },
          (0, import_react5.createElement)("span", { className: "dsh-gd-marker" }, " "),
          (0, import_react5.createElement)("span", { className: "dsh-gd-num" }, String(num)),
          (0, import_react5.createElement)("span", { className: "dsh-gd-txt", style: { whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace" } }, text)
        )
      );
      lineIdx += 1;
    }
  }
  if (lineIdx < lines.length) {
    const remainingCount = lines.length - lineIdx;
    const fromLine = lineIdx + 1;
    const toLine = lines.length;
    elements.push(
      (0, import_react5.createElement)(
        "div",
        {
          className: "dsh-gd-gap",
          key: "gap-after-last",
          style: {
            padding: "6px 12px",
            margin: "4px 0",
            background: "rgba(128,128,128,0.08)",
            borderRadius: 4,
            fontSize: 11,
            color: "var(--muted)",
            cursor: "pointer",
            textAlign: "center"
          },
          title: t("diff.expandRest"),
          onClick: () => {
            const el = document.getElementById("gap-body-after-last");
            if (el) el.style.display = el.style.display === "none" ? "block" : "none";
          }
        },
        icon("fold", 13),
        t("diff.foldedBelow", { from: String(fromLine), to: String(toLine), count: String(remainingCount) })
      ),
      (0, import_react5.createElement)(
        "div",
        {
          id: "gap-body-after-last",
          key: "gap-body-content-after-last",
          style: { display: "none" }
        },
        lines.slice(lineIdx).map((lText, i) => {
          const num = lineIdx + i + 1;
          return (0, import_react5.createElement)(
            "div",
            { className: "dsh-gd-row normal", key: `line-${num}` },
            (0, import_react5.createElement)("span", { className: "dsh-gd-marker" }, " "),
            (0, import_react5.createElement)("span", { className: "dsh-gd-num" }, String(num)),
            (0, import_react5.createElement)("span", { className: "dsh-gd-txt", style: { whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace" } }, lText)
          );
        })
      )
    );
  }
  return (0, import_react5.createElement)("div", { className: "dsh-gd-conflicts-flow", style: { padding: "8px 12px", overflowY: "auto" } }, elements);
}
var STYLE2 = `
.dsh-gd { --gd-bg:var(--dsw-alias-bg-base, #ffffff); --gd-fg:var(--dsw-alias-label-primary, #24292f);
  --gd-muted:var(--dsw-alias-label-tertiary, #6e7781); --gd-border:var(--dsw-alias-border-l3, rgba(128,128,128,0.25));
  --gd-add:#1a7f37; --gd-add-bg:rgba(46,160,67,0.12); --gd-del:#cf222e; --gd-del-bg:rgba(207,34,46,0.10);
  display:flex; flex-direction:column; height:100%; min-height:0; color:var(--gd-fg); background:var(--gd-bg); }
[data-ds-dark-theme] .dsh-gd { --gd-bg:var(--dsw-alias-bg-base, #1f2328); --gd-fg:var(--dsw-alias-label-primary, #d1d9e0);
  --gd-muted:#9198a1; --gd-border:rgba(255,255,255,0.14); --gd-add:#3fb950; --gd-add-bg:rgba(63,185,80,0.15);
  --gd-del:#f85149; --gd-del-bg:rgba(248,81,73,0.15); }
.dsh-gd-head { display:flex; align-items:center; gap:8px; flex:0 0 auto; padding:5px 8px;
  border-bottom:1px solid var(--gd-border); background:var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.05));
  flex-wrap:wrap; row-gap:4px; min-height:36px; }
.dsh-gd-id { display:flex; align-items:center; gap:6px; min-width:0; flex:0 1 auto; }
.dsh-gd-glyph { display:inline-flex; color:var(--gd-muted); flex:0 0 auto; }
.dsh-gd-name { font-weight:600; font-size:12.5px; white-space:nowrap; }
.dsh-gd-path { font-size:11px; color:var(--gd-muted); font-family:var(--dsw-font-mono, ui-monospace, monospace);
  max-width:42ch; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; direction:rtl; text-align:left; }
.dsh-gd-path:hover { color:var(--gd-fg); }
.dsh-gd-badge { font-size:10px; font-weight:700; border:1px solid; border-radius:4px; padding:0 4px; line-height:15px; flex:0 0 auto; }
.dsh-gd-tag { font-size:10px; color:var(--gd-muted); border:1px solid var(--gd-border); border-radius:4px;
  padding:0 4px; line-height:15px; flex:0 0 auto; }
.dsh-gd-stat { display:flex; align-items:center; gap:4px; flex:0 0 auto;
  font-family:var(--dsw-font-mono, ui-monospace, monospace); font-size:11px; }
.dsh-gd-add, .dsh-gd-del { border-radius:4px; padding:0 4px; line-height:16px; }
.dsh-gd-add { color:var(--gd-add); background:var(--gd-add-bg); }
.dsh-gd-del { color:var(--gd-del); background:var(--gd-del-bg); }
.dsh-gd-spacer { flex:1 1 auto; }
.dsh-gd-tools { display:flex; align-items:center; gap:6px; flex:0 0 auto; }
.dsh-gd-seg { display:flex; align-items:center; gap:2px; padding:2px; border-radius:8px;
  background:var(--dsw-alias-bg-layer-3, rgba(128,128,128,0.10)); border:1px solid var(--gd-border); }
.dsh-gd-ico-btn { width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center;
  border-radius:6px; border:1px solid transparent; background:transparent; color:var(--gd-muted); cursor:pointer; padding:0; }
.dsh-gd-ico-btn:hover { color:var(--gd-fg); background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.14)); }
.dsh-gd-ico-btn.on { color:var(--dsw-alias-color-brand, #1976d2);
  background:var(--dsw-alias-bg-base, #fff); border-color:var(--gd-border);
  box-shadow:0 1px 2px rgba(0,0,0,0.10); }
.dsh-gd-ico-btn.danger { color:var(--gd-del); }
.dsh-gd-ico-btn.danger.on { color:#fff; background:var(--gd-del); border-color:transparent; }
.dsh-gd-stepper { display:flex; align-items:center; gap:1px; padding:2px; border-radius:8px;
  background:var(--dsw-alias-bg-layer-3, rgba(128,128,128,0.10)); border:1px solid var(--gd-border); }
.dsh-gd-step { min-width:24px; height:24px; border:none; border-radius:6px; background:transparent;
  color:var(--gd-muted); cursor:pointer; font-size:11px; font-weight:600; padding:0 4px; }
.dsh-gd-step:hover { color:var(--gd-fg); background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.14)); }
.dsh-gd-size { min-width:18px; text-align:center; font-size:11px; color:var(--gd-muted);
  font-family:var(--dsw-font-mono, ui-monospace, monospace); }
.dsh-gd-actions { display:flex; align-items:center; gap:6px; }
.dsh-gd-sep { width:1px; height:18px; background:var(--gd-border); flex:0 0 auto; }
.dsh-gd-btn { display:inline-flex; align-items:center; gap:5px; height:26px; padding:0 9px; border-radius:7px;
  font-size:11.5px; cursor:pointer; color:var(--gd-fg); background:transparent;
  border:1px solid var(--gd-border); white-space:nowrap; }
.dsh-gd-btn .dsh-gd-ico { opacity:.85; }
.dsh-gd-btn:hover:not(:disabled) { background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.12));
  border-color:var(--dsw-alias-label-tertiary, rgba(128,128,128,0.5)); }
.dsh-gd-btn:disabled { opacity:.5; cursor:default; }
.dsh-gd-btn.on { border-color:var(--dsw-alias-color-brand, #1976d2); color:var(--dsw-alias-color-brand, #1976d2); }
.dsh-gd-btn.primary { background:var(--dsw-alias-color-brand, #1976d2); border-color:transparent; color:#fff; font-weight:600; }
.dsh-gd-btn.primary:hover:not(:disabled) { filter:brightness(1.08); }
.dsh-gd-btn.primary:disabled { opacity:.5; }
.dsh-gd-btn.synced { color:var(--gd-muted); border-color:var(--gd-border); background:transparent; }
.dsh-gd-btn.synced:disabled { opacity:1; }
.dsh-gd-btn.primary.dirty { box-shadow:0 0 0 3px color-mix(in srgb, var(--dsw-alias-color-brand, #1976d2) 22%, transparent); }
.dsh-gd-btn.primary.dirty .dsh-gd-ico { animation:dshGdPulse 1.6s ease-in-out infinite; }
@keyframes dshGdPulse { 0%,100% { transform:translateY(0); opacity:.9; } 50% { transform:translateY(1.5px); opacity:1; } }
.dsh-gd-notes { display:flex; gap:6px; flex-wrap:wrap; padding:5px 8px; font-size:11px;
  border-bottom:1px solid var(--gd-border); background:var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.04)); }
.dsh-gd-note { color:var(--gd-muted); border:1px solid var(--gd-border); border-radius:999px; padding:1px 8px; line-height:16px; }
.dsh-gd-note.ok { color:var(--gd-add); border-color:color-mix(in srgb, var(--gd-add) 40%, transparent);
  background:color-mix(in srgb, var(--gd-add) 10%, transparent); }
.dsh-gd-note.err { color:var(--gd-del); border-color:color-mix(in srgb, var(--gd-del) 40%, transparent);
  background:color-mix(in srgb, var(--gd-del) 10%, transparent); }
.dsh-gd-body { flex:1 1 auto; min-height:0; display:flex; }
.dsh-gd-scroll { flex:1 1 auto; min-height:0; overflow:auto; }
.dsh-gd-rows { min-width:100%; font-family:var(--dsw-font-mono, ui-monospace, monospace); line-height:1.55; }
.dsh-gd-row { display:flex; align-items:stretch; content-visibility:auto; contain-intrinsic-size:auto 19px; }
.dsh-gd-cell { flex:1 1 50%; min-width:0; display:flex; gap:6px; padding:0 6px 0 0; }
.dsh-gd-cell.left { border-right:1px solid var(--gd-border); }
.dsh-gd-num { flex:0 0 auto; width:3.2em; text-align:right; color:var(--gd-muted); user-select:none; padding-right:4px; }
.dsh-gd-txt { flex:1 1 auto; min-width:0; white-space:pre; overflow:hidden; text-overflow:ellipsis; }
.dsh-gd-rows.wrap .dsh-gd-txt { white-space:pre-wrap; word-break:break-word; overflow:visible; }
.dsh-gd-row.ins .right, .dsh-gd-row.change .right { background:var(--gd-add-bg); }
.dsh-gd-row.del .left, .dsh-gd-row.change .left { background:var(--gd-del-bg); }
.dsh-gd-row.unified { display:flex; gap:6px; padding-right:8px; }
.dsh-gd-row.unified.ins { background:var(--gd-add-bg); }
.dsh-gd-row.unified.del { background:var(--gd-del-bg); }
.dsh-gd-row.unified.change { background:linear-gradient(90deg, var(--gd-del-bg) 0 50%, var(--gd-add-bg) 50% 100%); }
.dsh-gd-row.unified .dsh-gd-txt.after { border-left:1px dashed var(--gd-border); padding-left:8px; }
.dsh-gd-marker { flex:0 0 auto; width:1em; text-align:center; color:var(--gd-muted); }
.dsh-gd-gap { padding:1px 10px; font-size:11px; color:var(--gd-muted); cursor:pointer;
  background:var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.08)); border-top:1px solid var(--gd-border);
  border-bottom:1px solid var(--gd-border); }
.dsh-gd-gap:hover { color:var(--gd-fg); }
.dsh-gd-empty { padding:24px; text-align:center; color:var(--gd-muted); font-size:12px; }
.dsh-gd-empty.ok { color:var(--gd-add); }
.dsh-gd-editor { flex:1 1 auto; min-height:0; width:100%; border:none; outline:none; resize:none; padding:10px;
  background:transparent; color:var(--gd-fg); font-family:var(--dsw-font-mono, ui-monospace, monospace); line-height:1.55; }
.dsh-gd-conflicts { padding:10px; display:flex; flex-direction:column; gap:10px; width:100%; }
.dsh-gd-conflict-hint { font-size:11px; color:var(--gd-muted); }
.dsh-gd-conflict { border:1px solid var(--gd-border); border-radius:8px; overflow:hidden; }
.dsh-gd-conflict-head { display:flex; align-items:center; gap:6px; padding:5px 8px; font-size:11px;
  background:var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.08)); border-bottom:1px solid var(--gd-border); }
.dsh-gd-conflict-panes { display:flex; align-items:stretch; }
.dsh-gd-conflict-pane { flex:1 1 50%; min-width:0; padding:6px 8px; }
.dsh-gd-conflict-pane.ours { border-right:1px solid var(--gd-border); background:var(--gd-del-bg); }
.dsh-gd-conflict-pane.theirs { background:var(--gd-add-bg); }
.dsh-gd-conflict-title { font-size:10px; color:var(--gd-muted); margin-bottom:3px; }
.dsh-gd-conflict-pane pre { margin:0; font-family:var(--dsw-font-mono, ui-monospace, monospace); font-size:11.5px;
  white-space:pre-wrap; word-break:break-word; max-height:220px; overflow:auto; }
`;

// src/client/decorations.ts
var DECO_CLASS = "dsh-git-deco";
var styleReady2 = false;
function ensureStyle3() {
  if (styleReady2 || typeof document === "undefined") return;
  styleReady2 = true;
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-git-panel-decorations";
  tag.textContent = STYLE3;
  document.head.appendChild(tag);
}
function relativeTo(root, absolute) {
  const base = root.replace(/\\/gu, "/").replace(/\/+$/u, "");
  const target = absolute.replace(/\\/gu, "/");
  if (target === base) return "";
  return target.startsWith(`${base}/`) ? target.slice(base.length + 1) : void 0;
}
function signatureOf(letter) {
  return letter ?? "";
}
function decorateRow(row, letter) {
  const button = row.querySelector(":scope > button") ?? row.querySelector(":scope > span");
  if (button === null) return;
  const name = button.querySelector("span");
  const host = name ?? button;
  const existing = row.querySelector(`.${DECO_CLASS}`);
  const signature = signatureOf(letter);
  const attribute = row.dataset.dshGitSig ?? "";
  const consistent = letter === void 0 ? existing === null : existing !== null && existing.parentElement === host;
  if (attribute === signature && consistent) return;
  row.dataset.dshGitSig = signature;
  if (letter === void 0) {
    existing?.remove();
    if (name instanceof HTMLElement) name.style.removeProperty("color");
    return;
  }
  if (name instanceof HTMLElement) name.style.color = STATUS_COLORS[letter] ?? "inherit";
  if (existing !== null && existing.parentElement !== host) existing.remove();
  const badge = existing?.parentElement === host ? existing : document.createElement("span");
  badge.className = DECO_CLASS;
  badge.textContent = letter;
  badge.setAttribute("data-letter", letter);
  badge.style.color = STATUS_COLORS[letter] ?? "inherit";
  if (badge.parentElement !== host) host.appendChild(badge);
}
function installFileTreeDecorations(cache, ensure) {
  if (typeof document === "undefined") return () => {
  };
  ensureStyle3();
  let frame = 0;
  let stopped = false;
  const run = () => {
    if (stopped) return;
    const trees = document.querySelectorAll('[data-files-state="tree"][data-files-root]');
    for (const tree of trees) {
      const root = tree.getAttribute("data-files-root");
      if (root === null || root === "") continue;
      ensure(root);
      const view = cache.viewOf(root);
      if (view === void 0) continue;
      const directories = /* @__PURE__ */ new Set();
      for (const entry of view.entries) {
        let at = entry.path.lastIndexOf("/");
        while (at > 0) {
          directories.add(entry.path.slice(0, at));
          at = entry.path.lastIndexOf("/", at - 1);
        }
      }
      for (const row of tree.querySelectorAll("li[data-files-entry]")) {
        const absolute = row.getAttribute("data-files-path");
        if (absolute === null) continue;
        const relative = relativeTo(root, absolute);
        if (relative === void 0 || relative === "") continue;
        const kind = row.getAttribute("data-files-entry");
        if (kind === "file") {
          decorateRow(row, cache.letterOf(root, relative));
          continue;
        }
        if (kind === "directory") {
          decorateRow(row, directories.has(relative) ? dotLetter() : void 0);
        }
      }
    }
  };
  const schedule = () => {
    if (stopped || frame !== 0) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      try {
        run();
      } catch (error) {
        console.warn("dsh-git-panel: decoration pass failed", error);
      }
    });
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  const unsubscribe = cache.subscribe(schedule);
  schedule();
  return () => {
    stopped = true;
    observer.disconnect();
    unsubscribe();
    if (frame !== 0) window.cancelAnimationFrame(frame);
  };
}
function dotLetter() {
  return "\u2022";
}
var STYLE3 = `
.dsh-git-deco { flex:0 0 auto; margin-left:5px; font-size:10.5px; font-weight:700;
  font-family:var(--dsw-font-family, inherit); opacity:.95; }
.dsh-git-deco[data-letter="\u2022"] { font-size:13px; line-height:1; opacity:.8; }
`;

// src/client/index.ts
var inject = ["sessions", "locale"];
var TAB_ID = "@deepseek-ai/dsh-git-panel";
function GitGuideIcon(props) {
  const size = props.size ?? 26;
  return (0, import_react6.createElement)(
    "svg",
    {
      width: size,
      height: size,
      className: props.className,
      viewBox: "0 0 28 28",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    },
    (0, import_react6.createElement)("circle", { key: "a", cx: 9, cy: 7, r: 2.6 }),
    (0, import_react6.createElement)("circle", { key: "b", cx: 9, cy: 21, r: 2.6 }),
    (0, import_react6.createElement)("circle", { key: "c", cx: 19, cy: 14, r: 2.6 }),
    (0, import_react6.createElement)("path", { key: "d", d: "M9 9.6v8.8M9 14h7.4" })
  );
}
var DIFF_TAB_ID = "@deepseek-ai/dsh-git-panel/diff";
var DIFF_KIND = "git-diff";
var POLL_MS = 4e3;
function apply(ctx) {
  try {
    initI18n(ctx.locale);
  } catch (error) {
    console.error("dsh-git-panel: i18n init failed", error);
  }
  const api = new GitPanelApi();
  const statusCache = new GitStatusCache(api);
  const cwdOf = (sessionId) => {
    if (sessionId === void 0) return "";
    try {
      const snapshot = ctx.sessions.list.getSnapshot();
      const cwd = snapshot.byId[sessionId]?.cwd;
      return typeof cwd === "string" ? cwd : "";
    } catch {
      return "";
    }
  };
  ctx.inject(["sessions"], () => {
    try {
      const refresh = () => {
        const current = ctx.sessions.list.getSnapshot().current;
        const cwd = cwdOf(current);
        if (cwd !== "") void statusCache.ensure(cwd);
        for (const root of statusCache.roots()) {
          if (root !== cwd) void statusCache.ensure(root);
        }
      };
      refresh();
      ctx.sessions.list.subscribe(refresh);
      const timer = window.setInterval(() => {
        if (document.visibilityState === "visible") refresh();
      }, POLL_MS);
      ctx.effect(() => () => window.clearInterval(timer), "dsh-git-panel: status poll");
      ctx.effect(() => installFileTreeDecorations(statusCache, (root) => {
        void statusCache.ensure(root);
      }), "dsh-git-panel: file tree decorations");
    } catch (error) {
      console.warn("dsh-git-panel: status polling setup failed", error);
    }
  });
  ctx.inject(["sidebarRightTabs", "slots"], (scope) => {
    try {
      if (scope.sidebarRightTabs) {
        scope.sidebarRightTabs.register({
          id: TAB_ID,
          kind: "git",
          priority: "extension",
          title: () => "Git",
          // 与官方 provider（sidebar-files / sidebar-terminal）保持完全一致的
          // guide 契约：id + order + title + description + icon 五件套。
          // 缺 description/icon 会让工作区启动卡只剩一行标题，行距与留白都和
          // 官方卡片对不齐——补全后才与「工作区文件」「新建终端」长得一样。
          guide: [{
            id: "git",
            order: 12,
            title: () => t("tab.gitTitle"),
            description: () => t("guide.gitDescription"),
            icon: GitGuideIcon
          }]
        });
        scope.slots.inject(
          "sidebar.right.pane.tab",
          () => scope.slots.register({
            name: "sidebar.right.pane.tab",
            key: TAB_ID,
            inject: () => ({ api, sessions: ctx.sessions, statusCache })
          }, GitTabBody)
        );
        scope.slots.inject(
          "sidebar.right.pane.tab.title",
          () => scope.slots.register({
            name: "sidebar.right.pane.tab.title",
            key: TAB_ID
          }, () => (0, import_react6.createElement)(
            "span",
            { style: { display: "flex", alignItems: "center", gap: 5 } },
            (0, import_react6.createElement)(
              "svg",
              { viewBox: "0 0 16 16", width: 14, height: 14, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" },
              (0, import_react6.createElement)("circle", { cx: 4, cy: 4, r: 2 }),
              (0, import_react6.createElement)("circle", { cx: 4, cy: 12, r: 2 }),
              (0, import_react6.createElement)("circle", { cx: 12, cy: 8, r: 2 }),
              (0, import_react6.createElement)("path", { d: "M4 6v4M4 8h5a3 3 0 013 3" })
            ),
            (0, import_react6.createElement)("span", null, "Git")
          ))
        );
        console.log("dsh-git-panel: registered into native sidebarRightTabs");
      }
    } catch (err) {
      console.warn("dsh-git-panel: sidebarRightTabs register error", err);
    }
  });
  ctx.inject(["sidebarRightTabs", "slots", "sessions", "sidebarRight"], (scope) => {
    try {
      if (!scope.sidebarRightTabs) return;
      scope.sidebarRightTabs.register({
        id: DIFF_TAB_ID,
        kind: DIFF_KIND,
        priority: "extension",
        canOpen: (address) => {
          const parsed = parseFileAddress(address);
          return parsed !== void 0 && parsed.sessionId !== "";
        },
        title: (address) => {
          const parsed = parseFileAddress(address);
          return `\xB1 ${basenameOf(parsed?.path ?? address)}`;
        }
      });
      scope.slots.inject(
        "sidebar.right.pane.tab",
        () => scope.slots.register({
          name: "sidebar.right.pane.tab",
          key: DIFF_TAB_ID,
          inject: () => ({
            api,
            sessions: ctx.sessions,
            sidebarRight: scope.sidebarRight ?? ctx.sidebarRight
          })
        }, GitDiffView)
      );
      console.log("dsh-git-panel: registered git-diff tab type");
    } catch (error) {
      console.warn("dsh-git-panel: git-diff register error", error);
    }
  });
}
var index_default = { apply, inject };
    return module.exports;
  }
});
//# sourceMappingURL=client.js.map
