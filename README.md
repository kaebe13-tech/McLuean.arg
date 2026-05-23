# Sailor Piece Idle (+ Wiki)

A browser-based **incremental/idle game** inspired by the Roblox game **Sailor Piece**, with a built-in fan wiki for reference. Static site, JSON-driven, no build step, deploys to GitHub Pages with one push.

> **Fan project.** Not affiliated with the game's developers. All content is community-sourced — submit corrections via PR.

## The game (`index.html`)

Click "STRIKE" (or press Space) to defeat mobs. Earn Beli, level up, unlock new islands, hire idle crewmates, buy Devil Fruits and swords, and chase boss drops. Save is automatic to `localStorage` with offline progress (capped at 4 hours).

**Core loop**
- **Strike** mobs → earn Beli + XP per kill (boosted by your current Island).
- **Hire crew** (Cabin Boy → Sailor → Navigator → Captain → Yonko → Sea King) for passive Beli/sec.
- **Equip a Devil Fruit** for a strike-damage multiplier and passive income.
- **Equip a sword** and **learn a fighting style** for flat damage.
- **Roll a race** on first launch (rates: 50% Common, 22% Uncommon, 16% Rare, 8% Legendary, 4% Mythical) for a permanent passive.
- **Sail to new islands** (unlock at higher levels) for stronger mobs and bigger rewards.
- **Summon bosses** for big drops — including a chance at their unique fruit/sword.
- **Awaken (prestige)** at level 30+ to reset progress for permanent Reputation: +50% strike and +10% Beli/sec per stack. Owned fruits, swords, styles, race, and bosses-defeated are kept.

**Controls**
- Click the STRIKE button or press `Space` to attack.
- Press `/` anywhere to search the wiki.
- All buttons in the shop are buy/equip toggles.

**Saving**
- Auto-saves every 5 seconds and on tab close.
- "Hard reset" clears the save and re-rolls your race.

## Features

- **JSON-driven content** — edit `data/*.json` to add, remove, or rebalance entries. No code changes needed.
- **Catalog pages** for Fruits, Swords, Fighting Styles, Races, Islands, and Bosses, plus an Update Log timeline.
- **Live filters** — search and chip filters per page (rarity, type, sea, etc.).
- **Global search** — press `/` from anywhere to fuzzy-search across every category.
- **Modal deep links** — every entry has a stable URL like `fruits.html#flame`.
- **Mobile-first** responsive design with a hamburger nav and stacked cards under 900px.
- **No build step** — vanilla HTML/CSS/JS modules. Open `index.html` in a browser, or serve any static host.

## Local preview

The site uses `fetch()` to load JSON, so it needs to be served over HTTP (file:// will fail CORS). Any static server works:

```bash
# Python 3
python3 -m http.server 8080

# Node (npx)
npx serve .
```

Then open <http://localhost:8080>.

## Project structure

```
.
├── index.html              # Home: hero, stats, featured fruits & bosses
├── fruits.html             # Catalog: Devil Fruits
├── swords.html             # Catalog: Swords
├── styles.html             # Catalog: Fighting Styles
├── races.html              # Catalog: Races
├── locations.html          # Catalog: Islands
├── bosses.html             # Catalog: Bosses
├── updates.html            # Patch notes timeline
├── 404.html                # Not-found page
├── assets/
│   ├── css/styles.css      # Design system + components
│   └── js/
│       ├── app.js          # Shell: nav, footer, search overlay, modal, kbd
│       └── data.js         # Page renderers + filters
├── data/                   # All content lives here as JSON
│   ├── fruits.json
│   ├── swords.json
│   ├── styles.json
│   ├── races.json
│   ├── locations.json
│   ├── bosses.json
│   └── updates.json
├── .github/workflows/pages.yml   # Auto-deploy to GitHub Pages
└── .nojekyll               # Skip Jekyll processing on Pages
```

## Editing content

### Adding a Devil Fruit

Open `data/fruits.json` and append an entry:

```json
{
  "id": "rumble",
  "name": "Rumble Fruit",
  "type": "Logia",
  "rarity": "Mythical",
  "price": 2500000,
  "color": "#60a5fa",
  "icon": "lightning",
  "element": "Lightning",
  "awakening": true,
  "featured": false,
  "description": "Hitscan thunder strikes...",
  "abilities": [
    { "key": "Z", "name": "Thunder Bolt", "desc": "...", "cooldown": 4 }
  ],
  "tips": ["..."]
}
```

**Required fields:** `id`, `name`, `type`, `rarity`, `description`, `abilities[]`.
**Icon options** (in `app.js` → `Icons`): `flame`, `ice`, `lightning`, `light`, `dark`, `magma`, `smoke`, `earth`, `wind`, `water`, `beast`, `string`, `rubber`, `sand`, `sword`, `fist`, `haki`, `island`, `skull`, `human`, `fish`, `sky`, `cyborg`, `star`, `scroll`.
**Rarity options:** `Common`, `Uncommon`, `Rare`, `Legendary`, `Mythical`, `Event`.

`featured: true` surfaces the entry on the homepage.

### Adding a sword, style, race, island, boss

Same pattern — see existing entries in each `data/*.json` for the shape.

### Adding an update entry

Prepend (newest first) to `data/updates.json`:

```json
{
  "date": "2026-06-01",
  "title": "Update 4.8 — Title",
  "tag": "Major",
  "summary": "One-sentence summary.",
  "changes": ["Bullet 1", "Bullet 2"]
}
```

`tag` values: `Major`, `Content`, `Balance`, `QoL`, `Event`.

## Deploying

The repo includes a GitHub Actions workflow at `.github/workflows/pages.yml` that:

1. Validates every `data/*.json` parses.
2. Publishes the repo root to GitHub Pages on every push to `main`.

To enable: in your repo on GitHub, go to **Settings → Pages → Source** and select **GitHub Actions**.

Your wiki will be live at `https://<owner>.github.io/<repo>/` within a minute of pushing.

## Contributing

1. Fork the repo and create a branch.
2. Edit the relevant `data/*.json`.
3. Open a PR — the deploy workflow auto-validates JSON.

## License

Content under [CC-BY-SA-4.0](https://creativecommons.org/licenses/by-sa/4.0/). Code under MIT.
