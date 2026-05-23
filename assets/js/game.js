/* =========================================================
   Sailor Piece Idle — Game Engine
   ========================================================= */

import { Icons, openModal, closeModal, escapeHtml, fmtNum, registerSearch } from './app.js';

/* ========== Constants & Tables ========== */

const SAVE_KEY = 'sp-idle-save-v1';
const TICK_MS = 100;
const PASSIVE_TICK_MS = 1000;
const SAVE_INTERVAL_MS = 5000;
const OFFLINE_CAP_HOURS = 4;
const BOSS_WINDOW_MS = 30000;
const BOSS_COOLDOWN_MS = 90000;

const RARITY_CLICK_MULT = { Common: 1.2, Uncommon: 1.5, Rare: 2.0, Legendary: 3.5, Mythical: 6.0, Event: 4.0 };
const RARITY_FLAT_DMG   = { Common: 1,   Uncommon: 3,   Rare: 8,   Legendary: 22,  Mythical: 60,  Event: 35  };
const RARITY_PRESTIGE   = { Common: 1,   Uncommon: 2,   Rare: 4,   Legendary: 8,   Mythical: 16,  Event: 10  };

// Roll weights (out of 100) for rolling races on prestige / first launch
const RACE_ROLL_WEIGHTS = { Common: 50, Uncommon: 22, Rare: 16, Legendary: 8, Mythical: 4 };

const RACE_PERKS = {
  human:    { clickMult: 1.10, beliMult: 1.05, xpMult: 1.05, label: '+10% strike, +5% Beli, +5% XP' },
  fishman:  { clickMult: 1.15, beliMult: 1.20, xpMult: 1.00, label: '+15% strike, +20% Beli (sailing bonus)' },
  skypiean: { clickMult: 1.20, beliMult: 1.05, xpMult: 1.20, label: '+20% strike, +20% XP' },
  mink:     { clickMult: 1.30, beliMult: 1.10, xpMult: 1.10, label: '+30% strike, +10% Beli & XP' },
  cyborg:   { clickMult: 1.20, beliMult: 1.30, xpMult: 1.10, label: '+20% strike, +30% Beli, +10% XP' },
  ghoul:    { clickMult: 1.50, beliMult: 1.15, xpMult: 1.20, label: '+50% strike, +15% Beli, +20% XP' },
};

const ISLAND_GAME = {
  'starter-island':   { unlock: 1,   beliMult: 1,    xpMult: 1,    color: '#38bdf8' },
  'marine-fortress':  { unlock: 5,   beliMult: 2,    xpMult: 1.4,  color: '#94a3b8' },
  'desert-kingdom':   { unlock: 12,  beliMult: 4,    xpMult: 1.8,  color: '#eab308' },
  'skylands':         { unlock: 22,  beliMult: 9,    xpMult: 2.4,  color: '#facc15' },
  'frozen-fjord':     { unlock: 35,  beliMult: 22,   xpMult: 3.2,  color: '#7dd3fc' },
  'phantom-isle':     { unlock: 50,  beliMult: 55,   xpMult: 4.5,  color: '#a78bfa' },
  'great-tree':       { unlock: 70,  beliMult: 130,  xpMult: 6.5,  color: '#34d399' },
  'world-end':        { unlock: 95,  beliMult: 320,  xpMult: 9.5,  color: '#fb7185' },
};

const CREW = [
  { id: 'cabin_boy',  name: 'Cabin Boy',     unlock: 0,    baseCost: 50,        bps: 0.5,    icon: 'human'  },
  { id: 'sailor',     name: 'Sailor',        unlock: 0,    baseCost: 350,       bps: 3,      icon: 'fist'   },
  { id: 'navigator',  name: 'Navigator',     unlock: 5,    baseCost: 2500,      bps: 18,     icon: 'water'  },
  { id: 'first_mate', name: 'First Mate',    unlock: 12,   baseCost: 18000,     bps: 110,    icon: 'sword'  },
  { id: 'gunner',     name: 'Master Gunner', unlock: 22,   baseCost: 150000,    bps: 800,    icon: 'lightning' },
  { id: 'captain',    name: 'Captain',       unlock: 35,   baseCost: 1200000,   bps: 5500,   icon: 'haki'   },
  { id: 'admiral',    name: 'Fleet Admiral', unlock: 50,   baseCost: 9500000,   bps: 38000,  icon: 'star'   },
  { id: 'yonko',      name: 'Yonko',         unlock: 70,   baseCost: 75000000,  bps: 260000, icon: 'beast'  },
  { id: 'sea_king',   name: 'Sea King',      unlock: 95,   baseCost: 600000000, bps: 1800000,icon: 'fish'   },
];
const CREW_GROWTH = 1.15;

const QUESTS = [
  { id: 'q-clicks-100',  name: 'First Voyage',         desc: 'Strike 100 times.',                  goal: 100,  field: 'totalClicks',     reward: { beli: 500 } },
  { id: 'q-clicks-1k',   name: 'Sea Legs',             desc: 'Strike 1,000 times.',                goal: 1000, field: 'totalClicks',     reward: { beli: 5000 } },
  { id: 'q-kills-50',    name: 'Bounty Hunter',        desc: 'Defeat 50 mobs.',                    goal: 50,   field: 'totalKills',      reward: { beli: 2000 } },
  { id: 'q-kills-500',   name: 'Pirate King in Training', desc: 'Defeat 500 mobs.',               goal: 500,  field: 'totalKills',      reward: { beli: 50000 } },
  { id: 'q-level-10',    name: 'Veteran',              desc: 'Reach level 10.',                    goal: 10,   field: 'level',           reward: { beli: 3000 } },
  { id: 'q-level-25',    name: 'Skylander',            desc: 'Reach level 25.',                    goal: 25,   field: 'level',           reward: { beli: 25000 } },
  { id: 'q-level-50',    name: 'Phantom Pursuer',      desc: 'Reach level 50.',                    goal: 50,   field: 'level',           reward: { beli: 250000 } },
  { id: 'q-fruit-1',     name: 'Cursed Bite',          desc: 'Equip your first Devil Fruit.',      goal: 1,    field: 'fruitOwned',      reward: { beli: 5000 } },
  { id: 'q-sword-1',     name: 'First Blade',          desc: 'Buy a sword.',                       goal: 1,    field: 'swordOwned',      reward: { beli: 1000 } },
  { id: 'q-style-1',     name: 'Open Stance',          desc: 'Learn a fighting style.',            goal: 1,    field: 'styleOwned',      reward: { beli: 2000 } },
  { id: 'q-boss-1',      name: 'Slayer',               desc: 'Defeat your first boss.',            goal: 1,    field: 'bossesKilled',    reward: { beli: 10000 } },
  { id: 'q-boss-5',      name: 'Boss Hunter',          desc: 'Defeat 5 bosses.',                   goal: 5,    field: 'bossesKilled',    reward: { beli: 75000 } },
  { id: 'q-prestige-1',  name: 'Reborn',               desc: 'Awaken once (prestige).',            goal: 1,    field: 'prestiges',       reward: { beli: 100000 } },
];

/* ========== State ========== */

const DEFAULT_STATE = () => ({
  beli: 0,
  xp: 0,
  level: 1,
  totalClicks: 0,
  totalKills: 0,
  totalBeliEarned: 0,
  bossesKilled: 0,
  prestiges: 0,
  reputation: 0,
  islandId: 'starter-island',
  raceId: null,
  fruitId: null,
  swordId: null,
  styleId: null,
  ownedFruits: [],
  ownedSwords: [],
  ownedStyles: [],
  crew: {},
  questsClaimed: [],
  bossLog: [],
  mob: null,
  boss: null,
  bossNextAt: 0,
  startedAt: Date.now(),
  lastSavedAt: Date.now(),
});

let state = DEFAULT_STATE();
let DATA = { fruits: [], swords: [], styles: [], races: [], locations: [], bosses: [] };
let mobNamePool = [];
let activeShopTab = 'crew';
let activeInfoTab = 'equip';

/* ========== Util ========== */

function save() {
  state.lastSavedAt = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return false;
    state = Object.assign(DEFAULT_STATE(), parsed);
    state.crew = state.crew || {};
    return true;
  } catch (e) { return false; }
}

function levelXpReq(level) {
  return Math.floor(20 * Math.pow(1.22, level - 1));
}

function rollRaceTemplate() {
  const total = Object.values(RACE_ROLL_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [rarity, weight] of Object.entries(RACE_ROLL_WEIGHTS)) {
    r -= weight;
    if (r <= 0) {
      const candidates = DATA.races.filter(x => x.rarity === rarity);
      if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }
  return DATA.races[0];
}

function pickMobName(islandId) {
  const loc = DATA.locations.find(l => l.id === islandId);
  if (!loc || !loc.npcs?.length) return 'Wild Pirate';
  const cleaned = loc.npcs
    .map(n => n.replace(/\s*\(.*?\)\s*$/, ''))
    .filter(n => !/boss/i.test(n));
  return cleaned[Math.floor(Math.random() * cleaned.length)] || 'Wild Pirate';
}

function spawnMob() {
  const isle = ISLAND_GAME[state.islandId];
  const baseHp = 4 * (isle?.beliMult || 1);
  const hp = Math.max(2, Math.floor(baseHp * Math.pow(1.06, state.level - 1) * (0.85 + Math.random() * 0.3)));
  state.mob = {
    name: pickMobName(state.islandId),
    hp,
    maxHp: hp,
    isBoss: false,
  };
}

function spawnBoss() {
  const loc = DATA.locations.find(l => l.id === state.islandId);
  let bossId = null;
  if (loc?.notable) { /* prefer the boss most associated */ }
  // Pick the boss whose level best fits this island
  const candidates = DATA.bosses.filter(b => b.location === loc?.name);
  let chosen = candidates[0];
  if (!chosen) chosen = DATA.bosses.find(b => b.recommendedLevel <= state.level + 50) || DATA.bosses[0];
  if (!chosen) return;
  const isle = ISLAND_GAME[state.islandId];
  const hp = Math.max(50, Math.floor((chosen.hp || 1000) * 0.05 * (isle?.beliMult || 1) * Math.pow(1.04, state.level)));
  state.boss = {
    id: chosen.id,
    name: chosen.name,
    hp,
    maxHp: hp,
    expiresAt: Date.now() + BOSS_WINDOW_MS,
    drops: chosen.drops || [],
  };
  toast({ title: 'Boss spawned!', body: chosen.name + ' — defeat in ' + (BOSS_WINDOW_MS / 1000) + 's', kind: 'boss' });
}

/* ========== Power calculation ========== */

function getRaceMult(key) {
  if (!state.raceId) return 1;
  const perk = RACE_PERKS[state.raceId];
  return perk ? (perk[key] || 1) : 1;
}

function calcClickPower() {
  let base = 1 + state.reputation * 0.5;
  let mult = 1;
  let flat = 0;

  const fruit = DATA.fruits.find(f => f.id === state.fruitId);
  if (fruit) {
    mult *= RARITY_CLICK_MULT[fruit.rarity] || 1;
    flat += RARITY_FLAT_DMG[fruit.rarity] || 0;
  }
  const sword = DATA.swords.find(s => s.id === state.swordId);
  if (sword) flat += (RARITY_FLAT_DMG[sword.rarity] || 0) * 1.2;

  const style = DATA.styles.find(s => s.id === state.styleId);
  if (style) flat += (RARITY_FLAT_DMG[style.rarity] || 0) * 0.8;

  mult *= getRaceMult('clickMult');
  mult *= 1 + state.prestiges * 0.10;

  return Math.max(1, Math.floor((base + flat) * mult));
}

function calcBeliPerSec() {
  let bps = 0;
  for (const c of CREW) {
    const owned = state.crew[c.id] || 0;
    bps += owned * c.bps;
  }
  // Fruit passive: ~20% of fruit price spread per million
  const fruit = DATA.fruits.find(f => f.id === state.fruitId);
  if (fruit) bps += (fruit.price || 0) / 50000;
  bps *= getRaceMult('beliMult');
  bps *= ISLAND_GAME[state.islandId]?.beliMult || 1;
  bps *= 1 + state.prestiges * 0.10;
  return bps;
}

function calcBeliPerKill(isBoss) {
  let base = 4 + state.level * 1.5;
  base *= ISLAND_GAME[state.islandId]?.beliMult || 1;
  base *= getRaceMult('beliMult');
  if (isBoss) base *= 25;
  base *= 1 + state.prestiges * 0.10;
  return Math.floor(base);
}

function calcXpPerKill(isBoss) {
  let base = 3 + state.level * 0.6;
  base *= ISLAND_GAME[state.islandId]?.xpMult || 1;
  base *= getRaceMult('xpMult');
  if (isBoss) base *= 12;
  return Math.floor(base);
}

function crewCost(crew) {
  const owned = state.crew[crew.id] || 0;
  return Math.ceil(crew.baseCost * Math.pow(CREW_GROWTH, owned));
}

/* ========== Mutations ========== */

function gainBeli(amount) {
  state.beli += amount;
  state.totalBeliEarned += amount;
}

function gainXp(amount) {
  state.xp += amount;
  while (state.xp >= levelXpReq(state.level)) {
    state.xp -= levelXpReq(state.level);
    state.level++;
    onLevelUp();
  }
}

function onLevelUp() {
  toast({ title: 'Level up!', body: 'You are now level ' + state.level, kind: 'success' });
  // Check if a new island just unlocked
  for (const [id, cfg] of Object.entries(ISLAND_GAME)) {
    if (cfg.unlock === state.level) {
      const loc = DATA.locations.find(l => l.id === id);
      if (loc) toast({ title: 'New island!', body: loc.name + ' is now open.' });
    }
  }
  // Check newly unlocked crew
  for (const c of CREW) {
    if (c.unlock === state.level) toast({ title: 'New crew!', body: c.name + ' available to hire.' });
  }
}

function strike() {
  if (!state.mob && !state.boss) spawnMob();
  state.totalClicks++;
  const power = calcClickPower();
  const isCrit = Math.random() < 0.07;
  const dmg = Math.floor(power * (isCrit ? 2.5 : 1));

  if (state.boss) {
    state.boss.hp -= dmg;
    spawnFloater(dmg, isCrit, false);
    if (state.boss.hp <= 0) defeatBoss();
  } else {
    if (!state.mob) spawnMob();
    state.mob.hp -= dmg;
    spawnFloater(dmg, isCrit, false);
    if (state.mob.hp <= 0) defeatMob();
  }
}

function defeatMob() {
  const beli = calcBeliPerKill(false);
  const xp = calcXpPerKill(false);
  gainBeli(beli);
  gainXp(xp);
  state.totalKills++;
  spawnFloater('+' + fmtNum(beli) + ' Beli', false, true);
  spawnMob();
  checkQuests();
}

function defeatBoss() {
  const boss = state.boss;
  const beli = calcBeliPerKill(true);
  const xp = calcXpPerKill(true);
  gainBeli(beli);
  gainXp(xp);
  state.bossesKilled++;
  state.bossLog.unshift({ id: boss.id, name: boss.name, at: Date.now() });
  state.bossLog = state.bossLog.slice(0, 10);
  spawnFloater('+' + fmtNum(beli) + ' Beli', false, true);
  toast({ title: 'Boss defeated!', body: boss.name + ' — +' + fmtNum(beli) + ' Beli, +' + fmtNum(xp) + ' XP', kind: 'boss' });
  // Drop loot: small chance to grant the boss's mythical drop
  if (boss.drops?.length && Math.random() < 0.25) {
    const drop = boss.drops[0];
    const fruitMatch = DATA.fruits.find(f => drop.name.toLowerCase().includes(f.name.toLowerCase()));
    const swordMatch = DATA.swords.find(s => drop.name.toLowerCase() === s.name.toLowerCase());
    if (fruitMatch && !state.ownedFruits.includes(fruitMatch.id)) {
      state.ownedFruits.push(fruitMatch.id);
      toast({ title: 'Loot drop!', body: 'You found ' + fruitMatch.name + '!', kind: 'success' });
    } else if (swordMatch && !state.ownedSwords.includes(swordMatch.id)) {
      state.ownedSwords.push(swordMatch.id);
      toast({ title: 'Loot drop!', body: 'You found ' + swordMatch.name + '!', kind: 'success' });
    }
  }
  state.boss = null;
  state.bossNextAt = Date.now() + BOSS_COOLDOWN_MS;
  checkQuests();
}

function buyCrew(crewId) {
  const crew = CREW.find(c => c.id === crewId);
  if (!crew) return;
  if (state.level < crew.unlock) return;
  const cost = crewCost(crew);
  if (state.beli < cost) return;
  state.beli -= cost;
  state.crew[crew.id] = (state.crew[crew.id] || 0) + 1;
  renderShop();
  renderTopbar();
}

function buyFruit(fruitId) {
  const fruit = DATA.fruits.find(f => f.id === fruitId);
  if (!fruit) return;
  if (state.ownedFruits.includes(fruitId)) {
    state.fruitId = fruitId;
    toast({ title: 'Equipped', body: fruit.name });
  } else {
    if (state.beli < fruit.price) return;
    state.beli -= fruit.price;
    state.ownedFruits.push(fruitId);
    state.fruitId = fruitId;
    toast({ title: 'Devil Fruit acquired!', body: fruit.name + ' — equipped.', kind: 'success' });
  }
  renderShop(); renderInfo(); renderTopbar();
  checkQuests();
}

function buySword(swordId) {
  const sword = DATA.swords.find(s => s.id === swordId);
  if (!sword) return;
  if (state.level < (sword.requiredLevel || 1)) return;
  if (state.ownedSwords.includes(swordId)) {
    state.swordId = swordId;
    toast({ title: 'Equipped', body: sword.name });
  } else {
    const cost = swordPrice(sword);
    if (state.beli < cost) return;
    state.beli -= cost;
    state.ownedSwords.push(swordId);
    state.swordId = swordId;
    toast({ title: 'Sword acquired!', body: sword.name, kind: 'success' });
  }
  renderShop(); renderInfo(); renderTopbar();
  checkQuests();
}

function buyStyle(styleId) {
  const style = DATA.styles.find(s => s.id === styleId);
  if (!style) return;
  if (state.level < (style.requiredLevel || 1)) return;
  if (state.ownedStyles.includes(styleId)) {
    state.styleId = styleId;
    toast({ title: 'Stance set', body: style.name });
  } else {
    const cost = style.cost || 1000;
    if (state.beli < cost) return;
    state.beli -= cost;
    state.ownedStyles.push(styleId);
    state.styleId = styleId;
    toast({ title: 'Style learned!', body: style.name, kind: 'success' });
  }
  renderShop(); renderInfo(); renderTopbar();
  checkQuests();
}

function travelTo(islandId) {
  const cfg = ISLAND_GAME[islandId];
  if (!cfg) return;
  if (state.level < cfg.unlock) return;
  state.islandId = islandId;
  state.mob = null;
  state.boss = null;
  state.bossNextAt = Date.now() + 10000;
  const loc = DATA.locations.find(l => l.id === islandId);
  toast({ title: 'Anchored at ' + (loc?.name || islandId) });
  spawnMob();
  renderShop(); renderArena(); renderTopbar();
}

function swordPrice(sword) {
  const baseByRarity = { Common: 100, Uncommon: 4000, Rare: 60000, Legendary: 800000, Mythical: 12000000 };
  return baseByRarity[sword.rarity] || 1000;
}

function prestige() {
  if (state.level < 30) {
    toast({ title: 'Not yet', body: 'Reach level 30 before awakening.' });
    return;
  }
  const gain = 1 + Math.floor(Math.log2(Math.max(2, state.totalBeliEarned / 100000)));
  if (!confirm(`Awaken? You will reset to level 1 and gain +${gain} Reputation (permanent +${(gain * 50)}% strike, +${(gain * 10)}% Beli/sec). Your owned fruits, swords, styles, race, and bosses defeated stay.`)) return;
  const kept = {
    raceId: state.raceId,
    ownedFruits: state.ownedFruits,
    ownedSwords: state.ownedSwords,
    ownedStyles: state.ownedStyles,
    bossLog: state.bossLog,
    bossesKilled: state.bossesKilled,
    questsClaimed: state.questsClaimed,
    totalClicks: state.totalClicks,
    totalBeliEarned: state.totalBeliEarned,
    totalKills: state.totalKills,
    prestiges: state.prestiges + 1,
    reputation: state.reputation + gain,
  };
  state = Object.assign(DEFAULT_STATE(), kept);
  state.fruitId = null;
  state.swordId = null;
  state.styleId = null;
  spawnMob();
  toast({ title: 'Awakened!', body: '+' + gain + ' Reputation', kind: 'success' });
  renderAll();
  save();
}

function hardReset() {
  if (!confirm('Reset ALL progress? This cannot be undone.')) return;
  localStorage.removeItem(SAVE_KEY);
  state = DEFAULT_STATE();
  promptRaceRoll();
}

/* ========== Quests ========== */

function questProgress(q) {
  let val = 0;
  switch (q.field) {
    case 'totalClicks':   val = state.totalClicks; break;
    case 'totalKills':    val = state.totalKills; break;
    case 'level':         val = state.level; break;
    case 'fruitOwned':    val = state.ownedFruits.length; break;
    case 'swordOwned':    val = state.ownedSwords.length; break;
    case 'styleOwned':    val = state.ownedStyles.length; break;
    case 'bossesKilled':  val = state.bossesKilled; break;
    case 'prestiges':     val = state.prestiges; break;
  }
  return val;
}

function checkQuests() {
  for (const q of QUESTS) {
    if (state.questsClaimed.includes(q.id)) continue;
    if (questProgress(q) >= q.goal) {
      state.questsClaimed.push(q.id);
      if (q.reward.beli) gainBeli(q.reward.beli);
      toast({ title: 'Quest complete!', body: q.name + ' — +' + fmtNum(q.reward.beli) + ' Beli', kind: 'success' });
    }
  }
}

/* ========== Rendering ========== */

function renderTopbar() {
  document.getElementById('ui-beli').textContent = fmtNum(Math.floor(state.beli));
  document.getElementById('ui-bps').textContent = '+' + fmtNum(Math.floor(calcBeliPerSec() * 10) / 10) + '/s';
  document.getElementById('ui-level').textContent = state.level;
  const xpReq = levelXpReq(state.level);
  document.getElementById('ui-xp').textContent = fmtNum(Math.floor(state.xp)) + ' / ' + fmtNum(xpReq);
  document.getElementById('ui-xp-fill').style.width = Math.min(100, (state.xp / xpReq) * 100) + '%';
  document.getElementById('ui-power').textContent = fmtNum(calcClickPower());
  const race = DATA.races.find(r => r.id === state.raceId);
  document.getElementById('ui-race').textContent = race ? race.name : '—';
  const loc = DATA.locations.find(l => l.id === state.islandId);
  document.getElementById('ui-island').textContent = loc?.name || '—';
}

function renderArena() {
  const arena = document.getElementById('arena');
  if (!arena) return;
  const isBoss = !!state.boss;
  const target = isBoss ? state.boss : state.mob;
  if (!target) return;
  const bossBanner = isBoss ? `
    <div class="boss-banner">
      <span class="label">⚠ Boss Battle</span>
      <span class="timer" id="boss-timer">${Math.max(0, Math.ceil((state.boss.expiresAt - Date.now()) / 1000))}s</span>
    </div>` : '';
  const spawnBtn = !isBoss ? `
    <button class="boss-spawn-btn" id="spawn-boss-btn" ${Date.now() < state.bossNextAt ? 'disabled' : ''}>
      ${Date.now() < state.bossNextAt
        ? 'Boss in ' + Math.ceil((state.bossNextAt - Date.now()) / 1000) + 's'
        : 'Summon Boss'}
    </button>` : '';
  const loc = DATA.locations.find(l => l.id === state.islandId);
  arena.innerHTML = `
    <div class="island-label">Sailing · <span class="island-name">${escapeHtml(loc?.name || '—')}</span></div>
    ${bossBanner}
    <div class="mob-card">
      <div class="mob-portrait ${isBoss ? 'boss' : ''}" id="mob-portrait">${isBoss ? Icons.skull : Icons.human}</div>
      <div class="mob-name">${escapeHtml(target.name)}</div>
      <div class="mob-sub">${isBoss ? 'World Boss' : 'Wild encounter'}</div>
      <div class="mob-hp"><div class="mob-hp-fill ${isBoss ? 'boss' : ''}" id="mob-hp-fill" style="width:${(target.hp / target.maxHp) * 100}%"></div></div>
      <div class="mob-hp-text" id="mob-hp-text">${fmtNum(Math.max(0, target.hp))} / ${fmtNum(target.maxHp)} HP</div>
    </div>
    <button class="strike-btn" id="strike-btn">
      <span>STRIKE</span>
      <span class="strike-power">+${fmtNum(calcClickPower())} per hit</span>
    </button>
    ${spawnBtn}
    <div class="floaters" id="floaters"></div>
  `;
  document.getElementById('strike-btn').addEventListener('click', strike);
  document.getElementById('spawn-boss-btn')?.addEventListener('click', () => {
    if (Date.now() < state.bossNextAt) return;
    spawnBoss();
    renderArena();
  });
}

function renderArenaQuick() {
  // Lightweight HP / timer / spawn button update without rebuilding the DOM
  const isBoss = !!state.boss;
  const target = isBoss ? state.boss : state.mob;
  if (!target) return;
  const fill = document.getElementById('mob-hp-fill');
  const text = document.getElementById('mob-hp-text');
  if (fill) fill.style.width = (target.hp / target.maxHp) * 100 + '%';
  if (text) text.textContent = fmtNum(Math.max(0, target.hp)) + ' / ' + fmtNum(target.maxHp) + ' HP';
  const timer = document.getElementById('boss-timer');
  if (timer && state.boss) timer.textContent = Math.max(0, Math.ceil((state.boss.expiresAt - Date.now()) / 1000)) + 's';
  const spawnBtn = document.getElementById('spawn-boss-btn');
  if (spawnBtn) {
    if (Date.now() < state.bossNextAt) {
      spawnBtn.disabled = true;
      spawnBtn.textContent = 'Boss in ' + Math.ceil((state.bossNextAt - Date.now()) / 1000) + 's';
    } else {
      spawnBtn.disabled = false;
      spawnBtn.textContent = 'Summon Boss';
    }
  }
}

let floaterIdx = 0;
function spawnFloater(value, isCrit, isBeli) {
  const root = document.getElementById('floaters');
  if (!root) return;
  const el = document.createElement('div');
  el.className = 'floater' + (isCrit ? ' crit' : '') + (isBeli ? ' beli' : '');
  el.textContent = (isBeli ? '' : '-') + (typeof value === 'number' ? fmtNum(value) : value);
  const x = 30 + Math.random() * 60;
  const y = 40 + Math.random() * 30;
  el.style.left = x + '%';
  el.style.top = y + '%';
  root.appendChild(el);
  setTimeout(() => el.remove(), 950);
  // Shake portrait on hits
  if (!isBeli) {
    const portrait = document.getElementById('mob-portrait');
    if (portrait) {
      portrait.classList.remove('hit');
      void portrait.offsetWidth;
      portrait.classList.add('hit');
    }
  }
  floaterIdx++;
}

function renderShop() {
  // Tabs
  const tabs = document.querySelectorAll('#shop-tabs .tab');
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === activeShopTab));
  document.querySelectorAll('#shop-panes .tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === 'pane-' + activeShopTab);
  });
  document.getElementById('pane-crew').innerHTML = renderCrewShop();
  document.getElementById('pane-fruits').innerHTML = renderFruitShop();
  document.getElementById('pane-swords').innerHTML = renderSwordShop();
  document.getElementById('pane-styles').innerHTML = renderStyleShop();
  document.getElementById('pane-islands').innerHTML = renderIslandShop();

  document.querySelectorAll('#pane-crew [data-buy]').forEach(b =>
    b.addEventListener('click', () => buyCrew(b.dataset.buy))
  );
  document.querySelectorAll('#pane-fruits [data-buy]').forEach(b =>
    b.addEventListener('click', () => buyFruit(b.dataset.buy))
  );
  document.querySelectorAll('#pane-swords [data-buy]').forEach(b =>
    b.addEventListener('click', () => buySword(b.dataset.buy))
  );
  document.querySelectorAll('#pane-styles [data-buy]').forEach(b =>
    b.addEventListener('click', () => buyStyle(b.dataset.buy))
  );
  document.querySelectorAll('#pane-islands [data-travel]').forEach(b =>
    b.addEventListener('click', () => travelTo(b.dataset.travel))
  );
}

function renderCrewShop() {
  return CREW.map(c => {
    const owned = state.crew[c.id] || 0;
    const cost = crewCost(c);
    const locked = state.level < c.unlock;
    const cant = state.beli < cost || locked;
    return `
      <button class="shop-item ${locked ? 'locked' : ''}" data-buy="${c.id}" ${cant ? 'disabled' : ''}>
        <div class="shop-icon">${Icons[c.icon] || Icons.human}</div>
        <div class="shop-info">
          <div class="name">${c.name}</div>
          <div class="meta">+${fmtNum(c.bps)} Beli/s each</div>
          ${locked ? `<div class="req">Unlocks at Lvl ${c.unlock}</div>` : ''}
        </div>
        <div class="shop-action">
          <div class="shop-cost ${cant && !locked ? 'cant' : ''}">${fmtNum(cost)} Beli</div>
          <div class="shop-count">×${owned}</div>
        </div>
      </button>`;
  }).join('');
}

function renderFruitShop() {
  return DATA.fruits.map(f => {
    const owned = state.ownedFruits.includes(f.id);
    const equipped = state.fruitId === f.id;
    const cant = !owned && state.beli < f.price;
    return `
      <button class="shop-item ${equipped ? 'equipped' : ''}" data-buy="${f.id}" ${cant ? 'disabled' : ''}>
        <div class="shop-icon" style="color:${f.color}">${Icons[f.icon] || Icons.flame}</div>
        <div class="shop-info">
          <div class="name">${escapeHtml(f.name)}</div>
          <div class="meta">${f.type} · ${f.rarity} · ×${RARITY_CLICK_MULT[f.rarity]} strike</div>
          <div class="perk">+${fmtNum(RARITY_FLAT_DMG[f.rarity])} flat dmg, +${fmtNum((f.price || 0) / 50000)}/s passive</div>
        </div>
        <div class="shop-action">
          ${equipped ? '<div class="equipped-tag">Equipped</div>' : owned ? '<div class="shop-cost">Equip</div>' : `<div class="shop-cost ${cant ? 'cant' : ''}">${fmtNum(f.price)} Beli</div>`}
        </div>
      </button>`;
  }).join('');
}

function renderSwordShop() {
  return DATA.swords.map(s => {
    const owned = state.ownedSwords.includes(s.id);
    const equipped = state.swordId === s.id;
    const cost = swordPrice(s);
    const lvLock = state.level < (s.requiredLevel || 1);
    const cant = lvLock || (!owned && state.beli < cost);
    return `
      <button class="shop-item ${equipped ? 'equipped' : ''} ${lvLock ? 'locked' : ''}" data-buy="${s.id}" ${cant ? 'disabled' : ''}>
        <div class="shop-icon">${Icons.sword}</div>
        <div class="shop-info">
          <div class="name">${escapeHtml(s.name)}</div>
          <div class="meta">${s.rarity} · ${s.tier || ''}</div>
          <div class="perk">+${fmtNum((RARITY_FLAT_DMG[s.rarity] || 0) * 1.2)} flat dmg</div>
          ${lvLock ? `<div class="req">Requires Lvl ${s.requiredLevel}</div>` : ''}
        </div>
        <div class="shop-action">
          ${equipped ? '<div class="equipped-tag">Equipped</div>' : owned ? '<div class="shop-cost">Equip</div>' : `<div class="shop-cost ${cant && !lvLock ? 'cant' : ''}">${fmtNum(cost)} Beli</div>`}
        </div>
      </button>`;
  }).join('');
}

function renderStyleShop() {
  return DATA.styles.map(s => {
    const owned = state.ownedStyles.includes(s.id);
    const equipped = state.styleId === s.id;
    const lvLock = state.level < (s.requiredLevel || 1);
    const cant = lvLock || (!owned && state.beli < (s.cost || 0));
    return `
      <button class="shop-item ${equipped ? 'equipped' : ''} ${lvLock ? 'locked' : ''}" data-buy="${s.id}" ${cant ? 'disabled' : ''}>
        <div class="shop-icon">${Icons[s.icon] || Icons.fist}</div>
        <div class="shop-info">
          <div class="name">${escapeHtml(s.name)}</div>
          <div class="meta">${s.rarity} · ${s.teacher || 'Self-taught'}</div>
          <div class="perk">+${fmtNum((RARITY_FLAT_DMG[s.rarity] || 0) * 0.8)} flat dmg</div>
          ${lvLock ? `<div class="req">Requires Lvl ${s.requiredLevel}</div>` : ''}
        </div>
        <div class="shop-action">
          ${equipped ? '<div class="equipped-tag">Active</div>' : owned ? '<div class="shop-cost">Use</div>' : `<div class="shop-cost ${cant && !lvLock ? 'cant' : ''}">${fmtNum(s.cost || 0)} Beli</div>`}
        </div>
      </button>`;
  }).join('');
}

function renderIslandShop() {
  return DATA.locations.map(l => {
    const cfg = ISLAND_GAME[l.id];
    if (!cfg) return '';
    const lvLock = state.level < cfg.unlock;
    const isCurrent = state.islandId === l.id;
    return `
      <button class="shop-item ${isCurrent ? 'equipped' : ''} ${lvLock ? 'locked' : ''}" data-travel="${l.id}" ${lvLock ? 'disabled' : ''}>
        <div class="shop-icon" style="color:${cfg.color}">${Icons.island}</div>
        <div class="shop-info">
          <div class="name">${escapeHtml(l.name)}</div>
          <div class="meta">${l.sea} · ×${cfg.beliMult} Beli, ×${cfg.xpMult} XP</div>
          ${lvLock ? `<div class="req">Unlocks at Lvl ${cfg.unlock}</div>` : ''}
        </div>
        <div class="shop-action">
          ${isCurrent ? '<div class="equipped-tag">Here</div>' : '<div class="shop-cost">Sail</div>'}
        </div>
      </button>`;
  }).join('');
}

function renderInfo() {
  document.querySelectorAll('#info-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === activeInfoTab));
  document.querySelectorAll('#info-panes .tab-pane').forEach(p => p.classList.toggle('active', p.id === 'pane-' + activeInfoTab));
  document.getElementById('pane-equip').innerHTML = renderEquip();
  document.getElementById('pane-quests').innerHTML = renderQuests();
  document.getElementById('pane-stats').innerHTML = renderStats();
}

function renderEquip() {
  const fruit = DATA.fruits.find(f => f.id === state.fruitId);
  const sword = DATA.swords.find(s => s.id === state.swordId);
  const style = DATA.styles.find(s => s.id === state.styleId);
  const race = DATA.races.find(r => r.id === state.raceId);
  const slot = (icon, label, item, perk) => `
    <div class="equip-card">
      <div class="shop-icon" ${item?.color ? `style="color:${item.color}"` : ''}>${icon}</div>
      <div class="equip-slot">
        <span class="label">${label}</span>
        <span class="name">${item ? escapeHtml(item.name) : 'None'}</span>
        ${perk ? `<span class="perk">${escapeHtml(perk)}</span>` : ''}
      </div>
    </div>`;
  const racePerk = state.raceId ? RACE_PERKS[state.raceId]?.label : '';
  return `
    ${slot(Icons.flame, 'Devil Fruit', fruit, fruit ? fruit.element + ' · ×' + RARITY_CLICK_MULT[fruit.rarity] + ' strike' : '')}
    ${slot(Icons.sword, 'Sword', sword, sword ? sword.tier + ' · +' + fmtNum((RARITY_FLAT_DMG[sword.rarity] || 0) * 1.2) + ' dmg' : '')}
    ${slot(Icons.fist,  'Fighting Style', style, style ? '+' + fmtNum((RARITY_FLAT_DMG[style.rarity] || 0) * 0.8) + ' dmg' : '')}
    ${slot(Icons.human, 'Race', race, racePerk)}
  `;
}

function renderQuests() {
  return QUESTS.map(q => {
    const claimed = state.questsClaimed.includes(q.id);
    const cur = questProgress(q);
    const pct = Math.min(100, (cur / q.goal) * 100);
    return `
      <div class="quest-card ${claimed ? 'done' : ''}">
        <div class="name">${escapeHtml(q.name)}<span class="check">${claimed ? '✓' : ''}</span></div>
        <div class="desc">${escapeHtml(q.desc)}</div>
        <div class="quest-progress"><div style="width:${pct}%"></div></div>
        <div class="reward">${fmtNum(cur)} / ${fmtNum(q.goal)} · Reward: ${fmtNum(q.reward.beli)} Beli</div>
      </div>`;
  }).join('');
}

function renderStats() {
  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const rows = [
    ['Total clicks', fmtNum(state.totalClicks)],
    ['Total kills',  fmtNum(state.totalKills)],
    ['Bosses defeated', fmtNum(state.bossesKilled)],
    ['Total Beli earned', fmtNum(Math.floor(state.totalBeliEarned))],
    ['Awakenings', fmtNum(state.prestiges)],
    ['Reputation', fmtNum(state.reputation)],
    ['Strike power', fmtNum(calcClickPower())],
    ['Beli/sec', fmtNum(Math.floor(calcBeliPerSec() * 10) / 10)],
    ['Time played', `${h}h ${m}m`],
  ];
  return `<div class="stats-list">${rows.map(([k, v]) => `<div class="stat-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}</div>`;
}

function renderAll() {
  renderTopbar();
  renderArena();
  renderShop();
  renderInfo();
}

/* ========== Toasts ========== */

function toast({ title, body, kind }) {
  let stack = document.getElementById('toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' ' + kind : '');
  el.innerHTML = `<div class="title">${escapeHtml(title || '')}</div>${body ? `<div class="body">${escapeHtml(body)}</div>` : ''}`;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ========== Race picker ========== */

function promptRaceRoll() {
  const opts = [];
  for (let i = 0; i < 4; i++) {
    const r = rollRaceTemplate();
    if (!opts.find(o => o.id === r.id)) opts.push(r);
  }
  while (opts.length < 4) opts.push(DATA.races[opts.length % DATA.races.length]);
  const html = `
    <div class="modal-head">
      <button class="modal-close" aria-label="Close">${Icons.close}</button>
      <span class="eyebrow">Born of the Sea</span>
      <h2>Roll your race</h2>
      <p>Pick one bloodline. You can re-roll later at the Mirror Shrine.</p>
    </div>
    <div class="modal-body">
      <div class="race-picker">
        ${opts.map(r => `
          <button class="race-pick" data-race="${r.id}">
            <div class="rarity" style="color:var(--r-${r.rarity.toLowerCase()})">${r.rarity}</div>
            <div class="name">${escapeHtml(r.name)}</div>
            <div class="perk">${escapeHtml(RACE_PERKS[r.id]?.label || r.passive || '—')}</div>
          </button>
        `).join('')}
      </div>
      <button class="btn-sm" id="reroll-pick" style="margin-top:10px;align-self:center">Reroll all 4</button>
    </div>
  `;
  openModal(html, 'rgba(245,197,66,0.18)');
  document.querySelectorAll('.race-pick').forEach(b =>
    b.addEventListener('click', () => {
      state.raceId = b.dataset.race;
      closeModal();
      toast({ title: 'Race set', body: DATA.races.find(r => r.id === state.raceId)?.name, kind: 'success' });
      renderAll();
      save();
    })
  );
  document.getElementById('reroll-pick')?.addEventListener('click', () => promptRaceRoll());
}

/* ========== Tick loops ========== */

function tick() {
  // boss timer expires
  if (state.boss && Date.now() > state.boss.expiresAt) {
    toast({ title: 'Boss escaped', body: state.boss.name + ' got away.', kind: 'boss' });
    state.boss = null;
    state.bossNextAt = Date.now() + BOSS_COOLDOWN_MS / 2;
    renderArena();
  }
  renderArenaQuick();
}

function passiveTick() {
  const bps = calcBeliPerSec();
  if (bps > 0) gainBeli(bps);
  renderTopbar();
  // Strike-style auto if a Style with rare/legendary unlocked: small chance to auto-strike
  if (state.styleId) {
    const style = DATA.styles.find(s => s.id === state.styleId);
    const chance = { Common: 0, Uncommon: 0.05, Rare: 0.1, Legendary: 0.15, Mythical: 0.25 }[style?.rarity] || 0;
    if (Math.random() < chance) strike();
  }
}

function periodicSave() {
  save();
}

/* ========== Init ========== */

async function init() {
  // Replace home stats hook (in case home script targets ids)
  // Load all data
  try {
    [DATA.fruits, DATA.swords, DATA.styles, DATA.races, DATA.locations, DATA.bosses] = await Promise.all([
      fetch('data/fruits.json').then(r => r.json()),
      fetch('data/swords.json').then(r => r.json()),
      fetch('data/styles.json').then(r => r.json()),
      fetch('data/races.json').then(r => r.json()),
      fetch('data/locations.json').then(r => r.json()),
      fetch('data/bosses.json').then(r => r.json()),
    ]);
  } catch (e) {
    console.error(e);
    document.getElementById('arena').innerHTML = '<div class="empty">Failed to load game data.</div>';
    return;
  }

  // Register search across all categories so / still works on the game page
  registerSearch(DATA.fruits.map(i => ({ name: i.name, subtitle: i.type, description: i.description, category: 'Fruits', icon: i.icon, color: i.color, url: 'fruits.html#' + i.id, tags: [i.rarity] })));
  registerSearch(DATA.swords.map(i => ({ name: i.name, subtitle: i.rarity, description: i.description, category: 'Swords', icon: 'sword', color: 'var(--gold)', url: 'swords.html#' + i.id, tags: [i.rarity] })));
  registerSearch(DATA.styles.map(i => ({ name: i.name, subtitle: i.rarity, description: i.description, category: 'Styles', icon: i.icon, color: 'var(--cyan)', url: 'styles.html#' + i.id, tags: [i.rarity] })));
  registerSearch(DATA.races.map(i => ({ name: i.name, subtitle: i.rarity, description: i.description, category: 'Races', icon: i.icon, color: i.color, url: 'races.html#' + i.id, tags: [i.rarity] })));
  registerSearch(DATA.locations.map(i => ({ name: i.name, subtitle: i.sea, description: i.description, category: 'Islands', icon: 'island', color: 'var(--teal)', url: 'locations.html#' + i.id, tags: [i.sea] })));
  registerSearch(DATA.bosses.map(i => ({ name: i.name, subtitle: 'Lvl ' + i.level, description: i.description, category: 'Bosses', icon: 'skull', color: 'var(--coral)', url: 'bosses.html#' + i.id, tags: [i.rarity] })));

  // Load save
  const hadSave = load();

  // Offline progress
  if (hadSave) {
    const offlineMs = Math.min(OFFLINE_CAP_HOURS * 3600 * 1000, Date.now() - (state.lastSavedAt || Date.now()));
    if (offlineMs > 5000) {
      const offlineSec = Math.floor(offlineMs / 1000);
      const earned = Math.floor(calcBeliPerSec() * offlineSec * 0.5);
      if (earned > 0) {
        gainBeli(earned);
        toast({ title: 'Welcome back!', body: 'You earned ' + fmtNum(earned) + ' Beli while away.', kind: 'success' });
      }
    }
  }

  // Spawn first mob
  if (!state.mob && !state.boss) spawnMob();

  // Wire up shop / info tab clicks
  document.querySelectorAll('#shop-tabs .tab').forEach(t =>
    t.addEventListener('click', () => { activeShopTab = t.dataset.tab; renderShop(); })
  );
  document.querySelectorAll('#info-tabs .tab').forEach(t =>
    t.addEventListener('click', () => { activeInfoTab = t.dataset.tab; renderInfo(); })
  );
  document.getElementById('reroll-race')?.addEventListener('click', () => {
    if (!confirm('Reroll your race? (Free for now)')) return;
    promptRaceRoll();
  });
  document.getElementById('prestige-btn')?.addEventListener('click', prestige);
  document.getElementById('reset-btn')?.addEventListener('click', hardReset);

  // Pick race if not set
  if (!state.raceId) promptRaceRoll();

  renderAll();

  // Keyboard: Space to strike
  document.addEventListener('keydown', e => {
    if (e.key === ' ' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      strike();
    }
  });

  // Loops
  setInterval(tick, TICK_MS);
  setInterval(passiveTick, PASSIVE_TICK_MS);
  setInterval(periodicSave, SAVE_INTERVAL_MS);
  window.addEventListener('beforeunload', save);
}

document.addEventListener('DOMContentLoaded', init);
