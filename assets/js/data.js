/* =========================================================
   Sailor Piece Wiki — Data renderers
   ========================================================= */

import { Icons, openModal, escapeHtml, fmtNum, registerSearch } from './app.js';

/* Generic JSON loader */
async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

/* ---------- FRUITS ---------- */
function fruitCard(f) {
  return `
    <button class="card" data-id="${f.id}" style="--card-glow:${f.color}33;--card-color:${f.color}">
      <div class="card-head">
        <div class="card-icon" style="color:${f.color}">${Icons[f.icon] || Icons.star}</div>
        <div class="card-head-text">
          <div class="card-title">${escapeHtml(f.name)}</div>
          <div class="card-sub">${escapeHtml(f.type)} · ${fmtNum(f.price)} Beli</div>
        </div>
      </div>
      <p class="card-desc">${escapeHtml(f.description)}</p>
      <div class="card-foot">
        <span class="badge badge-rarity" data-rarity="${f.rarity}">${f.rarity}</span>
        <span class="badge badge-type">${escapeHtml(f.type)}</span>
        ${f.awakening ? `<span class="badge badge-tier">Awakened</span>` : ''}
      </div>
    </button>`;
}

function fruitModal(f) {
  return `
    <div class="modal-head">
      <button class="modal-close" aria-label="Close">${Icons.close}</button>
      <span class="eyebrow">Devil Fruit</span>
      <div class="icon-lg" style="--card-color:${f.color};color:${f.color}">${Icons[f.icon] || Icons.star}</div>
      <h2>${escapeHtml(f.name)}</h2>
      <p>${escapeHtml(f.description)}</p>
      <div class="modal-meta">
        <span class="badge badge-rarity" data-rarity="${f.rarity}">${f.rarity}</span>
        <span class="badge badge-type">${escapeHtml(f.type)}</span>
        ${f.awakening ? `<span class="badge badge-tier">Awakened Form</span>` : ''}
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-section">
        <h4>Stats</h4>
        <dl class="kv">
          <dt>Type</dt><dd>${escapeHtml(f.type)}</dd>
          <dt>Rarity</dt><dd>${escapeHtml(f.rarity)}</dd>
          <dt>Price</dt><dd>${fmtNum(f.price)} Beli</dd>
          <dt>Element</dt><dd style="color:${f.color}">${escapeHtml(f.element || '—')}</dd>
          <dt>Awakening</dt><dd>${f.awakening ? 'Available' : 'Not yet implemented'}</dd>
        </dl>
      </div>
      <div class="modal-section">
        <h4>Moveset</h4>
        <div class="move-list">
          ${f.abilities.map(a => `
            <div class="move">
              <div class="move-key">${a.key}</div>
              <div class="move-info">
                <div class="name">${escapeHtml(a.name)}</div>
                <div class="desc">${escapeHtml(a.desc)}</div>
              </div>
              <div class="move-cd">${a.cooldown ? a.cooldown + 's CD' : ''}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ${f.tips?.length ? `
        <div class="modal-section">
          <h4>Tips</h4>
          <ul style="padding-left:18px;color:var(--text-muted);font-size:0.92rem;display:flex;flex-direction:column;gap:6px">
            ${f.tips.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
          </ul>
        </div>` : ''}
    </div>`;
}

/* ---------- SWORDS ---------- */
function swordCard(s) {
  return `
    <button class="card" data-id="${s.id}" style="--card-glow:rgba(245,197,66,0.2);--card-color:var(--gold)">
      <div class="card-head">
        <div class="card-icon">${Icons.sword}</div>
        <div class="card-head-text">
          <div class="card-title">${escapeHtml(s.name)}</div>
          <div class="card-sub">${escapeHtml(s.obtain)}</div>
        </div>
      </div>
      <p class="card-desc">${escapeHtml(s.description)}</p>
      <div class="card-foot">
        <span class="badge badge-rarity" data-rarity="${s.rarity}">${s.rarity}</span>
        ${s.tier ? `<span class="badge badge-tier">${escapeHtml(s.tier)}</span>` : ''}
      </div>
    </button>`;
}
function swordModal(s) {
  return `
    <div class="modal-head">
      <button class="modal-close" aria-label="Close">${Icons.close}</button>
      <span class="eyebrow">Blade</span>
      <div class="icon-lg">${Icons.sword}</div>
      <h2>${escapeHtml(s.name)}</h2>
      <p>${escapeHtml(s.description)}</p>
      <div class="modal-meta">
        <span class="badge badge-rarity" data-rarity="${s.rarity}">${s.rarity}</span>
        ${s.tier ? `<span class="badge badge-tier">${escapeHtml(s.tier)}</span>` : ''}
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-section">
        <h4>Acquisition</h4>
        <dl class="kv">
          <dt>Obtained from</dt><dd>${escapeHtml(s.obtain)}</dd>
          <dt>Drop chance</dt><dd>${escapeHtml(s.dropChance || '—')}</dd>
          <dt>Required level</dt><dd>${s.requiredLevel ? 'Lvl ' + s.requiredLevel : '—'}</dd>
        </dl>
      </div>
      <div class="modal-section">
        <h4>Moveset</h4>
        <div class="move-list">
          ${s.moves.map(a => `
            <div class="move">
              <div class="move-key">${a.key}</div>
              <div class="move-info">
                <div class="name">${escapeHtml(a.name)}</div>
                <div class="desc">${escapeHtml(a.desc)}</div>
              </div>
              <div class="move-cd">${a.cooldown ? a.cooldown + 's CD' : ''}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}

/* ---------- STYLES ---------- */
function styleCard(s) {
  return `
    <button class="card" data-id="${s.id}" style="--card-glow:rgba(56,189,248,0.18);--card-color:var(--cyan)">
      <div class="card-head">
        <div class="card-icon">${Icons[s.icon] || Icons.fist}</div>
        <div class="card-head-text">
          <div class="card-title">${escapeHtml(s.name)}</div>
          <div class="card-sub">${escapeHtml(s.teacher || 'Self-taught')}</div>
        </div>
      </div>
      <p class="card-desc">${escapeHtml(s.description)}</p>
      <div class="card-foot">
        <span class="badge badge-rarity" data-rarity="${s.rarity}">${s.rarity}</span>
        ${s.requiredLevel ? `<span class="badge badge-tier">Lvl ${s.requiredLevel}</span>` : ''}
      </div>
    </button>`;
}
function styleModal(s) {
  return `
    <div class="modal-head">
      <button class="modal-close" aria-label="Close">${Icons.close}</button>
      <span class="eyebrow">Fighting Style</span>
      <div class="icon-lg" style="--card-color:var(--cyan);color:var(--cyan)">${Icons[s.icon] || Icons.fist}</div>
      <h2>${escapeHtml(s.name)}</h2>
      <p>${escapeHtml(s.description)}</p>
      <div class="modal-meta">
        <span class="badge badge-rarity" data-rarity="${s.rarity}">${s.rarity}</span>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-section">
        <h4>How to learn</h4>
        <dl class="kv">
          <dt>Teacher</dt><dd>${escapeHtml(s.teacher || '—')}</dd>
          <dt>Location</dt><dd>${escapeHtml(s.location || '—')}</dd>
          <dt>Cost</dt><dd>${s.cost != null ? fmtNum(s.cost) + ' Beli' : '—'}</dd>
          <dt>Required level</dt><dd>${s.requiredLevel ? 'Lvl ' + s.requiredLevel : '—'}</dd>
        </dl>
      </div>
      <div class="modal-section">
        <h4>Moveset</h4>
        <div class="move-list">
          ${s.moves.map(a => `
            <div class="move">
              <div class="move-key">${a.key}</div>
              <div class="move-info">
                <div class="name">${escapeHtml(a.name)}</div>
                <div class="desc">${escapeHtml(a.desc)}</div>
              </div>
              <div class="move-cd">${a.cooldown ? a.cooldown + 's CD' : ''}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}

/* ---------- RACES ---------- */
function raceCard(r) {
  return `
    <button class="card" data-id="${r.id}" style="--card-glow:${r.color}33;--card-color:${r.color}">
      <div class="card-head">
        <div class="card-icon" style="color:${r.color}">${Icons[r.icon] || Icons.human}</div>
        <div class="card-head-text">
          <div class="card-title">${escapeHtml(r.name)}</div>
          <div class="card-sub">${escapeHtml(r.spawnRate || 'Unknown spawn rate')}</div>
        </div>
      </div>
      <p class="card-desc">${escapeHtml(r.description)}</p>
      <div class="card-foot">
        <span class="badge badge-rarity" data-rarity="${r.rarity}">${r.rarity}</span>
        ${r.passive ? `<span class="badge badge-type">Passive</span>` : ''}
      </div>
    </button>`;
}
function raceModal(r) {
  return `
    <div class="modal-head">
      <button class="modal-close" aria-label="Close">${Icons.close}</button>
      <span class="eyebrow">Race</span>
      <div class="icon-lg" style="--card-color:${r.color};color:${r.color}">${Icons[r.icon] || Icons.human}</div>
      <h2>${escapeHtml(r.name)}</h2>
      <p>${escapeHtml(r.description)}</p>
      <div class="modal-meta">
        <span class="badge badge-rarity" data-rarity="${r.rarity}">${r.rarity}</span>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-section">
        <h4>Traits</h4>
        <dl class="kv">
          <dt>Spawn rate</dt><dd>${escapeHtml(r.spawnRate || '—')}</dd>
          <dt>Passive</dt><dd>${escapeHtml(r.passive || '—')}</dd>
          <dt>Strengths</dt><dd>${escapeHtml((r.strengths || []).join(', ') || '—')}</dd>
          <dt>Weaknesses</dt><dd>${escapeHtml((r.weaknesses || []).join(', ') || '—')}</dd>
        </dl>
      </div>
      ${r.upgrades?.length ? `
        <div class="modal-section">
          <h4>V2 / Awakening</h4>
          <ul style="padding-left:18px;color:var(--text-muted);font-size:0.92rem;display:flex;flex-direction:column;gap:6px">
            ${r.upgrades.map(u => `<li>${escapeHtml(u)}</li>`).join('')}
          </ul>
        </div>` : ''}
    </div>`;
}

/* ---------- LOCATIONS ---------- */
function locationCard(l) {
  return `
    <button class="card" data-id="${l.id}" style="--card-glow:rgba(45,212,191,0.18);--card-color:var(--teal)">
      <div class="card-head">
        <div class="card-icon" style="color:var(--teal)">${Icons.island}</div>
        <div class="card-head-text">
          <div class="card-title">${escapeHtml(l.name)}</div>
          <div class="card-sub">${escapeHtml(l.sea)} · Lvl ${l.levelRange}</div>
        </div>
      </div>
      <p class="card-desc">${escapeHtml(l.description)}</p>
      <div class="card-foot">
        <span class="badge badge-tier">${escapeHtml(l.sea)}</span>
        <span class="badge badge-type">Lvl ${l.levelRange}</span>
      </div>
    </button>`;
}
function locationModal(l) {
  return `
    <div class="modal-head">
      <button class="modal-close" aria-label="Close">${Icons.close}</button>
      <span class="eyebrow">Island</span>
      <div class="icon-lg" style="--card-color:var(--teal);color:var(--teal)">${Icons.island}</div>
      <h2>${escapeHtml(l.name)}</h2>
      <p>${escapeHtml(l.description)}</p>
      <div class="modal-meta">
        <span class="badge badge-tier">${escapeHtml(l.sea)}</span>
        <span class="badge badge-type">Lvl ${l.levelRange}</span>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-section">
        <h4>Overview</h4>
        <dl class="kv">
          <dt>Sea</dt><dd>${escapeHtml(l.sea)}</dd>
          <dt>Level range</dt><dd>${escapeHtml(l.levelRange)}</dd>
          <dt>Climate</dt><dd>${escapeHtml(l.climate || '—')}</dd>
          <dt>Travel from</dt><dd>${escapeHtml(l.travelFrom || '—')}</dd>
        </dl>
      </div>
      <div class="modal-section">
        <h4>NPCs &amp; Mobs</h4>
        <ul style="padding-left:18px;color:var(--text-muted);font-size:0.92rem;display:flex;flex-direction:column;gap:6px">
          ${(l.npcs || []).map(n => `<li>${escapeHtml(n)}</li>`).join('') || '<li>—</li>'}
        </ul>
      </div>
      ${l.notable?.length ? `
        <div class="modal-section">
          <h4>Notable Drops &amp; Quests</h4>
          <ul style="padding-left:18px;color:var(--text-muted);font-size:0.92rem;display:flex;flex-direction:column;gap:6px">
            ${l.notable.map(n => `<li>${escapeHtml(n)}</li>`).join('')}
          </ul>
        </div>` : ''}
    </div>`;
}

/* ---------- BOSSES ---------- */
function bossCard(b) {
  return `
    <button class="card" data-id="${b.id}" style="--card-glow:rgba(251,113,133,0.18);--card-color:var(--coral)">
      <div class="card-head">
        <div class="card-icon" style="color:var(--coral)">${Icons.skull}</div>
        <div class="card-head-text">
          <div class="card-title">${escapeHtml(b.name)}</div>
          <div class="card-sub">Lvl ${b.level} · ${escapeHtml(b.location)}</div>
        </div>
      </div>
      <p class="card-desc">${escapeHtml(b.description)}</p>
      <div class="card-foot">
        <span class="badge badge-rarity" data-rarity="${b.rarity}">${b.rarity}</span>
        <span class="badge badge-type">${fmtNum(b.hp)} HP</span>
      </div>
    </button>`;
}
function bossModal(b) {
  return `
    <div class="modal-head">
      <button class="modal-close" aria-label="Close">${Icons.close}</button>
      <span class="eyebrow">Boss</span>
      <div class="icon-lg" style="--card-color:var(--coral);color:var(--coral)">${Icons.skull}</div>
      <h2>${escapeHtml(b.name)}</h2>
      <p>${escapeHtml(b.description)}</p>
      <div class="modal-meta">
        <span class="badge badge-rarity" data-rarity="${b.rarity}">${b.rarity}</span>
        <span class="badge badge-type">Lvl ${b.level}</span>
        <span class="badge badge-tier">${fmtNum(b.hp)} HP</span>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-section">
        <h4>Encounter</h4>
        <dl class="kv">
          <dt>Location</dt><dd>${escapeHtml(b.location)}</dd>
          <dt>Respawn</dt><dd>${escapeHtml(b.respawn || '—')}</dd>
          <dt>Difficulty</dt><dd>${escapeHtml(b.difficulty || '—')}</dd>
          <dt>Recommended lvl</dt><dd>${b.recommendedLevel ? 'Lvl ' + b.recommendedLevel : '—'}</dd>
        </dl>
      </div>
      <div class="modal-section">
        <h4>Drops</h4>
        <ul style="padding-left:18px;color:var(--text-muted);font-size:0.92rem;display:flex;flex-direction:column;gap:6px">
          ${(b.drops || []).map(d => `<li>${escapeHtml(d.name)} <span style="color:var(--text-dim)">— ${escapeHtml(d.chance)}</span></li>`).join('') || '<li>—</li>'}
        </ul>
      </div>
      ${b.strategy ? `
        <div class="modal-section">
          <h4>Strategy</h4>
          <p style="color:var(--text-muted);font-size:0.92rem">${escapeHtml(b.strategy)}</p>
        </div>` : ''}
    </div>`;
}

/* ---------- Page renderers ---------- */
const RENDERERS = {
  fruits:    { card: fruitCard,    modal: fruitModal,    icon: 'flame', color: 'var(--coral)', cat: 'Fruits',    page: 'fruits.html',    types: f => [f.type], rarities: true },
  swords:    { card: swordCard,    modal: swordModal,    icon: 'sword', color: 'var(--gold)',  cat: 'Swords',    page: 'swords.html',    rarities: true },
  styles:    { card: styleCard,    modal: styleModal,    icon: 'fist',  color: 'var(--cyan)',  cat: 'Styles',    page: 'styles.html',    rarities: true },
  races:     { card: raceCard,     modal: raceModal,     icon: 'human', color: 'var(--teal)',  cat: 'Races',     page: 'races.html',     rarities: true },
  locations: { card: locationCard, modal: locationModal, icon: 'island',color: 'var(--teal)',  cat: 'Islands',   page: 'locations.html' },
  bosses:    { card: bossCard,     modal: bossModal,     icon: 'skull', color: 'var(--coral)', cat: 'Bosses',    page: 'bosses.html',    rarities: true },
};

function buildFilters(items, kind) {
  const cfg = RENDERERS[kind];
  const filterRoot = document.getElementById('filters');
  if (!filterRoot) return;

  // Build chips dynamically (rarity / sea / type)
  const chipGroups = [];
  if (cfg.rarities) {
    const rarities = [...new Set(items.map(i => i.rarity).filter(Boolean))];
    if (rarities.length > 1) chipGroups.push({ key: 'rarity', label: 'Rarity', values: rarities });
  }
  if (kind === 'fruits') {
    chipGroups.push({ key: 'type', label: 'Type', values: [...new Set(items.map(i => i.type))] });
  }
  if (kind === 'locations') {
    chipGroups.push({ key: 'sea', label: 'Sea', values: [...new Set(items.map(i => i.sea))] });
  }

  filterRoot.innerHTML = `
    <div class="search-input">
      ${Icons.search}
      <input type="text" id="filter-search" placeholder="Search ${cfg.cat.toLowerCase()}..." autocomplete="off"/>
    </div>
    ${chipGroups.map(g => `
      <div class="chips" data-group="${g.key}">
        <button class="chip active" data-value="">All ${g.label}</button>
        ${g.values.map(v => `<button class="chip" data-value="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join('')}
      </div>
    `).join('')}
  `;

  const state = { q: '', filters: {} };

  filterRoot.addEventListener('input', e => {
    if (e.target.id === 'filter-search') {
      state.q = e.target.value.trim().toLowerCase();
      apply();
    }
  });
  filterRoot.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const group = chip.parentElement.dataset.group;
    chip.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.filters[group] = chip.dataset.value;
    apply();
  });

  function apply() {
    const list = items.filter(i => {
      if (state.q) {
        const hay = [i.name, i.description, i.type, i.sea, i.location, i.rarity, ...(i.tags||[])]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(state.q)) return false;
      }
      for (const [k, v] of Object.entries(state.filters)) {
        if (!v) continue;
        if (i[k] !== v) return false;
      }
      return true;
    });
    renderGrid(list, kind);
  }
}

function renderGrid(items, kind) {
  const cfg = RENDERERS[kind];
  const grid = document.getElementById('grid');
  if (!grid) return;
  if (!items.length) {
    grid.outerHTML = `<div class="empty" id="grid">No matches. Try a different filter.</div>`;
    return;
  }
  grid.innerHTML = items.map(cfg.card).join('');
  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const item = items.find(i => i.id === id);
      if (!item) return;
      openModal(cfg.modal(item), item.color ? item.color + '33' : 'rgba(245,197,66,0.18)');
      history.replaceState(null, '', '#' + id);
    });
  });
}

/* Public: render a catalog page */
export async function renderCatalog(kind, jsonPath) {
  const cfg = RENDERERS[kind];
  let items = [];
  try {
    items = await loadJson(jsonPath);
  } catch (err) {
    console.error(err);
    document.getElementById('grid').innerHTML = `<div class="empty">Failed to load data. ${escapeHtml(err.message)}</div>`;
    return;
  }
  buildFilters(items, kind);
  renderGrid(items, kind);

  // Register in global search
  registerSearch(items.map(i => ({
    name: i.name,
    subtitle: i.type || i.sea || i.location || i.rarity || '',
    description: i.description,
    category: cfg.cat,
    icon: i.icon || cfg.icon,
    color: i.color || cfg.color,
    url: cfg.page + '#' + i.id,
    tags: [i.rarity, i.type, i.sea].filter(Boolean),
  })));

  // Deep link
  if (location.hash) {
    const id = location.hash.slice(1);
    const item = items.find(i => i.id === id);
    if (item) openModal(cfg.modal(item), item.color ? item.color + '33' : 'rgba(245,197,66,0.18)');
  }
}

/* ---------- Updates timeline ---------- */
export async function renderUpdates(jsonPath) {
  const root = document.getElementById('timeline');
  if (!root) return;
  let updates = [];
  try {
    updates = await loadJson(jsonPath);
  } catch (e) {
    root.innerHTML = `<div class="empty">Could not load updates.</div>`;
    return;
  }
  root.innerHTML = updates.map(u => `
    <div class="timeline-item">
      <div class="timeline-date">${escapeHtml(u.date)}</div>
      <div class="timeline-title">${escapeHtml(u.title)}<span class="timeline-tag">${escapeHtml(u.tag)}</span></div>
      <p style="color:var(--text-muted);font-size:0.95rem">${escapeHtml(u.summary)}</p>
      <ul class="timeline-changes">
        ${u.changes.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  registerSearch(updates.map(u => ({
    name: u.title,
    subtitle: u.date + ' · ' + u.tag,
    description: u.summary,
    category: 'Updates',
    icon: 'scroll',
    color: 'var(--gold)',
    url: 'updates.html',
  })));
}

/* ---------- Home featured ---------- */
export async function renderHomeFeatured() {
  try {
    const [fruits, bosses, swords, locations] = await Promise.all([
      loadJson('data/fruits.json'),
      loadJson('data/bosses.json'),
      loadJson('data/swords.json'),
      loadJson('data/locations.json'),
    ]);
    const featuredFruits = fruits.filter(f => f.featured).slice(0, 3);
    const featuredBosses = bosses.filter(b => b.featured).slice(0, 3);

    const fGrid = document.getElementById('home-fruits');
    if (fGrid) {
      fGrid.innerHTML = featuredFruits.map(fruitCard).join('');
      fGrid.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
          const item = featuredFruits.find(i => i.id === card.dataset.id);
          openModal(fruitModal(item), item.color + '33');
        });
      });
    }
    const bGrid = document.getElementById('home-bosses');
    if (bGrid) {
      bGrid.innerHTML = featuredBosses.map(bossCard).join('');
      bGrid.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
          const item = featuredBosses.find(i => i.id === card.dataset.id);
          openModal(bossModal(item), 'rgba(251,113,133,0.2)');
        });
      });
    }

    // Stats
    const setStat = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n; };
    setStat('stat-fruits', fruits.length);
    setStat('stat-swords', swords.length);
    setStat('stat-bosses', bosses.length);
    setStat('stat-islands', locations.length);

    // Register all in search
    [...fruits, ...bosses, ...swords, ...locations].forEach(() => {});
    registerSearch(fruits.map(i => ({ name: i.name, subtitle: i.type, description: i.description, category: 'Fruits', icon: i.icon, color: i.color, url: 'fruits.html#' + i.id, tags: [i.rarity, i.type] })));
    registerSearch(bosses.map(i => ({ name: i.name, subtitle: 'Lvl ' + i.level, description: i.description, category: 'Bosses', icon: 'skull', color: 'var(--coral)', url: 'bosses.html#' + i.id, tags: [i.rarity] })));
    registerSearch(swords.map(i => ({ name: i.name, subtitle: i.rarity, description: i.description, category: 'Swords', icon: 'sword', color: 'var(--gold)', url: 'swords.html#' + i.id, tags: [i.rarity] })));
    registerSearch(locations.map(i => ({ name: i.name, subtitle: i.sea, description: i.description, category: 'Islands', icon: 'island', color: 'var(--teal)', url: 'locations.html#' + i.id, tags: [i.sea] })));

  } catch (e) {
    console.error(e);
  }
}
