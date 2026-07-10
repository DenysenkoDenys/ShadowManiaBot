import { useEffect, useState } from 'react';

const metrics = [
  { label: 'Reward ladder', value: '12 steps' },
  { label: 'Clan tiers', value: '3 reward bands' },
  { label: 'Pity thresholds', value: 'Epic + Legendary' },
  { label: 'Retention loops', value: 'Daily + weekly + monthly' }
];

const clanModules = [
  'Clan bosses',
  'Clan wars',
  'Clan quests',
  'Shared card inventory',
  'Weekly clan ranking',
  'Clan tournaments'
];

const retentionModules = [
  'Daily login streaks',
  'Weekly rewards',
  'Monthly reward track',
  'Pity timers',
  'Dust crafting',
  'Achievement rewards'
];

const seasonModules = [
  'Anime',
  'Memes',
  'Games',
  'Movies',
  'Season-exclusive cards',
  'Themed battle passes'
];

const roadmap = [
  {
    phase: 'Phase 1',
    title: 'Collection loop',
    items: ['Packs', 'Rarities', 'Evolutions', 'Dust', 'Guaranteed epics and legendaries']
  },
  {
    phase: 'Phase 2',
    title: 'Clan loop',
    items: ['Bosses', 'Wars', 'Quests', 'Weekly rank ladder', 'Clan rewards']
  },
  {
    phase: 'Phase 3',
    title: 'Live ops loop',
    items: ['Season rotation', 'Achievements', 'Marketplace', 'Moderation', 'Admin content tools']
  }
];

type DashboardSnapshot = {
  counts: {
    seasons: number;
    cards: number;
    clans: number;
    rewardSteps: number;
    pityRules: number;
  };
  highlights: {
    upcomingSeason: { name: string; theme: string; status: string } | null;
    strongestClan: { name: string; tag: string; focus: string } | null;
    latestCard: { name: string; rarity: string; season: string } | null;
  };
  seasons: Array<{ name: string; theme: string; status: string }>;
  cards: Array<{ name: string; rarity: string; season: string }>;
  clans: Array<{ name: string; tag: string; focus: string }>;
};

export default function App() {
  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [seasonName, setSeasonName] = useState('Season 3');
  const [seasonTheme, setSeasonTheme] = useState('Games');
  const [cardName, setCardName] = useState('Sora');
  const [cardRarity, setCardRarity] = useState('epic');
  const [cardSeason, setCardSeason] = useState('Season 1');
  const [clanName, setClanName] = useState('Night Circuit');
  const [clanTag, setClanTag] = useState('NCI');
  const [clanFocus, setClanFocus] = useState('Clan wars and trade');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) {
          throw new Error('Failed to load dashboard');
        }

        const data = (await response.json()) as DashboardSnapshot;
        setDashboard(data);
        setStatus('ready');
      } catch {
        setStatus('error');
      }
    };

    void loadDashboard();
  }, []);

  const refreshDashboard = async () => {
    const response = await fetch('/api/admin/dashboard');
    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as DashboardSnapshot;
    setDashboard(data);
    setStatus('ready');
  };

  const submitSeason = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetch('/api/admin/seasons', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: seasonName, theme: seasonTheme, status: 'planned' })
    });
    await refreshDashboard();
  };

  const submitCard = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetch('/api/admin/cards', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: cardName, rarity: cardRarity, season: cardSeason })
    });
    await refreshDashboard();
  };

  const submitClan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetch('/api/admin/clans', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: clanName, tag: clanTag, focus: clanFocus })
    });
    await refreshDashboard();
  };

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">ShadowMania admin</p>
          <h1>Build a Telegram card game that players actually come back to.</h1>
          <p className="lede">
            The product is centered on collection, clans, economy, and seasons so the game does not collapse into a one-time bot.
          </p>
          <div className="status-chip-row">
            <span className={`status-chip status-${status}`}>Admin API {status}</span>
            <span className="status-chip">Proxy /api → localhost:3001</span>
          </div>
        </div>

        <div className="hero-panel">
          <div className="panel-glow" />
          <div className="panel-card">
            <span className="panel-label">Live design focus</span>
            <strong>Retention over randomness</strong>
            <p>Use pity timers, streaks, dust, and clan progression to create meaningful long-term engagement.</p>
          </div>
        </div>
      </section>

      <section className="metrics">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="feature-card feature-card-large">
          <div className="section-head">
            <p className="section-kicker">Why the game works</p>
            <h2>Four systems that keep the economy alive</h2>
          </div>

          <div className="pill-grid">
            <div>
              <h3>Collection</h3>
              <p>Packs, evolutions, card ranks, set completion, and dust sinks.</p>
            </div>
            <div>
              <h3>Clans</h3>
              <p>Battles, bosses, quests, tournaments, and shared incentives.</p>
            </div>
            <div>
              <h3>Economy</h3>
              <p>Reward ladders, pity counters, crafting, and duplicate conversion.</p>
            </div>
            <div>
              <h3>Seasons</h3>
              <p>Rotating themes and events that refresh content every cycle.</p>
            </div>
          </div>
        </article>

        <article className="feature-card">
          <div className="section-head">
            <p className="section-kicker">Clans</p>
            <h2>Social loops that are worth logging in for</h2>
          </div>
          <ul className="bullet-list">
            {clanModules.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="feature-card">
          <div className="section-head">
            <p className="section-kicker">Retention</p>
            <h2>Login systems that create momentum</h2>
          </div>
          <ul className="bullet-list">
            {retentionModules.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="feature-card">
          <div className="section-head">
            <p className="section-kicker">Seasons</p>
            <h2>Content themes you can rotate every cycle</h2>
          </div>
          <div className="tag-row">
            {seasonModules.map((item) => (
              <span key={item} className="tag-pill">
                {item}
              </span>
            ))}
          </div>
        </article>

        <article className="feature-card">
          <div className="section-head">
            <p className="section-kicker">Live data</p>
            <h2>What the admin API knows right now</h2>
          </div>

          <div className="mini-stats">
            <div>
              <span>Seasons</span>
              <strong>{dashboard?.counts.seasons ?? '—'}</strong>
            </div>
            <div>
              <span>Cards</span>
              <strong>{dashboard?.counts.cards ?? '—'}</strong>
            </div>
            <div>
              <span>Clans</span>
              <strong>{dashboard?.counts.clans ?? '—'}</strong>
            </div>
            <div>
              <span>Pity rules</span>
              <strong>{dashboard?.counts.pityRules ?? '—'}</strong>
            </div>
          </div>
        </article>

        <article className="feature-card feature-card-wide">
          <div className="section-head">
            <p className="section-kicker">Roadmap</p>
            <h2>Build in phases instead of shipping a thin feature set</h2>
          </div>

          <div className="roadmap">
            {roadmap.map((step) => (
              <div key={step.phase} className="roadmap-card">
                <span>{step.phase}</span>
                <strong>{step.title}</strong>
                <ul>
                  {step.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>

        <article className="feature-card feature-card-wide">
          <div className="section-head">
            <p className="section-kicker">Current snapshot</p>
            <h2>Live admin state from the API</h2>
          </div>

          <div className="snapshot-grid">
            <div>
              <h3>Upcoming season</h3>
              <p>{dashboard?.highlights.upcomingSeason?.name ?? 'No planned season yet'}</p>
            </div>
            <div>
              <h3>Strongest clan</h3>
              <p>{dashboard?.highlights.strongestClan?.name ?? 'No clans yet'}</p>
            </div>
            <div>
              <h3>Latest card</h3>
              <p>{dashboard?.highlights.latestCard?.name ?? 'No cards yet'}</p>
            </div>
          </div>
        </article>

        <article className="feature-card feature-card-wide">
          <div className="section-head">
            <p className="section-kicker">Content tools</p>
            <h2>Create seasons, cards, and clans</h2>
          </div>

          <div className="form-grid">
            <form className="admin-form" onSubmit={submitSeason}>
              <h3>New season</h3>
              <label>
                Name
                <input value={seasonName} onChange={(event) => setSeasonName(event.target.value)} />
              </label>
              <label>
                Theme
                <input value={seasonTheme} onChange={(event) => setSeasonTheme(event.target.value)} />
              </label>
              <button type="submit">Create season</button>
            </form>

            <form className="admin-form" onSubmit={submitCard}>
              <h3>New card</h3>
              <label>
                Name
                <input value={cardName} onChange={(event) => setCardName(event.target.value)} />
              </label>
              <label>
                Rarity
                <select value={cardRarity} onChange={(event) => setCardRarity(event.target.value)}>
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                  <option value="mythic">Mythic</option>
                </select>
              </label>
              <label>
                Season
                <input value={cardSeason} onChange={(event) => setCardSeason(event.target.value)} />
              </label>
              <button type="submit">Create card</button>
            </form>

            <form className="admin-form" onSubmit={submitClan}>
              <h3>New clan</h3>
              <label>
                Name
                <input value={clanName} onChange={(event) => setClanName(event.target.value)} />
              </label>
              <label>
                Tag
                <input value={clanTag} onChange={(event) => setClanTag(event.target.value)} />
              </label>
              <label>
                Focus
                <input value={clanFocus} onChange={(event) => setClanFocus(event.target.value)} />
              </label>
              <button type="submit">Create clan</button>
            </form>
          </div>
        </article>
      </section>

      {status === 'error' ? <p className="error-line">Admin API is not reachable. Start the API on port 3001.</p> : null}
    </main>
  );
}
