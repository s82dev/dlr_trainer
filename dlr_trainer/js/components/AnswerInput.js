/* Antwort-Eingaben: Mehrfachauswahl mit Tastenkürzeln, Zahleneingabe (Tastatur/Nummernfeld). */
(function () {
  'use strict';
  const DLR = window.DLR;
  const U = DLR.util;

  const answer = (DLR.ui.answer = {
    /**
     * options: [{label|html|node}], onPick(index)
     * opts: {labels:['A',...], cols:n, keys:true}
     */
    choices(parent, options, onPick, opts) {
      opts = opts || {};
      const labels = opts.labels || ['A', 'B', 'C', 'D', 'E', 'F'];
      const cols = opts.cols || (options.length <= 3 ? options.length : options.length === 5 ? 5 : 2);
      let locked = false;
      const buttons = options.map((o, i) => {
        const body = U.h('span', { class: 'choice-body' });
        if (o.node) body.appendChild(o.node); else if (o.html) body.innerHTML = o.html; else body.textContent = o.label;
        const b = U.h('button', { type: 'button', class: 'choice', 'data-i': i, onclick: () => pick(i) },
          U.h('span', { class: 'choice-key' }, labels[i] || i + 1), body);
        return b;
      });
      const el = U.h('div', { class: 'choices cols-' + cols }, buttons);
      function pick(i) {
        if (locked) return;
        locked = true;
        buttons[i].classList.add('picked');
        onPick(i);
      }
      const keyHandler = (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        const k = e.key.toLowerCase();
        let idx = labels.findIndex((l) => String(l).toLowerCase() === k);
        if (idx < 0 && /^[1-9]$/.test(k)) idx = parseInt(k, 10) - 1;
        if (idx >= 0 && idx < options.length) { pick(idx); return true; }
        return false;
      };
      parent.appendChild(el);
      return { el, keyHandler, lock() { locked = true; }, buttons };
    },

    /** Zahleneingabe. onSubmit(number). */
    numeric(parent, onSubmit, opts) {
      opts = opts || {};
      let locked = false;
      const input = U.h('input', {
        type: 'text', class: 'num-input', inputmode: opts.decimals === false ? 'numeric' : 'decimal',
        autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Antwort', placeholder: opts.placeholder || '',
      });
      const shake = () => { input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake'); };
      const submit = () => {
        if (locked) return;
        const raw = input.value.trim();
        if (raw === '') { shake(); return; }
        const v = U.parseNumber(raw);
        if (isNaN(v)) { shake(); return; }
        locked = true;
        onSubmit(v);
      };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
      const row = U.h('div', { class: 'num-row' }, input,
        opts.unit ? U.h('span', { class: 'num-unit' }, opts.unit) : null,
        U.h('button', { type: 'button', class: 'btn primary num-ok', onclick: submit }, 'OK'));
      parent.appendChild(row);
      setTimeout(() => { try { input.focus(); } catch (e) { /* ignore */ } }, 30);
      return { el: row, input, focus() { input.focus(); }, lock() { locked = true; input.disabled = true; } };
    },
  });
})();
