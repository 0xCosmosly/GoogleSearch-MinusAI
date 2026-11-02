// ==UserScript==
// @name         Google Search Minus AI
// @namespace    http://tampermonkey.net/
// @version      2.7
// @description  Removes Google's AI Overview block and the 'Ask anything' box from search results, leaving the real links.
// @author       0xCosmosly
// @homepageURL  https://github.com/0xCosmosly/GoogleSearch-MinusAI
// @supportURL   https://github.com/0xCosmosly/GoogleSearch-MinusAI/issues
// @match        *://www.google.com/search*
// @icon         https://www.google.com/favicon.ico
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  // Google renders the AI Overview as its own block inside the results column
  // (#rcnt), headed by the literal text "AI Overview". The wrapper classes are
  // hashed and change constantly, so we anchor on the heading text and then
  // walk up to the outermost node that still contains ONLY that block.
  //
  // v1 of this script appended " -ai" to the query instead. That never removed
  // anything — it just changed the search — and Google ignores it for AI
  // Overviews, so the block stayed. This version deletes the block outright.

  const LABEL = /^AI Overview$/i;
  const ASK_PLACEHOLDER = /^ask anything$/i;
  const ROOT_SELECTORS = ['#rcnt', '#center_col', '#search', 'main'];

  let removed = 0;
  let hidden = 0;

  function resultsRoot() {
    for (const sel of ROOT_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return document.body;
  }

  function findLabel(root) {
    const nodes = root.querySelectorAll('div, span, h1, h2, h3');
    for (const el of nodes) {
      const t = (el.innerText || '').trim();
      if (t.length <= 24 && LABEL.test(t)) return el;
    }
    return null;
  }

  function removeOne() {
    const root = resultsRoot();
    if (!root || root === document.body) return false;

    const label = findLabel(root);
    if (!label) return false;

    // Nearest ancestor with real content = the card body.
    let card = label;
    let guard = 0;
    while (card.parentElement && (card.innerText || '').length < 200 && guard++ < 12) {
      card = card.parentElement;
    }
    if ((card.innerText || '').length < 200) return false;

    // Walk up while the parent holds exactly the same text: that is the block.
    const size = (card.innerText || '').length;
    let top = card;
    guard = 0;
    while (
      top.parentElement &&
      top.parentElement !== root &&
      (top.parentElement.innerText || '').length === size &&
      guard++ < 12
    ) {
      top = top.parentElement;
    }

    // Never nuke the results column itself.
    if (top === root || top.contains(root)) return false;

    top.remove();
    removed++;
    return true;
  }

  // The "Ask anything" pill sits above the results. Google gives its wrapper a
  // stack of hashed classes, so anchor on the textarea's placeholder and climb
  // to the outer widget: the last ancestor that is still the same height as the
  // textarea. Hidden rather than removed — it is a live form widget, and
  // display:none collapses its space without tearing anything out of the app.
  function hideAskBox() {
    const ta = [...document.querySelectorAll('textarea')]
      .find((t) => ASK_PLACEHOLDER.test((t.getAttribute('placeholder') || '').trim()));
    if (!ta) return false;
    if (ta.closest('[data-minus-ai-hidden]')) return false;

    // Climb to the outermost shell that still holds ONLY the widget: stop as
    // soon as an ancestor also contains search results or the nav tabs. Using
    // height as the signal fails here — Google wraps parts of this tree in
    // `display: contents`, which measures as 0, and leaves an empty 143px shell
    // above the pill that keeps reserving space.
    const STOP = '[role="main"], #rcnt, #center_col, #search, #main';
    let node = ta;
    let guard = 0;
    while (node.parentElement && guard++ < 14) {
      const parent = node.parentElement;
      if (parent === document.body || parent === document.documentElement) break;
      if (parent.matches(STOP)) break;
      if (parent.querySelector('#rcnt a h3, #search a h3')) break; // results live here
      if (/AI Mode/i.test(parent.innerText || '')) break;          // nav tabs live here
      node = parent;
    }

    if (node === document.body || node === document.documentElement) return false;
    node.style.display = 'none';
    node.setAttribute('data-minus-ai-hidden', '1');

    // Google wraps the widget in several empty shells that keep reserving
    // height even after the pill itself is gone, which shows up as a big blank
    // band under the nav tabs. Collapse those too — but only ancestors with no
    // text of their own and no results or nav inside them.
    let shell = node;
    let up = 0;
    while (shell.parentElement && up++ < 5) {
      const parent = shell.parentElement;
      if (parent === document.body || parent === document.documentElement) break;
      if (parent.matches(STOP)) break;
      if ((parent.innerText || '').trim().length > 0) break;
      if (parent.querySelector('#rcnt a h3, #search a h3')) break;
      if (parent.getBoundingClientRect().height === 0) { shell = parent; continue; }
      parent.style.display = 'none';
      parent.setAttribute('data-minus-ai-hidden', '1');
      shell = parent;
    }

    hidden++;
    return true;
  }

  // Even with the pill gone, Google leaves the empty wrapper that held it
  // (#Odp5De) reserving ~190px — the blank band under the nav tabs. It has a
  // stable id and no content of its own, so collapse it once it is empty.
  function collapseAskShell() {
    const shell = document.getElementById('Odp5De');
    if (!shell || shell.hasAttribute('data-minus-ai-hidden')) return false;
    if ((shell.innerText || '').trim().length) return false;         // has content, leave it
    if (shell.querySelector('#rcnt a h3, #search a h3')) return false; // results inside
    if (shell.getBoundingClientRect().height === 0) return false;      // already collapsed
    shell.style.display = 'none';
    shell.setAttribute('data-minus-ai-hidden', '1');
    return true;
  }

  function sweep() {
    for (let i = 0; i < 5; i++) {
      if (!removeOne()) break;
    }
    hideAskBox();
    collapseAskShell();
  }

  function start() {
    sweep();

    // The block is usually injected after first paint and can re-appear when
    // Google streams more of it in, so keep watching. Debounced to stay cheap.
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      setTimeout(() => {
        queued = false;
        sweep();
      }, 120);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Stop watching after a while: results pages settle, and an observer that
    // lives forever is wasted work on a page the user has moved on from.
    setTimeout(() => observer.disconnect(), 30000);

    window.addEventListener('popstate', () => setTimeout(sweep, 300));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  try {
    Object.defineProperty(window, '__minusAI', {
      get: () => ({ aiOverviewsRemoved: removed, askBoxesHidden: hidden }),
    });
  } catch (e) { /* ignore */ }
})();
