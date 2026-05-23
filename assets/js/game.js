/* =========================================================
   Sailor Piece Idle — Game Engine v2
   - Bug fixes (Beli scaling, boss drops, fruit passive)
   - Harder difficulty
   - Active fruit abilities (Z / X / C / V)
   - Gacha pulls
   - Full Admin Panel (~ key or wrench button)
   ========================================================= */

import { Icons, openModal, closeModal, escapeHtml, fmtNum, registerSearch } from './app.js';

/* ========== Constants & Tables ========== */

const SAVE_KEY = 'sp-idle-save-v2';
const TICK_MS = 100;
const PASSIVE_TICK_MS = 1000;
const SAVE_INTERVAL_MS = 5000;
const OFFLINE_CAP_HOURS = 4;
const BOSS_WINDOW_MS = 30000;
const BOSS_COOLDOWN_MS = 90000;

const RARITY_CLICK_MULT = { Common: 1.10, Uncommon: 1.30, Rare: 1.7, Legendary: 2.5, Mythical: 4.5, Event: 3.0 };
const RARITY_FLAT_DMG   = { Common: 1,    Uncommon: 2,    Rare: 5,   Legendary: 14,  Mythical: 38,  Event: 22  };

const ABILITY_DAMAGE_MULT = { Z: 5, X: 14, C: 28, V: 80 };

const RACE_ROLL_WEIGHTS = { Common: 50, Uncommon: 22, Rare: 16, Legendary: 8, Mythical: 4 };

const RACE_PERKS = {
  human:    { clickMult: 1.10, beliMult: 1.05, xpMult: 1.05, label: '+10% strike, +5% Beli, +5% XP' },
  fishman:  { clickMult: 1.15, beliMult: 1.20, xpMult: 1.00, label: '+15% strike, +20% Beli (sailing bonus)' },
  skypiean: { clickMult: 1.20, beliMult: 1.05, xpMult: 1.20, label: '+20% strike, +20% XP' },
  mink:     { clickMult: 1.30, beliMult: 1.10, xpMult: 1.10, label: '+30% strike, +10% Beli & XP' },
  cyborg:   { clickMult: 1.20, beliMult: 1.30, xpMult: 1.10, label: '+20% strike, +30% Beli, +10% XP' },
  ghoul:    { clickMult: 1.50, beliMult: 1.15, xpMult: 1.20, label: '+50% strike, +15% Beli, +20% XP' },
};

// HARDER: island Beli multipliers reduced; XP slightly more rewarding for sail rewards.
// Unlock thresholds raised so the curve takes longer.
const ISLAND_GAME = {
  'starter-island':   { unlock: 1,   beliMult: 1.0,  xpMult: 1.0, color: '#38bdf8' },
  'marine-fortress':  { unlock: 8,   beliMult: 1.8,  xpMult: 1.4, color: '#94a3b8' },
  'desert-kingdom':   { unlock: 18,  beliMult: 3.5,  xpMult: 1.9, color: '#eab308' },
  'skylands':         { unlock: 30,  beliMult: 7.0,  xpMult: 2.6, color: '#facc15' },
  'frozen-fjord':     { unlock: 45,  beliMult: 15,   xpMult: 3.5, color: '#7dd3fc' },
  'phantom-isle':     { unlock: 65,  beliMult: 30,   xpMult: 4.8, color: '#a78bfa' },
  'great-tree':       { unlock: 90,  beliMult: 60,   xpMult: 6.5, color: '#34d399' },
  'world-end':        { unlock: 130, beliMult: 120,  xpMult: 9.5, color: '#fb7185' },
};

// HARDER: cost growth from 1.15 -> 1.18; tier base costs increased a bit.
const CREW = [
  { id: 'cabin_boy',  name: 'Cabin Boy',     unlock: 0,    baseCost: 75,         bps: 0.5,    icon: 'human'  },
  { id: 'sailor',     name: 'Sailor',        unlock: 0,    baseCost: 600,        bps: 3,      icon: 'fist'   },
  { id: 'navigator',  name: 'Navigator',     unlock: 5,    baseCost: 5000,       bps: 18,     icon: 'water'  },
  { id: 'first_mate', name: 'First Mate',    unlock: 12,   baseCost: 40000,      bps: 110,    icon: 'sword'  },
  { id: 'gunner',     name: 'Master Gunner', unlock: 22,   baseCost: 360000,     bps: 800,    icon: 'lightning' },
  { id: 'captain',    name: 'Captain',       unlock: 35,   baseCost: 3200000,    bps: 5500,   icon: 'haki'   },
  { id: 'admiral',    name: 'Fleet Admiral', unlock: 55,   baseCost: 28000000,   bps: 38000,  icon: 'star'   },
  { id: 'yonko',      name: 'Yonko',         unlock: 80,   baseCost: 240000000,  bps: 260000, icon: 'beast'  },
  { id: 'sea_king',   name: 'Sea King',      unlock: 115,  baseCost: 2200000000, bps: 1800000,icon: 'fish'   },
];
const CREW_GROWTH = 1.18;

// Gacha pool weights by rarity (must include rarities present in fruits.json)
const GACHA_WEIGHTS = { Common: 35, Uncommon: 30, Rare: 20, Legendary: 12, Mythical: 3 };
const GACHA_COST = 1500000;

const QUESTS = [
  { id: 'q-clicks-100',  name: 'First Voyage',         desc: 'Strike 100 times.',                  goal: 100,  field: 'totalClicks',     reward: { beli: 800 } },
  { id: 'q-clicks-1k',   name: 'Sea Legs',             desc: 'Strike 1,000 times.',                goal: 1000, field: 'totalClicks',     reward: { beli: 8000 } },
  { id: 'q-clicks-10k',  name: 'Salt-Hardened',        desc: 'Strike 10,000 times.',               goal: 10000,field: 'totalClicks',     reward: { beli: 100000 } },
  { id: 'q-kills-50',    name: 'Bounty Hunter',        desc: 'Defeat 50 mobs.',                    goal: 50,   field: 'totalKills',      reward: { beli: 3000 } },
  { id: 'q-kills-500',   name: 'Pirate King in Training', desc: 'Defeat 500 mobs.',               goal: 500,  field: 'totalKills',      reward: { beli: 60000 } },
  { id: 'q-level-10',    name: 'Veteran',              desc: 'Reach level 10.',                    goal: 10,   field: 'level',           reward: { beli: 4000 } },
  { id: 'q-level-25',    name: 'Skylander',            desc: 'Reach level 25.',                    goal: 25,   field: 'level',           reward: { beli: 35000 } },
  { id: 'q-level-50',    name: 'Phantom Pursuer',      desc: 'Reach level 50.',                    goal: 50,   field: 'level',           reward: { beli: 350000 } },
  { id: 'q-level-100',   name: 'Yonko-class',          desc: 'Reach level 100.',                   goal: 100,  field: 'level',           reward: { beli: 5000000 } },
  { id: 'q-fruit-1',     name: 'Cursed Bite',          desc: 'Equip your first Devil Fruit.',      goal: 1,    field: 'fruitOwned',      reward: { beli: 6000 } },
  { id: 'q-fruit-5',     name: 'Collector',            desc: 'Own 5 different Devil Fruits.',      goal: 5,    field: 'fruitOwned',      reward: { beli: 250000 } },
  { id: 'q-sword-1',     name: 'First Blade',          desc: 'Buy a sword.',                       goal: 1,    field: 'swordOwned',      reward: { beli: 1500 } },
  { id: 'q-style-1',     name: 'Open Stance',          desc: 'Learn a fighting style.',            goal: 1,    field: 'styleOwned',      reward: { beli: 3000 } },
  { id: 'q-boss-1',      name: 'Slayer',               desc: 'Defeat your first boss.',            goal: 1,    field: 'bossesKilled',    reward: { beli: 15000 } },
  { id: 'q-boss-5',      name: 'Boss Hunter',          desc: 'Defeat 5 bosses.',                   goal: 5,    field: 'bossesKilled',    reward: { beli: 100000 } },
  { id: 'q-boss-25',     name: 'Conqueror',            desc: 'Defeat 25 bosses.',                  goal: 25,   field: 'bossesKilled',    reward: { beli: 1500000 } },
  { id: 'q-prestige-1',  name: 'Reborn',               desc: 'Awaken once (prestige).',            goal: 1,    field: 'prestiges',       reward: { beli: 200000 } },
  { id: 'q-gacha-10',    name: 'Lucky Sailor',         desc: 'Pull from the Devil Fruit Box 10x.', goal: 10,   field: 'gachaPulls',      reward: { beli: 100000 } },
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
  gachaPulls: 0,
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
  abilityCooldowns: {},   // { Z: timestamp, X: ..., C: ..., V: ... }
  // Admin / cheats
  godMode: false,
  autoStrike: false,
  beliMult: 1,            // multiplier on every Beli gain
  powerOverride: null,    // if set, overrides calcClickPower
  startedAt: Date.now(),
  lastSavedAt: Date.now(),
});

let state = DEFAULT_STATE();
let DATA = { fruits: [], swords: [], styles: [], races: [], locations: [], bosses: [] };
let activeShopTab = 'crew';
let activeInfoTab = 'equip';
let activeAdminTab = 'cheats';

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
    state.abilityCooldowns = state.abilityCooldowns || {};
    if (typeof state.beliMult !== 'number' || state.beliMult <= 0) state.beliMult = 1;
    return true;
  } catch (e) { return false; }
}

function levelXpReq(level) {
  // HARDER: faster XP curve
  return Math.floor(25 * Math.pow(1.30, level - 1));
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
  // HARDER: more HP per island; steeper level scaling
  const baseHp = 6 * (isle?.beliMult || 1);
  let hp = Math.max(3, Math.floor(baseHp * Math.pow(1.10, state.level - 1) * (0.85 + Math.random() * 0.3)));
  // 8% chance to spawn an Elite (5x HP, 12x reward)
  const isElite = Math.random() < 0.08 && state.level >= 3;
  if (isElite) hp *= 5;
  state.mob = {
    name: (isElite ? 'Elite ' : '') + pickMobName(state.islandId),
    hp,
    maxHp: hp,
    isBoss: false,
    isElite,
  };
}

function spawnBoss() {
  const loc = DATA.locations.find(l => l.id === state.islandId);
  const candidates = DATA.bosses.filter(b => b.location === loc?.name);
  let chosen = candidates[Math.floor(Math.random() * candidates.length)] || null;
  if (!chosen) chosen = DATA.bosses.find(b => b.recommendedLevel <= state.level + 50) || DATA.bosses[0];
  if (!chosen) return;
  const isle = ISLAND_GAME[state.islandId];
  // HARDER: bosses ~2x HP
  const hp = Math.max(80, Math.floor((chosen.hp || 1000) * 0.10 * (isle?.beliMult || 1) * Math.pow(1.04, state.level)));
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
  if (state.powerOverride) return state.powerOverride;
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
  // FIX: scale with reputation (compounds per awakening), not raw prestige count
  mult *= 1 + state.reputation * 0.10;

  return Math.max(1, Math.floor((base + flat) * mult));
}

function calcBeliPerSec() {
  let bps = 0;
  for (const c of CREW) {
    const owned = state.crew[c.id] || 0;
    bps += owned * c.bps;
  }
  // Crew income gets island bonus (sailing helps your crew earn more)
  bps *= ISLAND_GAME[state.islandId]?.beliMult || 1;

  // FIX: fruit passive is constant (no island double-multiplier),
  // capped formula so high-tier fruits don't trivialize the early game
  const fruit = DATA.fruits.find(f => f.id === state.fruitId);
  if (fruit && fruit.price) {
    bps += Math.min(fruit.price / 200000, 50);
  }

  bps *= getRaceMult('beliMult');
  // FIX: compound with reputation (was prestiges)
  bps *= 1 + state.reputation * 0.10;
  bps *= state.beliMult || 1;
  return bps;
}

function calcBeliPerKill(isBoss, isElite) {
  // HARDER: lower base reward
  let base = 2 + state.level * 0.6;
  base *= ISLAND_GAME[state.islandId]?.beliMult || 1;
  base *= getRaceMult('beliMult');
  if (isElite) base *= 12;
  if (isBoss)  base *= 25;
  base *= 1 + state.reputation * 0.10;
  base *= state.beliMult || 1;
  return Math.floor(base);
}

function calcXpPerKill(isBoss, isElite) {
  // HARDER: slightly lower XP
  let base = 2 + state.level * 0.4;
  base *= ISLAND_GAME[state.islandId]?.xpMult || 1;
  base *= getRaceMult('xpMult');
  if (isElite) base *= 6;
  if (isBoss)  base *= 12;
  return Math.floor(base);
}

function crewCost(crew) {
  const owned = state.crew[crew.id] || 0;
  return Math.ceil(crew.baseCost * Math.pow(CREW_GROWTH, owned));
}

/* ========== Mutations ========== */

function gainBeli(amount) {
  if (!isFinite(amount) || amount <= 0) return;
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
  for (const [id, cfg] of Object.entries(ISLAND_GAME)) {
    if (cfg.unlock === state.level) {
      const loc = DATA.locations.find(l => l.id === id);
      if (loc) toast({ title: 'New island!', body: loc.name + ' is now open.' });
    }
  }
  for (const c of CREW) {
    if (c.unlock === state.level) toast({ title: 'New crew!', body: c.name + ' available to hire.' });
  }
}

function dealDamage(amount, isCrit) {
  if (state.boss) {
    state.boss.hp -= amount;
    spawnFloater(amount, isCrit, false);
    if (state.boss.hp <= 0) defeatBoss();
  } else {
    if (!state.mob) spawnMob();
    state.mob.hp -= amount;
    spawnFloater(amount, isCrit, false);
    if (state.mob.hp <= 0) defeatMob();
  }
}

function strike() {
  if (!state.mob && !state.boss) spawnMob();
  state.totalClicks++;
  const power = calcClickPower();
  const isCrit = Math.random() < 0.07;
  let dmg = Math.floor(power * (isCrit ? 2.5 : 1));
  if (state.godMode) dmg = 999999999;
  dealDamage(dmg, isCrit);
}

function useAbility(key) {
  const fruit = DATA.fruits.find(f => f.id === state.fruitId);
  if (!fruit) {
    toast({ title: 'No ability', body: 'Equip a Devil Fruit first.' });
    return;
  }
  const ability = fruit.abilities?.find(a => a.key === key);
  if (!ability) return;
  const now = Date.now();
  const cdEnd = state.abilityCooldowns[key] || 0;
  if (now < cdEnd) return;

  const power = calcClickPower();
  const mult = ABILITY_DAMAGE_MULT[key] || 5;
  let dmg = Math.floor(power * mult);
  if (state.godMode) dmg = 999999999;

  dealDamage(dmg, true);
  state.abilityCooldowns[key] = now + (ability.cooldown || 5) * 1000;
  spawnFloater(ability.name + '!', true, false);
  renderAbilityBar();
}

function defeatMob() {
  const isElite = !!state.mob?.isElite;
  const beli = calcBeliPerKill(false, isElite);
  const xp = calcXpPerKill(false, isElite);
  gainBeli(beli);
  gainXp(xp);
  state.totalKills++;
  spawnFloater('+' + fmtNum(beli) + ' Beli', false, true);
  if (isElite) toast({ title: 'Elite kill!', body: '+' + fmtNum(beli) + ' Beli', kind: 'success' });
  spawnMob();
  checkQuests();
}

function defeatBoss() {
  const boss = state.boss;
  if (!boss) return;
  const beli = calcBeliPerKill(true, false);
  const xp = calcXpPerKill(true, false);
  gainBeli(beli);
  gainXp(xp);
  state.bossesKilled++;
  state.bossLog.unshift({ id: boss.id, name: boss.name, at: Date.now() });
  state.bossLog = state.bossLog.slice(0, 20);
  spawnFloater('+' + fmtNum(beli) + ' Beli', false, true);
  toast({ title: 'Boss defeated!', body: boss.name + ' — +' + fmtNum(beli) + ' Beli, +' + fmtNum(xp) + ' XP', kind: 'boss' });

  // FIX: random drop with proper chance
  if (boss.drops?.length) {
    for (const drop of boss.drops) {
      const chanceStr = String(drop.chance || '');
      const m = chanceStr.match(/(\d+(?:\.\d+)?)/);
      const pct = m ? parseFloat(m[1]) / 100 : 0;
      if (pct > 0 && Math.random() < pct) {
        // Try to match exactly first, then partial
        const fruitMatch = DATA.fruits.find(f => f.name.toLowerCase() === drop.name.toLowerCase());
        const swordMatch = DATA.swords.find(s => s.name.toLowerCase() === drop.name.toLowerCase());
        if (fruitMatch && !state.ownedFruits.includes(fruitMatch.id)) {
          state.ownedFruits.push(fruitMatch.id);
          toast({ title: '🎁 Loot drop!', body: 'You found ' + fruitMatch.name + '!', kind: 'success' });
        } else if (swordMatch && !state.ownedSwords.includes(swordMatch.id)) {
          state.ownedSwords.push(swordMatch.id);
          toast({ title: '🎁 Loot drop!', body: 'You found ' + swordMatch.name + '!', kind: 'success' });
        }
      }
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
  renderShop(); renderInfo(); renderTopbar(); renderArena();
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
  // HARDER: prices roughly doubled
  const baseByRarity = { Common: 200, Uncommon: 8000, Rare: 120000, Legendary: 1500000, Mythical: 24000000 };
  return baseByRarity[sword.rarity] || 1000;
}

function gachaPull() {
  if (state.beli < GACHA_COST) {
    toast({ title: 'Not enough Beli', body: 'Need ' + fmtNum(GACHA_COST) + ' Beli for a pull.' });
    return;
  }
  state.beli -= GACHA_COST;
  state.gachaPulls++;
  // Roll rarity, then pick a fruit of that rarity
  const total = Object.values(GACHA_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let chosenRarity = 'Common';
  for (const [rar, w] of Object.entries(GACHA_WEIGHTS)) { r -= w; if (r <= 0) { chosenRarity = rar; break; } }
  const candidates = DATA.fruits.filter(f => f.rarity === chosenRarity);
  if (!candidates.length) {
    toast({ title: 'Empty box', body: 'No fruits of that rarity. Beli refunded.' });
    state.beli += GACHA_COST; return;
  }
  const fruit = candidates[Math.floor(Math.random() * candidates.length)];
  if (!state.ownedFruits.includes(fruit.id)) {
    state.ownedFruits.push(fruit.id);
    if (!state.fruitId) state.fruitId = fruit.id;
    toast({ title: '🎰 ' + chosenRarity + ' pull!', body: 'You got ' + fruit.name + '!', kind: 'success' });
  } else {
    const refund = Math.floor(GACHA_COST * 0.4);
    state.beli += refund;
    toast({ title: '🎰 Duplicate', body: 'Already own ' + fruit.name + '. Refunded ' + fmtNum(refund) + ' Beli.', kind: 'success' });
  }
  renderShop(); renderInfo(); renderTopbar(); renderArena();
  checkQuests();
}

function prestige() {
  if (state.level < 30) {
    toast({ title: 'Not yet', body: 'Reach level 30 before awakening.' });
    return;
  }
  const gain = 1 + Math.floor(Math.log2(Math.max(2, state.totalBeliEarned / 100000)));
  if (!confirm(`Awaken? You will reset to level 1 and gain +${gain} Reputation (permanent +${(gain * 50)}% strike, +${(gain * 10)}% Beli/sec). Owned fruits, swords, styles, race, and bosses defeated stay.`)) return;
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
    gachaPulls: state.gachaPulls,
    prestiges: state.prestiges + 1,
    reputation: state.reputation + gain,
    godMode: state.godMode,
    autoStrike: state.autoStrike,
    beliMult: state.beliMult,
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
  switch (q.field) {
    case 'totalClicks':   return state.totalClicks;
    case 'totalKills':    return state.totalKills;
    case 'level':         return state.level;
    case 'fruitOwned':    return state.ownedFruits.length;
    case 'swordOwned':    return state.ownedSwords.length;
    case 'styleOwned':    return state.ownedStyles.length;
    case 'bossesKilled':  return state.bossesKilled;
    case 'prestiges':     return state.prestiges;
    case 'gachaPulls':    return state.gachaPulls;
  }
  return 0;
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
  const lvBig = document.getElementById('ui-level-big'); if (lvBig) lvBig.textContent = 'Lvl ' + state.level;
  const xpReq = levelXpReq(state.level);
  document.getElementById('ui-xp').textContent = fmtNum(Math.floor(state.xp)) + ' / ' + fmtNum(xpReq);
  document.getElementById('ui-xp-fill').style.width = Math.min(100, (state.xp / xpReq) * 100) + '%';
  document.getElementById('ui-power').textContent = fmtNum(calcClickPower());
  const race = DATA.races.find(r => r.id === state.raceId);
  document.getElementById('ui-race').textContent = race ? race.name : '—';
  const loc = DATA.locations.find(l => l.id === state.islandId);
  document.getElementById('ui-island').textContent = loc?.name || '—';
  // Visual cue when god mode is on
  document.body.classList.toggle('godmode', !!state.godMode);
}

function renderArena() {
  const arena = document.getElementById('arena');
  if (!arena) return;
  const isBoss = !!state.boss;
  const target = isBoss ? state.boss : state.mob;
  if (!target) return;
  const isElite = !isBoss && !!state.mob?.isElite;
  const bossBanner = isBoss ? `
    <div class="boss-banner">
      <span class="label">⚠ Boss Battle</span>
      <span class="timer" id="boss-timer">${Math.max(0, Math.ceil((state.boss.expiresAt - Date.now()) / 1000))}s</span>
    </div>` : '';
  const spawnBtn = !isBoss ? `
    <button class="boss-spawn-btn" id="spawn-boss-btn" ${Date.now() < state.bossNextAt ? 'disabled' : ''}>
      ${Date.now() < state.bossNextAt
        ? '⏳ Boss in ' + Math.ceil((state.bossNextAt - Date.now()) / 1000) + 's'
        : '⚔ Summon Boss'}
    </button>` : '';
  const loc = DATA.locations.find(l => l.id === state.islandId);

  arena.innerHTML = `
    <div class="island-label">⚓ Sailing · <span class="island-name">${escapeHtml(loc?.name || '—')}</span></div>
    ${bossBanner}
    <div class="mob-card">
      <div class="mob-portrait ${isBoss ? 'boss' : ''} ${isElite ? 'elite' : ''}" id="mob-portrait">${isBoss ? Icons.skull : Icons.human}</div>
      <div class="mob-name">${escapeHtml(target.name)}</div>
      <div class="mob-sub">${isBoss ? 'World Boss' : isElite ? 'Elite — 12× Beli' : 'Wild encounter'}</div>
      <div class="mob-hp"><div class="mob-hp-fill ${isBoss ? 'boss' : ''}" id="mob-hp-fill" style="width:${(target.hp / target.maxHp) * 100}%"></div></div>
      <div class="mob-hp-text" id="mob-hp-text">${fmtNum(Math.max(0, target.hp))} / ${fmtNum(target.maxHp)} HP</div>
    </div>
    <button class="strike-btn" id="strike-btn">
      <span>⚔ STRIKE</span>
      <span class="strike-power">+${fmtNum(calcClickPower())} per hit</span>
    </button>
    <div class="ability-bar" id="ability-bar"></div>
    ${spawnBtn}
    <button class="gacha-btn" id="gacha-btn">🎰 Devil Fruit Box · ${fmtNum(GACHA_COST)} Beli</button>
    <div class="floaters" id="floaters"></div>
  `;
  document.getElementById('strike-btn').addEventListener('click', strike);
  document.getElementById('spawn-boss-btn')?.addEventListener('click', () => {
    if (Date.now() < state.bossNextAt) return;
    spawnBoss();
    renderArena();
  });
  document.getElementById('gacha-btn')?.addEventListener('click', gachaPull);
  renderAbilityBar();
}

function renderAbilityBar() {
  const bar = document.getElementById('ability-bar');
  if (!bar) return;
  const fruit = DATA.fruits.find(f => f.id === state.fruitId);
  if (!fruit) {
    bar.innerHTML = '<div class="ability-empty">Equip a Devil Fruit to unlock Z / X / C / V abilities</div>';
    return;
  }
  const now = Date.now();
  bar.innerHTML = ['Z', 'X', 'C', 'V'].map(key => {
    const ab = fruit.abilities?.find(a => a.key === key);
    if (!ab) return `<div class="ability-slot empty"><div class="ability-key">${key}</div><div class="ability-name">—</div></div>`;
    const cdEnd = state.abilityCooldowns[key] || 0;
    const remaining = Math.max(0, cdEnd - now);
    const pct = ab.cooldown ? (remaining / (ab.cooldown * 1000)) * 100 : 0;
    const ready = remaining <= 0;
    return `
      <button class="ability-slot ${ready ? 'ready' : 'cooling'}" data-ability="${key}" title="${escapeHtml(ab.name)}: ${escapeHtml(ab.desc)}">
        <div class="ability-key">${key}</div>
        <div class="ability-name">${escapeHtml(ab.name)}</div>
        <div class="ability-mult">${ABILITY_DAMAGE_MULT[key]}× dmg</div>
        ${!ready ? `<div class="ability-cd-overlay" style="--pct:${pct}%"></div><div class="ability-cd-text">${(remaining / 1000).toFixed(1)}s</div>` : ''}
      </button>`;
  }).join('');
  bar.querySelectorAll('[data-ability]').forEach(b =>
    b.addEventListener('click', () => useAbility(b.dataset.ability))
  );
}

function renderArenaQuick() {
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
      spawnBtn.textContent = '⏳ Boss in ' + Math.ceil((state.bossNextAt - Date.now()) / 1000) + 's';
    } else {
      spawnBtn.disabled = false;
      spawnBtn.textContent = '⚔ Summon Boss';
    }
  }
  renderAbilityBar();
}

function spawnFloater(value, isCrit, isBeli) {
  const root = document.getElementById('floaters');
  if (!root) return;
  const el = document.createElement('div');
  el.className = 'floater' + (isCrit ? ' crit' : '') + (isBeli ? ' beli' : '');
  el.textContent = (isBeli ? '' : (typeof value === 'number' ? '-' : '')) + (typeof value === 'number' ? fmtNum(value) : value);
  el.style.left = (30 + Math.random() * 60) + '%';
  el.style.top = (40 + Math.random() * 30) + '%';
  root.appendChild(el);
  setTimeout(() => el.remove(), 950);
  if (!isBeli) {
    const portrait = document.getElementById('mob-portrait');
    if (portrait) {
      portrait.classList.remove('hit');
      void portrait.offsetWidth;
      portrait.classList.add('hit');
    }
  }
}

function renderShop() {
  document.querySelectorAll('#shop-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === activeShopTab));
  document.querySelectorAll('#shop-panes .tab-pane').forEach(p => p.classList.toggle('active', p.id === 'pane-' + activeShopTab));
  document.getElementById('pane-crew').innerHTML = renderCrewShop();
  document.getElementById('pane-fruits').innerHTML = renderFruitShop();
  document.getElementById('pane-swords').innerHTML = renderSwordShop();
  document.getElementById('pane-styles').innerHTML = renderStyleShop();
  document.getElementById('pane-islands').innerHTML = renderIslandShop();

  document.querySelectorAll('#pane-crew [data-buy]').forEach(b => b.addEventListener('click', () => buyCrew(b.dataset.buy)));
  document.querySelectorAll('#pane-fruits [data-buy]').forEach(b => b.addEventListener('click', () => buyFruit(b.dataset.buy)));
  document.querySelectorAll('#pane-swords [data-buy]').forEach(b => b.addEventListener('click', () => buySword(b.dataset.buy)));
  document.querySelectorAll('#pane-styles [data-buy]').forEach(b => b.addEventListener('click', () => buyStyle(b.dataset.buy)));
  document.querySelectorAll('#pane-islands [data-travel]').forEach(b => b.addEventListener('click', () => travelTo(b.dataset.travel)));
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
  // Sort: equipped > owned > affordable > rest
  const sorted = [...DATA.fruits].sort((a, b) => (a.price || 0) - (b.price || 0));
  return sorted.map(f => {
    const owned = state.ownedFruits.includes(f.id);
    const equipped = state.fruitId === f.id;
    const cant = !owned && state.beli < f.price;
    return `
      <button class="shop-item ${equipped ? 'equipped' : ''}" data-buy="${f.id}" ${cant ? 'disabled' : ''}>
        <div class="shop-icon" style="color:${f.color}">${Icons[f.icon] || Icons.flame}</div>
        <div class="shop-info">
          <div class="name">${escapeHtml(f.name)}</div>
          <div class="meta">${f.type} · ${f.rarity} · ×${RARITY_CLICK_MULT[f.rarity]} strike</div>
          <div class="perk">+${fmtNum(RARITY_FLAT_DMG[f.rarity])} flat dmg, +${fmtNum(Math.min((f.price || 0) / 200000, 50))}/s passive</div>
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
  const race  = DATA.races.find(r => r.id === state.raceId);
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
  const beliPerClick = Math.floor((calcBeliPerKill(false, false) / Math.max(1, state.mob?.maxHp || 1)) * calcClickPower());
  const rows = [
    ['Total clicks', fmtNum(state.totalClicks)],
    ['Total kills',  fmtNum(state.totalKills)],
    ['Bosses defeated', fmtNum(state.bossesKilled)],
    ['Total Beli earned', fmtNum(Math.floor(state.totalBeliEarned))],
    ['Gacha pulls', fmtNum(state.gachaPulls)],
    ['Awakenings', fmtNum(state.prestiges)],
    ['Reputation', fmtNum(state.reputation)],
    ['Strike power', fmtNum(calcClickPower())],
    ['Beli/sec', fmtNum(Math.floor(calcBeliPerSec() * 10) / 10)],
    ['Beli mult', state.beliMult.toFixed(2) + '×'],
    ['God mode', state.godMode ? 'ON' : 'OFF'],
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
      <button class="btn-sm" id="reroll-pick" style="margin-top:10px;align-self:center">🎲 Reroll all 4</button>
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

/* ========== ADMIN PANEL ========== */

function openAdminPanel() {
  const html = `
    <div class="admin-modal">
      <div class="admin-head">
        <button class="modal-close" aria-label="Close">${Icons.close}</button>
        <span class="admin-eyebrow">⚙ DEV CONSOLE</span>
        <h2 class="admin-title">Admin Panel</h2>
        <p class="admin-sub">Bend the seas to your will. Changes apply immediately.</p>
      </div>
      <div class="admin-tabs">
        <button class="admin-tab ${activeAdminTab==='cheats'?'active':''}" data-admin-tab="cheats">💎 Cheats</button>
        <button class="admin-tab ${activeAdminTab==='inventory'?'active':''}" data-admin-tab="inventory">🎒 Inventory</button>
        <button class="admin-tab ${activeAdminTab==='world'?'active':''}" data-admin-tab="world">🌍 World</button>
        <button class="admin-tab ${activeAdminTab==='state'?'active':''}" data-admin-tab="state">📊 State</button>
      </div>
      <div class="admin-body" id="admin-body"></div>
    </div>
  `;
  openModal(html, 'rgba(99,102,241,0.25)');
  document.querySelectorAll('.admin-tab').forEach(t => t.addEventListener('click', () => {
    activeAdminTab = t.dataset.adminTab;
    document.querySelectorAll('.admin-tab').forEach(x => x.classList.toggle('active', x === t));
    renderAdminBody();
  }));
  renderAdminBody();
}

function renderAdminBody() {
  const root = document.getElementById('admin-body');
  if (!root) return;
  if (activeAdminTab === 'cheats')    root.innerHTML = renderAdminCheats();
  if (activeAdminTab === 'inventory') root.innerHTML = renderAdminInventory();
  if (activeAdminTab === 'world')     root.innerHTML = renderAdminWorld();
  if (activeAdminTab === 'state')     root.innerHTML = renderAdminState();
  wireAdminButtons();
}

function renderAdminCheats() {
  return `
    <div class="admin-section">
      <div class="admin-section-title">💰 Beli</div>
      <div class="admin-grid">
        <button class="admin-btn" data-act="addBeli" data-amt="1000">+1K Beli</button>
        <button class="admin-btn" data-act="addBeli" data-amt="100000">+100K</button>
        <button class="admin-btn" data-act="addBeli" data-amt="10000000">+10M</button>
        <button class="admin-btn primary" data-act="addBeli" data-amt="1000000000">+1B Beli</button>
        <button class="admin-btn primary" data-act="addBeli" data-amt="1e15">∞ Beli</button>
        <button class="admin-btn danger" data-act="resetBeli">Zero Beli</button>
      </div>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">⭐ XP & Levels</div>
      <div class="admin-grid">
        <button class="admin-btn" data-act="addXp" data-amt="100">+100 XP</button>
        <button class="admin-btn" data-act="addXp" data-amt="10000">+10K XP</button>
        <button class="admin-btn" data-act="addLevel" data-amt="1">+1 Level</button>
        <button class="admin-btn" data-act="addLevel" data-amt="10">+10 Levels</button>
        <button class="admin-btn primary" data-act="addLevel" data-amt="50">+50 Levels</button>
        <button class="admin-btn primary" data-act="setLevel" data-amt="999">Set Level 999</button>
      </div>
      <div class="admin-row">
        <label>Set level to:</label>
        <input type="number" id="admin-level-input" min="1" max="9999" value="${state.level}" />
        <button class="admin-btn" data-act="setLevelInput">Apply</button>
      </div>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">⚔ Combat Cheats</div>
      <div class="admin-grid">
        <button class="admin-btn ${state.godMode?'on':''}" data-act="toggleGod">${state.godMode?'✓ God Mode ON':'God Mode'}</button>
        <button class="admin-btn ${state.autoStrike?'on':''}" data-act="toggleAuto">${state.autoStrike?'✓ Auto-Strike ON':'Auto-Strike'}</button>
        <button class="admin-btn" data-act="killMob">Kill Current Mob</button>
        <button class="admin-btn" data-act="killBoss">Kill Current Boss</button>
      </div>
      <div class="admin-row">
        <label>Beli multiplier:</label>
        <select id="admin-beli-mult">
          ${[1, 2, 5, 10, 100, 1000, 10000].map(v => `<option value="${v}" ${state.beliMult==v?'selected':''}>${v}×</option>`).join('')}
        </select>
        <button class="admin-btn" data-act="setBeliMult">Apply</button>
      </div>
      <div class="admin-row">
        <label>Strike power override:</label>
        <input type="number" id="admin-power-input" min="0" placeholder="(leave 0 for normal)" value="${state.powerOverride || 0}" />
        <button class="admin-btn" data-act="setPower">Set</button>
      </div>
    </div>
  `;
}

function renderAdminInventory() {
  return `
    <div class="admin-section">
      <div class="admin-section-title">🍇 Devil Fruits (${state.ownedFruits.length}/${DATA.fruits.length})</div>
      <div class="admin-grid">
        <button class="admin-btn primary" data-act="unlockAllFruits">Unlock All Fruits</button>
        <button class="admin-btn" data-act="randomMythical">Equip Random Mythical</button>
        <button class="admin-btn danger" data-act="clearFruits">Clear Owned Fruits</button>
      </div>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">⚔ Swords (${state.ownedSwords.length}/${DATA.swords.length})</div>
      <div class="admin-grid">
        <button class="admin-btn primary" data-act="unlockAllSwords">Unlock All Swords</button>
        <button class="admin-btn danger" data-act="clearSwords">Clear Swords</button>
      </div>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">🥋 Fighting Styles (${state.ownedStyles.length}/${DATA.styles.length})</div>
      <div class="admin-grid">
        <button class="admin-btn primary" data-act="unlockAllStyles">Unlock All Styles</button>
        <button class="admin-btn danger" data-act="clearStyles">Clear Styles</button>
      </div>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">🧬 Race</div>
      <div class="admin-row">
        <label>Set race:</label>
        <select id="admin-race">
          <option value="">— none —</option>
          ${DATA.races.map(r => `<option value="${r.id}" ${state.raceId===r.id?'selected':''}>${r.name} (${r.rarity})</option>`).join('')}
        </select>
        <button class="admin-btn" data-act="setRace">Apply</button>
        <button class="admin-btn" data-act="rerollRace">🎲 Reroll picker</button>
      </div>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">⚓ Crew</div>
      <div class="admin-grid">
        <button class="admin-btn" data-act="addCrew" data-amt="10">+10 each</button>
        <button class="admin-btn" data-act="addCrew" data-amt="100">+100 each</button>
        <button class="admin-btn primary" data-act="addCrew" data-amt="1000">+1000 each</button>
        <button class="admin-btn danger" data-act="clearCrew">Clear Crew</button>
      </div>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">🎰 Gacha</div>
      <div class="admin-grid">
        <button class="admin-btn primary" data-act="freeGacha" data-amt="1">Free Pull</button>
        <button class="admin-btn primary" data-act="freeGacha" data-amt="10">10 Free Pulls</button>
        <button class="admin-btn primary" data-act="freeGacha" data-amt="50">50 Free Pulls</button>
      </div>
    </div>
  `;
}

function renderAdminWorld() {
  return `
    <div class="admin-section">
      <div class="admin-section-title">⚓ Travel</div>
      <div class="admin-grid">
        ${DATA.locations.map(l => `<button class="admin-btn ${state.islandId===l.id?'on':''}" data-act="travel" data-id="${l.id}">${l.name}</button>`).join('')}
      </div>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">💀 Spawn Boss</div>
      <div class="admin-grid">
        ${DATA.bosses.map(b => `<button class="admin-btn" data-act="spawnBossById" data-id="${b.id}">${b.name}</button>`).join('')}
      </div>
      <div class="admin-grid" style="margin-top:8px">
        <button class="admin-btn" data-act="resetBossCd">Reset Boss CD</button>
        <button class="admin-btn danger" data-act="killBossNow">Insta-defeat</button>
      </div>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">⚡ Prestige</div>
      <div class="admin-grid">
        <button class="admin-btn primary" data-act="forcePrestige">Force Awaken (+1 Rep)</button>
        <button class="admin-btn primary" data-act="forcePrestige" data-amt="10">+10 Reputation</button>
        <button class="admin-btn primary" data-act="forcePrestige" data-amt="100">+100 Reputation</button>
      </div>
      <div class="admin-row">
        <label>Set Reputation:</label>
        <input type="number" id="admin-rep-input" min="0" value="${state.reputation}" />
        <button class="admin-btn" data-act="setRep">Apply</button>
      </div>
    </div>
  `;
}

function renderAdminState() {
  const stateJson = JSON.stringify(state, null, 2);
  return `
    <div class="admin-section">
      <div class="admin-section-title">📊 Live State</div>
      <textarea class="admin-state-view" id="admin-state-view" rows="14" readonly>${escapeHtml(stateJson)}</textarea>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">💾 Save</div>
      <div class="admin-grid">
        <button class="admin-btn" data-act="exportSave">Export Save (JSON)</button>
        <button class="admin-btn" data-act="copySave">Copy to Clipboard</button>
      </div>
      <div class="admin-row">
        <label>Import save:</label>
        <textarea id="admin-import" rows="3" placeholder="Paste exported save JSON here"></textarea>
        <button class="admin-btn primary" data-act="importSave">Load</button>
      </div>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">⌨ Shortcuts</div>
      <ul class="admin-shortcuts">
        <li><kbd>Space</kbd> — Strike</li>
        <li><kbd>Z</kbd> <kbd>X</kbd> <kbd>C</kbd> <kbd>V</kbd> — Use fruit abilities</li>
        <li><kbd>~</kbd> or <kbd>\`</kbd> — Toggle this admin panel</li>
        <li><kbd>/</kbd> — Search the wiki</li>
        <li><kbd>Esc</kbd> — Close modals / search</li>
      </ul>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">⚠ Danger Zone</div>
      <div class="admin-grid">
        <button class="admin-btn danger" data-act="hardReset">⟲ Hard Reset</button>
      </div>
    </div>
  `;
}

function wireAdminButtons() {
  document.querySelectorAll('.admin-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAdminAction(btn.dataset.act, btn));
  });
}

function handleAdminAction(act, btn) {
  const amt = btn?.dataset?.amt;
  const id  = btn?.dataset?.id;
  switch (act) {
    case 'addBeli':         gainBeli(parseFloat(amt)); break;
    case 'resetBeli':       state.beli = 0; break;
    case 'addXp':           gainXp(parseFloat(amt)); break;
    case 'addLevel':        for (let i = 0; i < parseInt(amt); i++) { state.xp = levelXpReq(state.level); gainXp(0); state.level++; } break;
    case 'setLevel':        state.level = Math.max(1, parseInt(amt) || 1); state.xp = 0; break;
    case 'setLevelInput': {
      const v = parseInt(document.getElementById('admin-level-input').value) || 1;
      state.level = Math.max(1, v); state.xp = 0;
      break;
    }
    case 'toggleGod':       state.godMode = !state.godMode; break;
    case 'toggleAuto':      state.autoStrike = !state.autoStrike; break;
    case 'killMob':         if (state.mob) state.mob.hp = 0; strike(); break;
    case 'killBoss':        if (state.boss) state.boss.hp = 0; if (state.boss) defeatBoss(); break;
    case 'setBeliMult':     state.beliMult = parseFloat(document.getElementById('admin-beli-mult').value) || 1; break;
    case 'setPower': {
      const v = parseFloat(document.getElementById('admin-power-input').value);
      state.powerOverride = (v && v > 0) ? v : null;
      break;
    }
    case 'unlockAllFruits': state.ownedFruits = DATA.fruits.map(f => f.id); break;
    case 'randomMythical': {
      const myth = DATA.fruits.filter(f => f.rarity === 'Mythical');
      const pick = myth[Math.floor(Math.random() * myth.length)];
      if (pick) { if (!state.ownedFruits.includes(pick.id)) state.ownedFruits.push(pick.id); state.fruitId = pick.id; toast({ title: 'Equipped', body: pick.name, kind: 'success' }); }
      break;
    }
    case 'clearFruits':     state.ownedFruits = []; state.fruitId = null; break;
    case 'unlockAllSwords': state.ownedSwords = DATA.swords.map(s => s.id); break;
    case 'clearSwords':     state.ownedSwords = []; state.swordId = null; break;
    case 'unlockAllStyles': state.ownedStyles = DATA.styles.map(s => s.id); break;
    case 'clearStyles':     state.ownedStyles = []; state.styleId = null; break;
    case 'setRace':         state.raceId = document.getElementById('admin-race').value || null; break;
    case 'rerollRace':      closeModal(); promptRaceRoll(); return;
    case 'addCrew':         CREW.forEach(c => { state.crew[c.id] = (state.crew[c.id] || 0) + parseInt(amt); }); break;
    case 'clearCrew':       state.crew = {}; break;
    case 'freeGacha': {
      for (let i = 0; i < parseInt(amt); i++) {
        const tmpBeli = state.beli;
        state.beli = GACHA_COST;
        gachaPull();
        state.beli = tmpBeli + (state.beli - 0); // gachaPull may refund
      }
      break;
    }
    case 'travel':          travelTo(id); break;
    case 'spawnBossById': {
      const boss = DATA.bosses.find(b => b.id === id);
      if (!boss) break;
      const isle = ISLAND_GAME[state.islandId];
      const hp = Math.max(80, Math.floor((boss.hp || 1000) * 0.10 * (isle?.beliMult || 1) * Math.pow(1.04, state.level)));
      state.boss = { id: boss.id, name: boss.name, hp, maxHp: hp, expiresAt: Date.now() + BOSS_WINDOW_MS, drops: boss.drops || [] };
      toast({ title: 'Boss spawned', body: boss.name, kind: 'boss' });
      break;
    }
    case 'resetBossCd':     state.bossNextAt = Date.now(); break;
    case 'killBossNow':     if (state.boss) defeatBoss(); break;
    case 'forcePrestige': {
      const n = parseInt(amt) || 1;
      state.reputation += n;
      state.prestiges  += 1;
      toast({ title: 'Reputation +' + n, kind: 'success' });
      break;
    }
    case 'setRep':          state.reputation = Math.max(0, parseInt(document.getElementById('admin-rep-input').value) || 0); break;
    case 'exportSave': {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'sailor-piece-save.json'; a.click();
      URL.revokeObjectURL(url);
      break;
    }
    case 'copySave': {
      const text = JSON.stringify(state);
      navigator.clipboard?.writeText(text);
      toast({ title: 'Copied save', body: text.length + ' bytes', kind: 'success' });
      break;
    }
    case 'importSave': {
      try {
        const txt = document.getElementById('admin-import').value;
        const parsed = JSON.parse(txt);
        state = Object.assign(DEFAULT_STATE(), parsed);
        toast({ title: 'Save imported', kind: 'success' });
        renderAll();
      } catch (e) { toast({ title: 'Invalid JSON', body: e.message }); }
      break;
    }
    case 'hardReset':       hardReset(); return;
  }
  // Re-render after state change
  save();
  renderAll();
  // Refresh the current admin pane to reflect new state
  renderAdminBody();
}

/* ========== Tick loops ========== */

function tick() {
  if (state.boss && Date.now() > state.boss.expiresAt) {
    toast({ title: 'Boss escaped', body: state.boss.name + ' got away.', kind: 'boss' });
    state.boss = null;
    state.bossNextAt = Date.now() + BOSS_COOLDOWN_MS / 2;
    renderArena();
  }
  renderArenaQuick();
  // Auto-strike (admin)
  if (state.autoStrike) strike();
}

function passiveTick() {
  const bps = calcBeliPerSec();
  if (bps > 0) gainBeli(bps);
  renderTopbar();
  // Style auto-strike chance
  if (state.styleId) {
    const style = DATA.styles.find(s => s.id === state.styleId);
    const chance = { Common: 0, Uncommon: 0.05, Rare: 0.1, Legendary: 0.15, Mythical: 0.25 }[style?.rarity] || 0;
    if (Math.random() < chance) strike();
  }
}

/* ========== Init ========== */

async function init() {
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
    document.getElementById('arena').innerHTML = '<div class="empty">Failed to load game data: ' + (e.message || e) + '</div>';
    return;
  }

  // Wiki search
  registerSearch(DATA.fruits.map(i => ({ name: i.name, subtitle: i.type, description: i.description, category: 'Fruits', icon: i.icon, color: i.color, url: 'fruits.html#' + i.id, tags: [i.rarity] })));
  registerSearch(DATA.swords.map(i => ({ name: i.name, subtitle: i.rarity, description: i.description, category: 'Swords', icon: 'sword', color: 'var(--gold)', url: 'swords.html#' + i.id, tags: [i.rarity] })));
  registerSearch(DATA.styles.map(i => ({ name: i.name, subtitle: i.rarity, description: i.description, category: 'Styles', icon: i.icon, color: 'var(--cyan)', url: 'styles.html#' + i.id, tags: [i.rarity] })));
  registerSearch(DATA.races.map(i => ({ name: i.name, subtitle: i.rarity, description: i.description, category: 'Races', icon: i.icon, color: i.color, url: 'races.html#' + i.id, tags: [i.rarity] })));
  registerSearch(DATA.locations.map(i => ({ name: i.name, subtitle: i.sea, description: i.description, category: 'Islands', icon: 'island', color: 'var(--teal)', url: 'locations.html#' + i.id, tags: [i.sea] })));
  registerSearch(DATA.bosses.map(i => ({ name: i.name, subtitle: 'Lvl ' + i.level, description: i.description, category: 'Bosses', icon: 'skull', color: 'var(--coral)', url: 'bosses.html#' + i.id, tags: [i.rarity] })));

  const hadSave = load();

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

  if (!state.mob && !state.boss) spawnMob();

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
  document.getElementById('admin-btn')?.addEventListener('click', openAdminPanel);

  if (!state.raceId) promptRaceRoll();

  renderAll();

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === ' ') { e.preventDefault(); strike(); return; }
    if (e.key === '`' || e.key === '~') { e.preventDefault(); openAdminPanel(); return; }
    const k = e.key.toUpperCase();
    if (['Z', 'X', 'C', 'V'].includes(k)) { e.preventDefault(); useAbility(k); }
  });

  setInterval(tick, TICK_MS);
  setInterval(passiveTick, PASSIVE_TICK_MS);
  setInterval(save, SAVE_INTERVAL_MS);
  window.addEventListener('beforeunload', save);
}

document.addEventListener('DOMContentLoaded', init);
