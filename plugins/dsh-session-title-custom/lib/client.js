/**
 * dsh-session-title-custom — client half.
 *
 * Contributes the "会话标题" tab to the Plugins settings section (right after
 * the 桌宠 tab) and edits the `session-title` settings namespace: the model
 * route, its thinking level, and the title-generation limits the host half
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
      tab: '会话标题',
      cardTitle: '会话标题',
      cardDescription: '会话自动命名所用的模型与生成参数。',
      enabled: '启用自定义命名',
      enabledHint: '关闭后回退到 DSH 内置的会话命名。',
      provider: '服务商',
      providerHint: '标题生成请求路由到的 provider。',
      model: '模型',
      modelHint: '用于提炼标题的模型。',
      effort: '思考档位',
      effortHint: '模型的 reasoning 档位；非思考模型只有默认可用。',
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
      tab: 'Session title',
      cardTitle: 'Session title',
      cardDescription: 'Model and generation limits used for automatic session naming.',
      enabled: 'Custom naming',
      enabledHint: 'Turning this off falls back to the built-in DSH naming.',
      provider: 'Provider',
      providerHint: 'Provider the title request is routed to.',
      model: 'Model',
      modelHint: 'Model that distills the title.',
      effort: 'Thinking level',
      effortHint: 'The model reasoning level; non-reasoning models offer only the default.',
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
      '.stc-switch{position:relative;flex:none;width:40px;height:22px;border:0;border-radius:11px;background:var(--dsw-alias-bg-layer-4);cursor:pointer;transition:background .15s}',
      '.stc-switch[data-on="true"]{background:var(--dsw-alias-brand-primary)}',
      '.stc-switch::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:9px;background:var(--dsw-alias-bg-layer-1);transition:transform .15s}',
      '.stc-switch[data-on="true"]::after{transform:translateX(18px)}',
      '.stc-field{display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:center;padding:8px 0;border-bottom:0.5px solid var(--dsw-alias-border-l2)}',
      '.stc-field-label{display:grid;gap:2px}',
      '.stc-field-control{display:flex;gap:6px;align-items:center}',
      '.stc-input,.stc-select{min-width:96px;max-width:220px;padding:4px 8px;border:0.5px solid var(--dsw-alias-border-l4);border-radius:6px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font-size:12px}',
      '.stc-select{min-width:140px}',
      '.stc-input:focus-visible,.stc-select:focus-visible,.stc-button:focus-visible,.stc-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.stc-input[aria-invalid="true"]{border-color:var(--dsw-alias-label-error)}',
      '.stc-field-error{grid-column:1/-1;font-size:11px;color:var(--dsw-alias-label-error)}',
      '.stc-catalog-error{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:11px;color:var(--dsw-alias-label-error)}',
      '.stc-actions{display:flex;gap:8px;justify-content:flex-end}',
      '.stc-button{border:0.5px solid var(--dsw-alias-border-l4);border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary)}',
      '.stc-button[data-tone="primary"]{border-color:transparent;background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}',
      '.stc-button:disabled{opacity:.4;cursor:default}',
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

      /** Model entry the stored route currently resolves to, when advertised. */
      currentModel() {
        const value = this.value();
        const group = this.groups.find(entry => entry.id === value?.provider);
        return group?.models.find(entry => entry.id === value?.model);
      }

      effortIds(model) {
        return (model?.reasoning?.efforts ?? []).map(effort => effort.id);
      }

      projection() {
        const snapshot = this.scope.getSnapshot();
        const value = snapshot.value;
        const provider = value?.provider ?? '';
        const model = value?.model ?? '';
        const group = this.groups.find(entry => entry.id === provider);
        const modelEntries = group?.models ?? [];
        const entry = modelEntries.find(candidate => candidate.id === model);
        const providers = this.groups.map(candidate => ({ id: candidate.id, name: candidate.name }));
        if (provider !== '' && !providers.some(candidate => candidate.id === provider)) {
          providers.unshift({ id: provider, name: provider });
        }
        const models = modelEntries.map(candidate => ({ id: candidate.id, name: candidate.name }));
        if (model !== '' && !models.some(candidate => candidate.id === model)) {
          models.unshift({ id: model, name: model });
        }
        const fields = {};
        let invalid = false;
        for (const field of NUMERIC) {
          const state = this.numericField(field);
          fields[field] = state;
          if (state.invalid) invalid = true;
        }
        const dirty = this.staged.size > 0;
        const effort = value?.reasoningEffort ?? '';
        const efforts = (entry?.reasoning?.efforts ?? []).map(candidate => ({ id: candidate.id, name: candidate.name }));
        if (effort !== '' && !efforts.some(candidate => candidate.id === effort)) {
          efforts.unshift({ id: effort, name: effort });
        }
        return {
          available: snapshot.status === 'ready',
          writable: snapshot.writable,
          enabled: value?.enabled !== false,
          provider,
          model,
          effort,
          providers,
          models,
          efforts,
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

      /** Stage or persist one field edit. Selects write immediately, numbers stage. */
      edit(field, value) {
        const snapshot = this.scope.getSnapshot();
        if (this.disposed || snapshot.status !== 'ready' || !snapshot.writable || this.saving) return;
        if (NUMERIC.includes(field)) {
          this.staged.set(field, { text: value });
          this.publish();
          return;
        }
        if (field === 'provider') {
          const group = this.groups.find(entry => entry.id === value);
          void this.scope.set('provider', value);
          const current = this.value()?.model;
          if (group !== undefined && !group.models.some(entry => entry.id === current)) {
            const first = group.models[0];
            if (first !== undefined) {
              void this.scope.set('model', first.id);
              const currentEffort = this.value()?.reasoningEffort ?? '';
              if (currentEffort !== '' && !this.effortIds(first).includes(currentEffort)) {
                void this.scope.set('reasoningEffort', '');
              }
            }
          }
          return;
        }
        if (field === 'model') {
          const group = this.groups.find(entry => entry.id === this.value()?.provider);
          const next = group?.models.find(entry => entry.id === value) ?? this.currentModel();
          void this.scope.set('model', value);
          const currentEffort = this.value()?.reasoningEffort ?? '';
          if (currentEffort !== '' && !this.effortIds(next).includes(currentEffort)) {
            void this.scope.set('reasoningEffort', '');
          }
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
          toggleEnabled: () => { this.toggleEnabled(); },
          edit: (field, value) => { this.edit(field, value); },
          retryCatalog: () => { void this.loadCatalog(); },
          save: () => { this.save(); },
          discard: () => { this.discard(); },
        };
      }
    }

    /** One labelled select row. */
    function selectRow(options) {
      return e('div', { className: 'stc-row' },
        e('div', { className: 'stc-row-label' },
          e('label', { className: 'stc-row-title', htmlFor: options.id }, options.label),
          e('span', { className: 'stc-row-hint' }, options.hint)),
        e('select', {
          id: options.id,
          className: 'stc-select',
          value: options.value,
          disabled: options.disabled,
          onChange: event => { options.onChange(event.target.value); },
        }, options.options.map(option =>
          e('option', { key: option.id, value: option.id }, option.name))));
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
      const effortOptions = [{ id: '', name: t('effortDefault') }].concat(state.efforts);
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
        selectRow({
          id: 'stc-provider',
          label: t('provider'),
          hint: t('providerHint'),
          value: state.provider,
          options: state.providers,
          disabled: disabled || !catalogReady,
          onChange: value => { props.edit('provider', value); },
        }),
        selectRow({
          id: 'stc-model',
          label: t('model'),
          hint: t('modelHint'),
          value: state.model,
          options: state.models,
          disabled: disabled || !catalogReady || state.models.length === 0,
          onChange: value => { props.edit('model', value); },
        }),
        selectRow({
          id: 'stc-effort',
          label: t('effort'),
          hint: t('effortHint'),
          value: state.effort,
          options: effortOptions,
          disabled: disabled || state.efforts.length === 0,
          onChange: value => { props.edit('reasoningEffort', value); },
        }),
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
