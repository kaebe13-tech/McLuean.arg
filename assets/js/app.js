/* =========================================================
   Sailor Piece Wiki — Shell (nav, footer, search, modal)
   ========================================================= */

const NAV_LINKS = [
  { href: 'index.html',     label: 'Play',      key: 'home' },
  { href: 'fruits.html',    label: 'Fruits',    key: 'fruits' },
  { href: 'swords.html',    label: 'Swords',    key: 'swords' },
  { href: 'styles.html',    label: 'Styles',    key: 'styles' },
  { href: 'races.html',     label: 'Races',     key: 'races' },
  { href: 'locations.html', label: 'Islands',   key: 'locations' },
  { href: 'bosses.html',    label: 'Bosses',    key: 'bosses' },
  { href: 'updates.html',   label: 'Updates',   key: 'updates' },
];

/* ------- SVG icon library ------- */
export const Icons = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.4-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 1-5 0 0 2 1 4 5"/></svg>',
  ice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/></svg>',
  lightning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>',
  light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg>',
  magma: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18M5 20l3-7 3 5 4-9 4 11"/></svg>',
  smoke: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 15a4 4 0 1 1 4-7 5 5 0 0 1 9 2 4 4 0 0 1-1 8H7a3 3 0 0 1 0-6"/></svg>',
  earth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  wind: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h12a3 3 0 1 0-3-3M3 12h17a3 3 0 1 1-3 3M3 16h10"/></svg>',
  water: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13z"/></svg>',
  beast: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9c0-3 2-5 4-5l1 2 2-2 2 2 1-2c2 0 4 2 4 5v3c0 5-3 9-7 9s-7-4-7-9V9z"/><path d="M9 13h.01M15 13h.01"/></svg>',
  string: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 3l18 18M3 21L21 3M3 12h18M12 3v18"/></svg>',
  rubber: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12c0-4 3-7 7-7s7 3 7 7-3 7-7 7c-2 0-3-1-3-3 0 0 2-1 4-3"/></svg>',
  sand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14L9 19h10M5 5l4 14"/></svg>',
  sword: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l3-3M16 16l4 4"/></svg>',
  fist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11V8a2 2 0 0 1 4 0v3M9 11V6a2 2 0 0 1 4 0v5M13 11V7a2 2 0 0 1 4 0v6c0 4-2 7-6 7H8c-2 0-3-1-3-3v-3"/></svg>',
  haki: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>',
  island: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18c2-1 4-1 6 0s4 1 6 0 4-1 6 0M12 16V6M12 6l4 3M12 6l-4 3"/></svg>',
  skull: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a8 8 0 0 0-8 8c0 3 1 5 3 6v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2c2-1 3-3 3-6a8 8 0 0 0-8-8z"/><path d="M9 12h.01M15 12h.01M10 17h4"/></svg>',
  human: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="7" r="3"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7"/></svg>',
  fish: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c4-5 9-5 13-1l5-3-2 5 2 5-5-3c-4 4-9 4-13-1"/><circle cx="9" cy="12" r=".8"/></svg>',
  sky: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 16h6a3 3 0 0 0 0-6 5 5 0 0 0-9 2M14 19h7a3 3 0 0 0 0-6"/></svg>',
  cyborg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 9h.01M15 9h.01M9 14h6"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>',
  scroll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h12v14a3 3 0 0 0 3 3H7a3 3 0 0 1-3-3V4z"/><path d="M8 9h6M8 13h6"/></svg>',
  gravity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M3 12h2M19 12h2M12 3v2M12 19v2"/></svg>',
  soul: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.5-7 11-7 11z"/><path d="M9 9h.01M15 9h.01"/></svg>',
  operation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" stroke-dasharray="3 2"/><path d="M12 7v10M7 12h10"/></svg>',
  spider: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M9 11L4 7M15 11l5-4M9 13l-5 4M15 13l5 4M11 9V4M13 9V4M11 15v5M13 15v5"/></svg>',
  wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.83 2.83 0 1 1-4-4z"/></svg>',
  dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
};

/* ------- Header / Nav / Footer injection ------- */
function injectHeader() {
  const active = document.body.dataset.page || 'home';
  const headerHtml = `
    <header class="site-header">
      <div class="container">
        <a href="index.html" class="brand">
          <span class="brand-mark">SP</span>
          <span>Sailor Piece <em style="color:var(--gold);font-style:italic;font-weight:400">· Wiki</em></span>
        </a>
        <nav class="nav" id="primary-nav" aria-label="Primary">
          ${NAV_LINKS.map(l => `<a href="${l.href}" ${l.key===active?'class="active"':''}>${l.label}</a>`).join('')}
        </nav>
        <div class="header-actions">
          <button class="icon-btn" id="search-btn" aria-label="Search (press /)">${Icons.search}</button>
          <button class="icon-btn menu-btn" id="menu-btn" aria-label="Open menu">${Icons.menu}</button>
        </div>
      </div>
    </header>`;
  document.body.insertAdjacentHTML('afterbegin', headerHtml);

  document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('primary-nav').classList.toggle('open');
  });
  document.getElementById('search-btn').addEventListener('click', openSearch);
}

function injectFooter() {
  const footerHtml = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <a class="brand" href="index.html"><span class="brand-mark">SP</span><span>Sailor Piece Wiki</span></a>
            <p style="margin-top:14px;max-width:36ch;font-size:0.92rem">A community-curated guide to the seas, fruits, swords, and bosses of Sailor Piece. Open-source — contributions welcome.</p>
          </div>
          <div>
            <h5>Catalog</h5>
            <ul>
              <li><a href="fruits.html">Fruits</a></li>
              <li><a href="swords.html">Swords</a></li>
              <li><a href="styles.html">Fighting Styles</a></li>
              <li><a href="races.html">Races</a></li>
            </ul>
          </div>
          <div>
            <h5>World</h5>
            <ul>
              <li><a href="locations.html">Islands</a></li>
              <li><a href="bosses.html">Bosses</a></li>
              <li><a href="updates.html">Update Log</a></li>
            </ul>
          </div>
          <div>
            <h5>Contribute</h5>
            <ul>
              <li><a href="https://github.com/" target="_blank" rel="noopener">Edit on GitHub</a></li>
              <li><a href="https://github.com/" target="_blank" rel="noopener">Report an issue</a></li>
              <li><a href="#" id="open-search-foot">Search wiki</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Sailor Piece Wiki · Fan project, not affiliated with the game's developers.</span>
          <span>Press <kbd style="font-family:var(--font-mono);padding:2px 6px;border:1px solid var(--border-soft);border-radius:4px;font-size:0.75rem">/</kbd> to search</span>
        </div>
      </div>
    </footer>`;
  document.body.insertAdjacentHTML('beforeend', footerHtml);
  document.getElementById('open-search-foot')?.addEventListener('click', e => { e.preventDefault(); openSearch(); });
}

/* ------- Modal ------- */
let modalEl = null;
function ensureModal() {
  if (modalEl) return modalEl;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-backdrop" id="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal" id="modal-content"></div>
    </div>`);
  modalEl = document.getElementById('modal-backdrop');
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeModal();
  });
  return modalEl;
}
export function openModal(html, glow) {
  ensureModal();
  const content = document.getElementById('modal-content');
  content.style.setProperty('--modal-glow', glow || 'rgba(245,197,66,0.18)');
  content.innerHTML = html;
  modalEl.classList.add('open');
  document.body.style.overflow = 'hidden';
  content.querySelector('.modal-close')?.addEventListener('click', closeModal);
}
export function closeModal() {
  if (!modalEl) return;
  modalEl.classList.remove('open');
  document.body.style.overflow = '';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
}

/* ------- Search overlay ------- */
let allEntries = [];
let searchOverlay = null;

export function registerSearch(entries) {
  allEntries = allEntries.concat(entries);
}

function ensureSearchOverlay() {
  if (searchOverlay) return searchOverlay;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="search-overlay" id="search-overlay" role="dialog" aria-modal="true">
      <div class="search-panel">
        <div class="search-panel-input">
          ${Icons.search}
          <input type="text" id="search-overlay-input" placeholder="Search fruits, swords, islands, bosses..." autocomplete="off"/>
          <kbd>ESC</kbd>
        </div>
        <div class="search-results" id="search-results"></div>
      </div>
    </div>`);
  searchOverlay = document.getElementById('search-overlay');
  searchOverlay.addEventListener('click', e => { if (e.target === searchOverlay) closeSearch(); });
  document.getElementById('search-overlay-input').addEventListener('input', renderSearchResults);
  return searchOverlay;
}

function openSearch() {
  ensureSearchOverlay();
  searchOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  const input = document.getElementById('search-overlay-input');
  input.value = '';
  renderSearchResults();
  setTimeout(() => input.focus(), 0);
}
function closeSearch() {
  if (!searchOverlay) return;
  searchOverlay.classList.remove('open');
  document.body.style.overflow = '';
}
function renderSearchResults() {
  const q = (document.getElementById('search-overlay-input')?.value || '').trim().toLowerCase();
  const container = document.getElementById('search-results');
  if (!container) return;
  let matches = allEntries;
  if (q) {
    matches = allEntries.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.subtitle || '').toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q) ||
      (e.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }
  if (!matches.length) {
    container.innerHTML = `<div class="empty" style="margin:16px;border:0">No results for "${escapeHtml(q)}"</div>`;
    return;
  }
  const grouped = matches.reduce((acc, e) => {
    (acc[e.category] = acc[e.category] || []).push(e);
    return acc;
  }, {});
  container.innerHTML = Object.entries(grouped).map(([cat, items]) => `
    <div class="group">${cat}</div>
    ${items.slice(0, 8).map(it => `
      <a class="search-result" href="${it.url}">
        <span class="ico" style="color:${it.color || 'var(--gold)'}">${Icons[it.icon] || Icons.star}</span>
        <span class="text">
          <span class="t">${escapeHtml(it.name)}</span>
          <span class="s">${escapeHtml(it.subtitle || '')}</span>
        </span>
      </a>
    `).join('')}
  `).join('');
}

/* ------- Global keyboard ------- */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeSearch();
    closeModal();
  }
  if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {
    e.preventDefault();
    openSearch();
  }
});

/* ------- Helpers ------- */
export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, m => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
  ));
}
export function fmtNum(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return (n/1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
  if (n >= 1_000) return (n/1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'K';
  return String(n);
}

/* ------- Boot ------- */
document.addEventListener('DOMContentLoaded', () => {
  injectHeader();
  injectFooter();
  ensureModal();
  ensureSearchOverlay();
});
