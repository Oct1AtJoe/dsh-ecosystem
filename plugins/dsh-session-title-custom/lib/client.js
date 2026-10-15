/**
 * dsh-session-title-custom — client half.
 *
 * Contributes the "会话标题" tab to the Plugins settings section (right after
 * the 桌宠 tab) and edits the `session-title` settings namespace: the model
 * fallback table, its thinking levels, and the title-generation limits the host half
 * reads on every generate.
 *
 * Hand-written bundle in the same shape tsdown emits: the loader hands the
 * factory its `require`, so React and the shared snapshot store resolve
 * through the module table instead of being inlined.
 */
window.__ModuleLoader__.load({
  id: 'dsh-session-title-custom',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    const react = require('react');
    const clientStore = require('@deepseek-ai/dsh-client-store');

    const e = react.createElement;

    /** Settings namespace owned by this plugin (matches the host half). */
    const NS = 'session-title';

    /** <style> tag id so the stylesheet injects once. */
    const STYLE_ID = 'dsh-session-title-custom-style';

    /** Staged numeric fields and their accepted ranges (mirrors the host schema). */
    const RANGES = {
      maxTokens: { min: 16, max: 8192 },
      maxInputChars: { min: 200, max: 8000 },
      timeoutMs: { min: 3000, max: 120000 },
      maxTitleLength: { min: 20, max: 200 },
    };
    const NUMERIC = ['maxTokens', 'maxInputChars', 'timeoutMs', 'maxTitleLength'];

    /** Reset targets, kept equal to the host DEFAULTS. */
    const RESET = {
      maxTokens: '48',
      maxInputChars: '2000',
      timeoutMs: '30000',
      maxTitleLength: '80',
    };

    /** zh is the key-set source of truth for the dictionaries. */
    const zh = {
      tab: '会话标题与git提交',
      cardTitle: '会话标题与 Git 提交信息',
      cardDescription: '用于会话自动命名及 Git 提交信息生成的共享模型优先级列表与参数。',
      enabled: '启用自定义命名',
      enabledHint: '关闭后回退到 DSH 内置的会话命名。',
      tableTitle: '模型优先级与托底链',
      tableHint: '自上而下优先调用；遇到超时、欠费或报错时自动顺延使用下一个模型。',
      colPriority: '#',
      colProvider: '服务商',
      colModel: '模型',
      colEffort: '思考档位',
      colActions: '操作',
      moveUp: '上移',
      moveDown: '下移',
      delete: '删除',
      add: '添加托底模型',
      effortDefault: '跟随模型默认',
      maxTokens: '最大输出 Tokens',
      maxTokensHint: '单次标题生成的输出上限（16–8192）。',
      maxInputChars: '首条消息截断',
      maxInputCharsHint: '送给模型的首条消息最大字符数（200–8000）。',
      timeoutMs: '超时（毫秒）',
      timeoutMsHint: '标题生成请求的超时时间（3000–120000）。',
      maxTitleLength: '标题最大长度',
      maxTitleLengthHint: '清洗后标题的字符上限（20–200）。',
      reset: '重置',
      invalidNumber: '超出允许范围',
      save: '保存',
      discard: '放弃',
      catalogError: '模型目录加载失败',
      retry: '重试',
    };

    const en = {
      tab: 'Session title & git commit',
      cardTitle: 'Session title & Git commit',
      cardDescription: 'Shared model priority list and limits for session naming and git commit message generation.',
      enabled: 'Custom naming',
      enabledHint: 'Turning this off falls back to the built-in DSH naming.',
      tableTitle: 'Model priority & fallback chain',
      tableHint: 'Called from top to bottom; automatically falls back to next model on timeout, quota or error.',
      colPriority: '#',
      colProvider: 'Provider',
      colModel: 'Model',
      colEffort: 'Thinking level',
      colActions: 'Actions',
      moveUp: 'Move up',
      moveDown: 'Move down',
      delete: 'Delete',
      add: 'Add fallback model',
      effortDefault: 'Model default',
      maxTokens: 'Max output tokens',
      maxTokensHint: 'Output cap for one title generation (16–8192).',
      maxInputChars: 'First message cap',
      maxInputCharsHint: 'Max characters of the first message sent to the model (200–8000).',
      timeoutMs: 'Timeout (ms)',
      timeoutMsHint: 'Title request timeout (3000–120000).',
      maxTitleLength: 'Max title length',
      maxTitleLengthHint: 'Character cap of the cleaned title (20–200).',
      reset: 'Reset',
      invalidNumber: 'Out of range',
      save: 'Save',
      discard: 'Discard',
      catalogError: 'Model directory failed to load',
      retry: 'Retry',
    };

    /** Stylesheet, consuming the official design tokens only. */
    const CSS = [
      '.stc-section{display:grid;gap:12px}',
      '.stc-heading{display:grid;gap:2px}',
      '.stc-card-title{margin:0;font-size:14px;font-weight:700;color:var(--dsw-alias-label-primary)}',
      '.stc-card-desc{margin:0;font-size:12px;color:var(--dsw-alias-label-tertiary)}',
      '.stc-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:0.5px solid var(--dsw-alias-border-l2)}',
      '.stc-row-label{display:grid;gap:2px}',
      '.stc-row-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.stc-row-hint{font-size:11px;color:var(--dsw-alias-label-tertiary)}',
      '.stc-switch{position:relative;flex-shrink:0;width:42px;height:24px;border:0;border-radius:12px;background:var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.18));cursor:pointer;transition:background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)}',
      '.stc-switch[data-on="true"]{background:var(--dsw-alias-brand-primary, #5686fe)}',
      '.stc-switch::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0, 0, 0, 0.25);transition:transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)}',
      '.stc-switch[data-on="true"]::after{transform:translateX(18px)}',
      '.stc-switch:disabled{opacity:0.4;cursor:not-allowed}',
      '.stc-table-wrap{border:0.5px solid var(--dsw-alias-border-l3, rgba(128,128,128,0.2));border-radius:8px;overflow:hidden;background:var(--dsw-alias-bg-layer-2, transparent);margin:6px 0 10px 0}',
      '.stc-table-head{display:grid;grid-template-columns:32px 1fr 1fr 115px 76px;gap:8px;padding:7px 10px;background:var(--dsw-alias-bg-layer-3, rgba(128,128,128,0.06));border-bottom:0.5px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.15));font-size:11.5px;font-weight:600;color:var(--dsw-alias-label-tertiary);align-items:center}',
      '.stc-table-row{display:grid;grid-template-columns:32px 1fr 1fr 115px 76px;gap:8px;padding:6px 10px;border-bottom:0.5px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.1));align-items:center}',
      '.stc-table-row:last-child{border-bottom:none}',
      '.stc-row-num{font-size:11.5px;font-weight:600;color:var(--dsw-alias-label-tertiary);text-align:center;font-variant-numeric:tabular-nums}',
      '.stc-table-select{width:100%;box-sizing:border-box;padding:4px 6px;border:0.5px solid var(--dsw-alias-border-l4, rgba(128,128,128,0.25));border-radius:6px;background:var(--dsw-alias-bg-layer-3, rgba(128,128,128,0.08));color:var(--dsw-alias-label-primary);font-size:12px;outline:none;text-overflow:ellipsis}',
      '.stc-table-select:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.stc-row-ops{display:flex;align-items:center;gap:3px;justify-content:flex-end}',
      '.stc-icon-btn{width:22px;height:22px;border:0.5px solid var(--dsw-alias-border-l3, rgba(128,128,128,0.2));border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:11px;padding:0;transition:all 0.15s}',
      '.stc-icon-btn:hover:not(:disabled){background:var(--dsw-alias-fill-hover, rgba(128,128,128,0.1));color:var(--dsw-alias-label-primary)}',
      '.stc-icon-btn:disabled{opacity:0.3;cursor:not-allowed}',
      '.stc-icon-btn.danger:hover:not(:disabled){color:var(--dsw-alias-label-error, #cf222e);border-color:var(--dsw-alias-label-error, #cf222e)}',
      '.stc-table-foot{display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:var(--dsw-alias-bg-layer-2, transparent);border-top:0.5px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.1))}',
      '.stc-add-btn{width:24px;height:24px;font-size:15px;font-weight:600;border-radius:5px;border:0.5px dashed var(--dsw-alias-border-l4, rgba(128,128,128,0.3));background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;transition:all 0.15s}',
      '.stc-add-btn:hover:not(:disabled){border-style:solid;border-color:var(--dsw-alias-brand-primary, #5686fe);color:var(--dsw-alias-brand-primary, #5686fe);background:var(--dsw-alias-fill-hover, rgba(128,128,128,0.1))}',
      '.stc-add-btn:disabled{opacity:0.3;cursor:not-allowed}',
      '.stc-field{display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:center;padding:8px 0;border-bottom:0.5px solid var(--dsw-alias-border-l2)}',
      '.stc-field-label{display:grid;gap:2px}',
      '.stc-field-control{display:flex;gap:6px;align-items:center}',
      '.stc-input{min-width:96px;max-width:220px;padding:4px 8px;border:0.5px solid var(--dsw-alias-border-l4);border-radius:6px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font-size:12px}',
      '.stc-input:focus-visible,.stc-button:focus-visible,.stc-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.stc-input[aria-invalid="true"]{border-color:var(--dsw-alias-label-error)}',
      '.stc-field-error{grid-column:1/-1;font-size:11px;color:var(--dsw-alias-label-error)}',
      '.stc-catalog-error{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:11px;color:var(--dsw-alias-label-error)}',
      '.stc-actions{display:flex;gap:10px;justify-content:flex-end;padding-top:8px}',
      '.stc-button{border:1px solid var(--dsw-alias-border-l3,rgba(0,0,0,0.15));border-radius:8px;padding:6px 16px;font-size:13px;font-weight:500;cursor:pointer;background:var(--dsw-alias-bg-layer-2,transparent);color:var(--dsw-alias-label-primary);transition:all 0.15s}',
      '.stc-button[data-tone="primary"]{border-color:transparent;background:var(--dsw-alias-brand-primary,#5686fe);color:#fff}',
      '.stc-button:disabled{opacity:.5;cursor:not-allowed;border-color:var(--dsw-alias-border-l2,rgba(0,0,0,0.10))}',
      '.stc-button[data-tone="primary"]:disabled{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#5686fe) 18%,transparent);color:var(--dsw-alias-brand-primary,#5686fe);border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary,#5686fe) 25%,transparent);opacity:1}',
    ].join('\n');

    function injectStyle() {
      if (document.querySelector('style[data-plugin-css="' + STYLE_ID + '"]') !== null) return;
      const tag = document.createElement('style');
      tag.dataset.plugin = 'dsh-session-title-custom';
      tag.dataset.pluginCss = STYLE_ID;
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }

    /**
     * Bridges the `session-title` settings scope and the Host model catalog
     * onto the card's staged form.
     */
    class TitleCardController {
      constructor(scope, ctx) {
        this.scope = scope;
        this.ctx = ctx;
        this.staged = new Map();
        this.saving = false;
        this.disposed = false;
        this.catalogStatus = 'idle';
        this.groups = [];
        /** 绑定一次即可：projection() 每次渲染都会调用，重复 bind 纯属浪费。 */
        this.t = ctx.locale.bind(NS);
        this.store = clientStore.createSnapshotStore(this.projection());
        scope.subscribe(() => { if (!this.disposed) this.store.set(this.projection()); });
        void this.loadCatalog();
      }

      dispose() {
        this.disposed = true;
      }

      /** Load the Host model directory; failure keeps stored values editable. */
      async loadCatalog() {
        if (this.disposed || this.catalogStatus === 'loading') return;
        this.catalogStatus = 'loading';
        this.publish();
        try {
          const response = await this.ctx.remote.session.modelCatalog();
          if (this.disposed) return;
          if (response.ok) {
            this.groups = response.value.groups;
            this.catalogStatus = 'ready';
          } else {
            this.catalogStatus = 'error';
          }
        } catch {
          if (this.disposed) return;
          this.catalogStatus = 'error';
        }
        this.publish();
      }

      value() {
        return this.scope.getSnapshot().value;
      }

      /** Staged-or-stored state of one numeric field, validated against its range. */
      numericField(field) {
        const staged = this.staged.get(field);
        const range = RANGES[field];
        if (staged === undefined) {
          const value = this.value()?.[field];
          return { text: typeof value === 'number' ? String(value) : '', invalid: false };
        }
        const trimmed = staged.text.trim();
        if (trimmed === '') return { text: staged.text, invalid: true };
        const num = Number(trimmed);
        if (!Number.isFinite(num)) return { text: staged.text, invalid: true };
        if (num < range.min || num > range.max) return { text: staged.text, invalid: true };
        return { text: staged.text, invalid: false };
      }

      effortIds(model) {
        return (model?.reasoning?.efforts ?? []).map(effort => effort.id);
      }

      /** 归一化获取 models 列表，保证老旧单个配置平滑读取为数组第一项 */
      normalizeModels(rawModels, val) {
        if (Array.isArray(rawModels) && rawModels.length > 0) {
          return rawModels.map((m, idx) => ({
            id: m.id || String(idx + 1),
            provider: m.provider || 'xiaomi',
            model: m.model || 'mimo-v2.5',
            reasoningEffort: m.reasoningEffort !== undefined ? m.reasoningEffort : 'off',
          }));
        }
        if (val && val.provider && val.model) {
          return [{
            id: '1',
            provider: val.provider,
            model: val.model,
            reasoningEffort: val.reasoningEffort !== undefined ? val.reasoningEffort : 'off',
          }];
        }
        return [{
          id: '1',
          provider: 'xiaomi',
          model: 'mimo-v2.5',
          reasoningEffort: 'off',
        }];
      }

      projection() {
        const snapshot = this.scope.getSnapshot();
        const value = snapshot.value;
        const normalized = this.normalizeModels(value?.models, value);

        const modelsList = normalized.map((item, idx) => {
          const provider = item.provider || '';
          const model = item.model || '';
          const effort = item.reasoningEffort !== undefined ? item.reasoningEffort : 'off';

          const group = this.groups.find(g => g.id === provider);
          const modelEntries = group?.models ?? [];
          const currentModelEntry = modelEntries.find(m => m.id === model);

          const providers = this.groups.map(g => ({ id: g.id, name: g.name }));
          if (provider !== '' && !providers.some(g => g.id === provider)) {
            providers.unshift({ id: provider, name: provider });
          }

          const models = modelEntries.map(m => ({ id: m.id, name: m.name }));
          if (model !== '' && !models.some(m => m.id === model)) {
            models.unshift({ id: model, name: model });
          }

          const efforts = [{ id: '', name: this.t('effortDefault') }]
            .concat((currentModelEntry?.reasoning?.efforts ?? []).map(e => ({ id: e.id, name: e.name })));
          if (effort !== '' && !efforts.some(e => e.id === effort)) {
            efforts.unshift({ id: effort, name: effort });
          }

          return {
            id: item.id || String(idx + 1),
            provider,
            model,
            effort,
            providers,
            models,
            efforts,
          };
        });

        const fields = {};
        let invalid = false;
        for (const field of NUMERIC) {
          const state = this.numericField(field);
          fields[field] = state;
          if (state.invalid) invalid = true;
        }
        const dirty = this.staged.size > 0;

        return {
          available: snapshot.status === 'ready',
          writable: snapshot.writable,
          enabled: value?.enabled !== false,
          modelsList,
          catalogStatus: this.catalogStatus,
          ...fields,
          dirty,
          invalid: dirty && invalid,
          saving: this.saving,
        };
      }

      publish() {
        if (!this.disposed) this.store.set(this.projection());
      }

      saveModels(nextModels) {
        const snapshot = this.scope.getSnapshot();
        if (this.disposed || snapshot.status !== 'ready' || !snapshot.writable || this.saving) return;
        const payload = nextModels.map((m, idx) => ({
          id: m.id || String(idx + 1),
          provider: m.provider,
          model: m.model,
          reasoningEffort: m.effort !== undefined ? m.effort : (m.reasoningEffort ?? 'off'),
        }));
        void this.scope.set('models', payload);
        if (payload[0]) {
          void this.scope.set('provider', payload[0].provider);
          void this.scope.set('model', payload[0].model);
          void this.scope.set('reasoningEffort', payload[0].reasoningEffort);
        }
      }

      editRow(index, field, val) {
        const list = [...this.normalizeModels(this.value()?.models, this.value())];
        const target = list[index];
        if (!target) return;
        if (field === 'provider') {
          target.provider = val;
          const group = this.groups.find(g => g.id === val);
          if (group && !group.models.some(m => m.id === target.model)) {
            target.model = group.models[0]?.id || '';
            target.reasoningEffort = 'off';
          }
        } else if (field === 'model') {
          target.model = val;
          const group = this.groups.find(g => g.id === target.provider);
          const m = group?.models.find(entry => entry.id === val);
          const allowedEfforts = this.effortIds(m);
          if (target.reasoningEffort && !allowedEfforts.includes(target.reasoningEffort)) {
            target.reasoningEffort = 'off';
          }
        } else if (field === 'effort') {
          target.reasoningEffort = val;
        }
        this.saveModels(list);
      }

      moveUp(index) {
        if (index <= 0) return;
        const list = [...this.normalizeModels(this.value()?.models, this.value())];
        const temp = list[index];
        list[index] = list[index - 1];
        list[index - 1] = temp;
        this.saveModels(list);
      }

      moveDown(index) {
        const list = [...this.normalizeModels(this.value()?.models, this.value())];
        if (index >= list.length - 1) return;
        const temp = list[index];
        list[index] = list[index + 1];
        list[index + 1] = temp;
        this.saveModels(list);
      }

      removeRow(index) {
        const list = [...this.normalizeModels(this.value()?.models, this.value())];
        if (list.length <= 1) return; // 至少保留 1 行
        list.splice(index, 1);
        this.saveModels(list);
      }

      addRow() {
        const list = [...this.normalizeModels(this.value()?.models, this.value())];
        if (list.length >= 5) return; // 最多 5 行
        const firstGroup = this.groups[0];
        const firstModel = firstGroup?.models[0];
        list.push({
          id: String(Date.now()),
          provider: firstGroup?.id || 'deepseek-official',
          model: firstModel?.id || 'deepseek-flash',
          reasoningEffort: 'off',
        });
        this.saveModels(list);
      }

      edit(field, value) {
        const snapshot = this.scope.getSnapshot();
        if (this.disposed || snapshot.status !== 'ready' || !snapshot.writable || this.saving) return;
        if (NUMERIC.includes(field)) {
          this.staged.set(field, { text: value });
          this.publish();
          return;
        }
        void this.scope.set(field, value);
      }

      toggleEnabled() {
        const snapshot = this.scope.getSnapshot();
        if (this.disposed || snapshot.status !== 'ready' || !snapshot.writable || this.saving) return;
        void this.scope.set('enabled', this.value()?.enabled === false);
      }

      save() {
        if (this.disposed || this.saving || this.staged.size === 0) return;
        const writes = [];
        for (const field of NUMERIC) {
          if (!this.staged.has(field)) continue;
          const state = this.numericField(field);
          if (state.invalid) return;
          writes.push({ field, value: Number(state.text.trim()) });
        }
        if (writes.length === 0) return;
        this.saving = true;
        this.publish();
        void (async () => {
          for (const write of writes) await this.scope.set(write.field, write.value);
          if (this.disposed) return;
          this.saving = false;
          this.staged.clear();
          this.publish();
        })();
      }

      discard() {
        if (this.saving) return;
        this.staged.clear();
        this.publish();
      }

      inject() {
        return {
          hooks: { titleCard: this.store },
          edit: (field, value) => { this.edit(field, value); },
          editRow: (index, field, value) => { this.editRow(index, field, value); },
          moveUp: index => { this.moveUp(index); },
          moveDown: index => { this.moveDown(index); },
          removeRow: index => { this.removeRow(index); },
          addRow: () => { this.addRow(); },
          toggleEnabled: () => { this.toggleEnabled(); },
          retryCatalog: () => { void this.loadCatalog(); },
          save: () => { this.save(); },
          discard: () => { this.discard(); },
        };
      }
    }

    /** One numeric field row with its reset control. */
    function numberField(options) {
      const state = options.state;
      return e('div', { className: 'stc-field' },
        e('label', { className: 'stc-field-label', htmlFor: options.id },
          e('span', { className: 'stc-row-title' }, options.label),
          e('span', { className: 'stc-row-hint' }, options.hint)),
        e('div', { className: 'stc-field-control' },
          e('input', {
            id: options.id,
            className: 'stc-input',
            type: 'text',
            inputMode: 'decimal',
            value: state.text,
            disabled: options.disabled,
            'aria-invalid': state.invalid ? 'true' : 'false',
            onChange: event => { options.onEdit(event.target.value); },
          }),
          e('button', {
            type: 'button',
            className: 'stc-button',
            disabled: options.disabled,
            onClick: options.onReset,
          }, options.t('reset'))),
        state.invalid ? e('span', { className: 'stc-field-error' }, options.t('invalidNumber')) : null);
    }

    /** The 会话标题 settings card. */
    function TitleCard(props) {
      const t = props.t;
      const state = props.useTitleCard(snapshot => snapshot);
      if (!state.available) return null;
      const disabled = !state.writable;
      const catalogReady = state.catalogStatus === 'ready';

      return e('section', { className: 'stc-section' },
        e('div', { className: 'stc-heading' },
          e('h3', { className: 'stc-card-title' }, t('cardTitle')),
          e('p', { className: 'stc-card-desc' }, t('cardDescription'))),
        e('div', { className: 'stc-row' },
          e('div', { className: 'stc-row-label' },
            e('span', { className: 'stc-row-title' }, t('enabled')),
            e('span', { className: 'stc-row-hint' }, t('enabledHint'))),
          e('button', {
            type: 'button',
            className: 'stc-switch',
            'data-on': String(state.enabled),
            'aria-pressed': state.enabled,
            'aria-label': t('enabled'),
            disabled,
            onClick: props.toggleEnabled,
          })),

        // 多模型优先级托底表格
        e('div', { className: 'stc-row-label', style: { marginTop: 6 } },
          e('span', { className: 'stc-row-title' }, t('tableTitle')),
          e('span', { className: 'stc-row-hint' }, t('tableHint'))),

        e('div', { className: 'stc-table-wrap' },
          e('div', { className: 'stc-table-head' },
            e('span', { style: { textAlign: 'center' } }, t('colPriority')),
            e('span', null, t('colProvider')),
            e('span', null, t('colModel')),
            e('span', null, t('colEffort')),
            e('span', { style: { textAlign: 'right' } }, t('colActions'))),
          state.modelsList.map((row, idx) =>
            e('div', { key: row.id, className: 'stc-table-row' },
              e('span', { className: 'stc-row-num' }, String(idx + 1)),
              e('select', {
                className: 'stc-table-select',
                value: row.provider,
                disabled: disabled || !catalogReady,
                onChange: ev => { props.editRow(idx, 'provider', ev.target.value); },
              }, row.providers.map(p => e('option', { key: p.id, value: p.id }, p.name))),
              e('select', {
                className: 'stc-table-select',
                value: row.model,
                disabled: disabled || !catalogReady || row.models.length === 0,
                onChange: ev => { props.editRow(idx, 'model', ev.target.value); },
              }, row.models.map(m => e('option', { key: m.id, value: m.id }, m.name))),
              e('select', {
                className: 'stc-table-select',
                value: row.effort,
                disabled: disabled || row.efforts.length <= 1,
                onChange: ev => { props.editRow(idx, 'effort', ev.target.value); },
              }, row.efforts.map(eff => e('option', { key: eff.id, value: eff.id }, eff.name))),
              e('div', { className: 'stc-row-ops' },
                e('button', {
                  type: 'button',
                  className: 'stc-icon-btn',
                  disabled: disabled || idx === 0,
                  title: t('moveUp'),
                  onClick: () => { props.moveUp(idx); },
                }, '▲'),
                e('button', {
                  type: 'button',
                  className: 'stc-icon-btn',
                  disabled: disabled || idx === state.modelsList.length - 1,
                  title: t('moveDown'),
                  onClick: () => { props.moveDown(idx); },
                }, '▼'),
                e('button', {
                  type: 'button',
                  className: 'stc-icon-btn danger',
                  disabled: disabled || state.modelsList.length <= 1,
                  title: t('delete'),
                  onClick: () => { props.removeRow(idx); },
                }, '✕')))),
          e('div', { className: 'stc-table-foot' },
            e('span', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } },
              `${state.modelsList.length} / 5`),
            e('button', {
              type: 'button',
              className: 'stc-add-btn',
              disabled: disabled || !catalogReady || state.modelsList.length >= 5,
              title: t('add'),
              onClick: props.addRow,
            }, '+'))),

        state.catalogStatus === 'error'
          ? e('div', { className: 'stc-catalog-error' },
            e('span', null, t('catalogError')),
            e('button', {
              type: 'button',
              className: 'stc-button',
              disabled,
              onClick: props.retryCatalog,
            }, t('retry')))
          : null,
        numberField({
          id: 'stc-max-tokens',
          label: t('maxTokens'),
          hint: t('maxTokensHint'),
          state: state.maxTokens,
          disabled,
          onEdit: value => { props.edit('maxTokens', value); },
          onReset: () => { props.edit('maxTokens', RESET.maxTokens); },
          t,
        }),
        numberField({
          id: 'stc-max-input',
          label: t('maxInputChars'),
          hint: t('maxInputCharsHint'),
          state: state.maxInputChars,
          disabled,
          onEdit: value => { props.edit('maxInputChars', value); },
          onReset: () => { props.edit('maxInputChars', RESET.maxInputChars); },
          t,
        }),
        numberField({
          id: 'stc-timeout',
          label: t('timeoutMs'),
          hint: t('timeoutMsHint'),
          state: state.timeoutMs,
          disabled,
          onEdit: value => { props.edit('timeoutMs', value); },
          onReset: () => { props.edit('timeoutMs', RESET.timeoutMs); },
          t,
        }),
        numberField({
          id: 'stc-max-title',
          label: t('maxTitleLength'),
          hint: t('maxTitleLengthHint'),
          state: state.maxTitleLength,
          disabled,
          onEdit: value => { props.edit('maxTitleLength', value); },
          onReset: () => { props.edit('maxTitleLength', RESET.maxTitleLength); },
          t,
        }),
        e('div', { className: 'stc-actions' },
          e('button', {
            type: 'button',
            className: 'stc-button',
            'data-tone': 'primary',
            disabled: disabled || !state.dirty || state.invalid || state.saving,
            onClick: props.save,
          }, state.saving ? '...' : t('save')),
          e('button', {
            type: 'button',
            className: 'stc-button',
            disabled: disabled || (!state.dirty && !state.saving),
            onClick: props.discard,
          }, t('discard'))));
    }

    /** Client plugin identity. */
    const name = 'dsh-session-title-custom/client';
    /** Services consumed by this tab. */
    const inject = ['slots', 'locale', 'remote', 'remote.session', 'settingsScope'];

    function apply(ctx) {
      injectStyle();
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-session-title-custom: dictionaries');

      const t = ctx.locale.bind(NS);
      const controller = new TitleCardController(ctx.settingsScope.bind({ namespace: NS }), ctx);
      ctx.effect(() => () => { controller.dispose(); }, 'dsh-session-title-custom: card controller');

      // order 60 keeps this tab right after the 桌宠 tab (order 50).
      ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
        name: 'settings.plugins.tab',
        id: 'session-title',
        order: 60,
        label: () => t('tab'),
        locale: NS,
        inject: () => controller.inject(),
      }, TitleCard));
    }

    exports.name = name;
    exports.inject = inject;
    exports.apply = apply;
    return module.exports;
  },
});
