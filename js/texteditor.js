(function(){
  'use strict';

  // Configurable targets
  const EDITOR_ID = 'editor';      // contenteditable
  const SYMBOLS_ID = 'message';     // hidden textarea (WhatsApp symbols)
  const TOOLBAR_SELECTOR = '.formatting-toolbar button[data-action]';

  // Internal state
  let syncing = false;
  let editorEl = null;
  let symbolsEl = null;
  let mutationObserver = null;

  // Safe helpers (no global $)
  const byId = (id) => document.getElementById(id);
  const sel = () => window.getSelection && window.getSelection();

  const focusEditor = () => { if (editorEl) editorEl.focus(); };

  const getAnchorElement = () => {
    const s = sel();
    if (!s || !s.rangeCount) return editorEl;
    const node = s.anchorNode;
    if (!node) return editorEl;
    return node.nodeType === 1 ? node : node.parentElement;
  };

  const unwrap = (el) => {
    if (!el || !el.parentNode) return;
    const p = el.parentNode;
    while (el.firstChild) p.insertBefore(el.firstChild, el);
    p.removeChild(el);
  };

  const placeCaretAtStart = (node) => {
    if (!node) return;
    const range = document.createRange();
    const s = sel();
    range.selectNodeContents(node);
    range.collapse(true);
    s.removeAllRanges();
    s.addRange(range);
  };

  const currentBlock = (node) => {
    const el = node || getAnchorElement();
    return el && el.closest ? (el.closest('li,div,p,pre,blockquote') || editorEl) : editorEl;
  };

  // Formatting actions
  const exec = (cmd, val = null) => {
    if (!editorEl) return;
    document.execCommand(cmd, false, val);
    focusEditor();
    syncHidden();
  };

  const wrapInline = (tag) => {
    if (!editorEl) return;
    const s = sel();
    if (!s || !s.rangeCount) return;
    const range = s.getRangeAt(0);
    if (range.collapsed) return;
    const el = document.createElement(tag);
    try { range.surroundContents(el); }
    catch { const frag = range.extractContents(); el.appendChild(frag); range.insertNode(el); }
    s.removeAllRanges();
    s.addRange(range);
    focusEditor();
    syncHidden();
  };

  const wrapBlock = (tag) => {
    if (!editorEl) return;
    const s = sel();
    if (!s || !s.rangeCount) return;
    const range = s.getRangeAt(0);
    const wrapper = document.createElement(tag);
    const frag = range.extractContents();
    wrapper.appendChild(frag);
    range.insertNode(wrapper);
    wrapper.normalize();
    focusEditor();
    syncHidden();
  };

  const toggleBlockquote = () => {
    const el = getAnchorElement();
    const bq = el && el.closest ? el.closest('blockquote') : null;
    if (bq) {
      const after = document.createElement('div');
      after.innerHTML = '<br>';
      bq.parentNode.insertBefore(after, bq.nextSibling);
      unwrap(bq);
      placeCaretAtStart(after);
    } else {
      exec('formatBlock', 'blockquote');
    }
    syncHidden();
  };

  const toggleList = (type) => {
    if (type === 'ul') exec('insertUnorderedList'); else exec('insertOrderedList');
    const el = getAnchorElement();
    const wrong = el ? (type === 'ul' ? el.closest('ol') : el.closest('ul')) : null;
    if (wrong && !wrong.querySelector('li')) wrong.remove();
    syncHidden();
  };

  const clearBlockContainers = () => {
    const el = getAnchorElement();
    const ul = el && el.closest ? el.closest('ul') : null;
    const ol = el && el.closest ? el.closest('ol') : null;
    const bq = el && el.closest ? el.closest('blockquote') : null;
    if (ul) exec('insertUnorderedList');
    if (ol) exec('insertOrderedList');
    if (bq) unwrap(bq);
    const block = currentBlock();
    if (!block || block === editorEl || (block.tagName === 'LI') || (block.tagName === 'BLOCKQUOTE')) {
      const para = document.createElement('div');
      para.innerHTML = '<br>';
      const host = (el && el.closest && el.closest('ul,ol,blockquote')) || editorEl;
      if (host && host.parentNode) host.parentNode.insertBefore(para, host.nextSibling);
      placeCaretAtStart(para);
    }
    syncHidden();
  };

  const handleAction = (action) => {
    switch (action) {
      case 'bold': exec('bold'); break;
      case 'italic': exec('italic'); break;
      case 'underline': exec('underline'); break;
      case 'strikeThrough': exec('strikeThrough'); break;
      case 'insertUnorderedList': toggleList('ul'); break;
      case 'insertOrderedList': toggleList('ol'); break;
      case 'blockquote': toggleBlockquote(); break;
      case 'inlineCode': wrapInline('code'); break;
      case 'codeBlock': wrapBlock('pre'); break;
      case 'undo': exec('undo'); break;
      case 'redo': exec('redo'); break;
      case 'removeFormat': exec('removeFormat'); clearBlockContainers(); break;
    }
  };

  // Convert HTML -> WhatsApp symbols
  const toWhatsAppMarkup = () => {
    if (!editorEl) return '';
    const doc = new DOMParser().parseFromString(editorEl.innerHTML, 'text/html');
    const serialize = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return node.nodeValue;
      if (node.nodeType !== Node.ELEMENT_NODE) return '';
      const tag = node.tagName.toLowerCase();
      const children = Array.from(node.childNodes).map(serialize).join('');
      switch (tag) {
        case 'b':
        case 'strong': return '*' + children + '*';
        case 'i':
        case 'em': return '_' + children + '_';
        case 'u': return children;
        case 's':
        case 'strike':
        case 'del': return '~' + children + '~';
        case 'code': return '`' + node.textContent.replace(/\n/g, ' ') + '`';
        case 'pre': return '``````';
        case 'blockquote': {
          const text = node.textContent.split('\n').map(l => l.trim() ? '> ' + l : l).join('\n');
          return text + '\n';
        }
        case 'br': return '\n';
        case 'p':
        case 'div': return children + '\n';
        case 'ul': {
          const items = Array.from(node.querySelectorAll(':scope > li')).map(li => '- ' + serialize(li)).join('\n');
          return items + '\n';
        }
        case 'ol': {
          let i = 1;
          const items = Array.from(node.querySelectorAll(':scope > li')).map(li => (i++) + '. ' + serialize(li)).join('\n');
          return items + '\n';
        }
        case 'li': return children;
        default: return children;
      }
    };
    return serialize(doc.body).replace(/\n{3,}/g, '\n\n').trim();
  };

  // Convert WhatsApp symbols -> HTML
  const fromWhatsAppMarkupToHTML = (input) => {
    if (!input) return '';
    const fenceRegex = /``````/g;
    const fenceTokens = [];
    let temp = input.replace(fenceRegex, (m, code) => {
      const token = `__FENCE_${fenceTokens.length}__`;
      fenceTokens.push(code);
      return token;
    });
    const lines = temp.split(/\r?\n/);
    let html = '';
    let inUL = false, inOL = false, inBQ = false;
    const closeListsAndBQ = () => { if (inBQ) { html += '</blockquote>'; inBQ = false; } if (inUL) { html += '</ul>'; inUL = false; } if (inOL) { html += '</ol>'; inOL = false; } };
    const escapeHTML = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const inlineFormat = (s) => {
      const codeRegex = /`([^`]+?)`/g; const codeTokens = [];
      let t = s.replace(codeRegex, (m, c) => { const token = `__CODE_${codeTokens.length}__`; codeTokens.push(c); return token; });
      t = escapeHTML(t);
      t = t.replace(/\*(.+?)\*/g, '<strong>$1</strong>');
      t = t.replace(/_(.+?)_/g, '<em>$1</em>');
      t = t.replace(/~(.+?)~/g, '<del>$1</del>');
      t = t.replace(/__CODE_(\d+)__/g, (m, i) => { const content = escapeHTML(codeTokens[Number(i)] || ''); return `<code>${content}</code>`; });
      return t;
    };
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      if (raw.trim() === '') { closeListsAndBQ(); html += '<div><br></div>'; continue; }
      if (/^>\s+/.test(raw)) { if (!inBQ) { closeListsAndBQ(); html += '<blockquote>'; inBQ = true; } const content = raw.replace(/^>\s+/, ''); html += inlineFormat(content) + '<br>'; continue; }
      if (/^[-*]\s+/.test(raw)) { if (!inUL) { closeListsAndBQ(); html += '<ul>'; inUL = true; } const content = raw.replace(/^[-*]\s+/, ''); html += `<li>${inlineFormat(content)}</li>`; continue; }
      if (/^\d+\.\s+/.test(raw)) { if (!inOL) { closeListsAndBQ(); html += '<ol>'; inOL = true; } const content = raw.replace(/^\d+\.\s+/, ''); html += `<li>${inlineFormat(content)}</li>`; continue; }
      closeListsAndBQ(); html += `<div>${inlineFormat(raw)}</div>`;
    }
    closeListsAndBQ();
    html = html.replace(/__FENCE_(\d+)__/g, (m, i) => { const code = (fenceTokens[Number(i)] || '').replace(/</g,'&lt;').replace(/>/g,'&gt;'); return `<pre>${code}</pre>`; });
    return html;
  };

  // Sync helpers
  const syncHidden = () => {
    if (syncing) return; syncing = true;
    if (symbolsEl) symbolsEl.value = toWhatsAppMarkup();
    syncing = false;
  };

  const syncEditorFromHidden = () => {
    if (syncing) return; syncing = true;
    if (symbolsEl && editorEl) editorEl.innerHTML = fromWhatsAppMarkupToHTML(symbolsEl.value);
    syncing = false;
  };

  const handleEnterExit = (e) => {
    if (e.key !== 'Enter') return;
    const el = getAnchorElement();
    const li = el && el.closest ? el.closest('li') : null;
    if (li) {
      const text = li.textContent.replace(/\u200B/g, '').trim();
      if (text === '') {
        e.preventDefault();
        const list = li.closest('ul,ol');
        const para = document.createElement('div'); para.innerHTML = '<br>';
        list.parentNode.insertBefore(para, list.nextSibling);
        li.remove(); if (!list.querySelector('li')) list.remove();
        placeCaretAtStart(para); syncHidden(); return;
      }
    }
    const bq = el && el.closest ? el.closest('blockquote') : null;
    if (bq) {
      const blk = currentBlock(el);
      const text = (blk && blk.textContent || '').replace(/\u200B/g, '').trim();
      if (text === '') {
        e.preventDefault();
        const para = document.createElement('div'); para.innerHTML = '<br>';
        bq.parentNode.insertBefore(para, bq.nextSibling);
        unwrap(bq); placeCaretAtStart(para); syncHidden(); return;
      }
    }
  };

  // Attach events (with re-init safety)
  const attach = () => {
    if (!editorEl) return;

    // Avoid double-binding
    if (editorEl.dataset.waeditorInit === '1') return;
    editorEl.dataset.waeditorInit = '1';

    // Toolbar
    document.querySelectorAll(TOOLBAR_SELECTOR).forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        handleAction(action);
      });
    });

    // Editor events
    editorEl.addEventListener('input', syncHidden);
    editorEl.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        const k = e.key.toLowerCase();
        if (k === 'b') { e.preventDefault(); handleAction('bold'); }
        if (k === 'i') { e.preventDefault(); handleAction('italic'); }
        if (k === 'u') { e.preventDefault(); handleAction('underline'); }
      }
      handleEnterExit(e);
    });

    // Observe DOM mutations
    mutationObserver = new MutationObserver(() => { Promise.resolve().then(syncHidden); });
    mutationObserver.observe(editorEl, { childList: true, characterData: true, subtree: true });

    // Hidden textarea two-way
    if (symbolsEl) {
      symbolsEl.addEventListener('input', syncEditorFromHidden);
      symbolsEl.addEventListener('change', syncEditorFromHidden);
    }

    // Initial sync
    if (symbolsEl && symbolsEl.value && symbolsEl.value.trim().length > 0) syncEditorFromHidden();
    else syncHidden();
  };

  // Public API (single namespace)
  const WAEditor = {
    init(cfg = {}) {
      editorEl = byId(cfg.editorId || EDITOR_ID);
      symbolsEl = byId(cfg.symbolsId || SYMBOLS_ID);
      attach();
      return this;
    },
    getWhatsAppText() { return toWhatsAppMarkup(); },
    setEditorFromSymbols(text) {
      if (!symbolsEl) symbolsEl = byId(SYMBOLS_ID);
      if (symbolsEl) { symbolsEl.value = text || ''; syncEditorFromHidden(); }
    }
  };

  // Expose only a single global to avoid clashes with jQuery/others
  window.WAEditor = WAEditor;

  // Auto-init if elements exist
  document.addEventListener('DOMContentLoaded', () => {
    const ed = byId(EDITOR_ID);
    if (ed) WAEditor.init();
  });
})();
