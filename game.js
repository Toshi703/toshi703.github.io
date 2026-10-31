(() => {
  'use strict';
  const SAVE_KEY = 'neonMinerSaveV1';
  const SAVE_VERSION = 1;
  const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
  const PRESTIGE_REQUIREMENT = 1e6;
  const BOOST_DURATION = 30;
  const UPGRADES = [
    { id: 'bot', name: 'Bot de minage', desc: 'Un script silencieux qui travaille sans relâche.', icon: '⌘', baseCost: 15, growth: 1.16, baseRate: 0.2 },
    { id: 'rig', name: 'Rig quantique', desc: 'Accélère la production avec des cœurs parallèles.', icon: '⌬', baseCost: 100, growth: 1.17, baseRate: 1.5 },
    { id: 'node', name: 'Nœud fantôme', desc: 'Connecte ta ferme aux marchés décentralisés.', icon: '⟁', baseCost: 1100, growth: 1.18, baseRate: 12 },
    { id: 'cluster', name: 'Cluster neural', desc: 'Une intelligence qui optimise chaque cycle.', icon: '◈', baseCost: 12000, growth: 1.19, baseRate: 90 },
    { id: 'portal', name: 'Portail stellaire', desc: 'Exploite le flux de données interdimensionnel.', icon: '✳', baseCost: 160000, growth: 1.2, baseRate: 700 },
    { id: 'dyson', name: 'Sphère de Dyson', desc: 'Une étoile entière au service de ton réseau.', icon: '☼', baseCost: 3e6, growth: 1.21, baseRate: 6000 }
  ];
  const $ = id => document.getElementById(id);
  const freshState = () => ({ version: SAVE_VERSION, credits: 0, clicks: 0, owned: {}, prestige: 0, totalEarned: 0, lastSaved: Date.now(), boostUntil: 0 });
  let state = loadState();
  let toastTimer;
  let lastUiUpdate = 0;

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (!parsed || parsed.version !== SAVE_VERSION) return freshState();
      const clean = freshState();
      for (const key of ['credits', 'clicks', 'prestige', 'totalEarned', 'lastSaved', 'boostUntil']) {
        if (Number.isFinite(parsed[key]) && parsed[key] >= 0) clean[key] = parsed[key];
      }
      clean.owned = {};
      for (const item of UPGRADES) {
        const value = parsed.owned && parsed.owned[item.id];
        clean.owned[item.id] = Number.isSafeInteger(value) && value > 0 ? Math.min(value, 1e9) : 0;
      }
      const elapsed = Math.min(Math.max(0, (Date.now() - clean.lastSaved) / 1000), OFFLINE_CAP_SECONDS);
      const offline = ratePerSecond(clean) * elapsed;
      if (offline > 0) {
        clean.credits += offline;
        clean.totalEarned += offline;
        setTimeout(() => showToast(`Bienvenue — +${format(offline)} crédits générés hors ligne`), 300);
      }
      clean.lastSaved = Date.now();
      return clean;
    } catch (_) {
      return freshState();
    }
  }
  function multiplier(s = state) { return (1 + s.prestige * 0.1) * (Date.now() < s.boostUntil ? 2 : 1); }
  function ratePerSecond(s = state) { return UPGRADES.reduce((sum, u) => sum + (s.owned[u.id] || 0) * u.baseRate, 0) * (1 + s.prestige * 0.1); }
  function clickValue() { return multiplier() * (1 + Math.floor(state.prestige / 2)); }
  function cost(u) { return Math.ceil(u.baseCost * Math.pow(u.growth, state.owned[u.id] || 0)); }
  function format(n) {
    if (!Number.isFinite(n)) return '∞';
    if (n < 1000) return Math.floor(n).toLocaleString('fr-FR');
    const suffix = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    const tier = Math.floor(Math.log10(n) / 3);
    if (tier >= suffix.length) return n.toExponential(2).replace('.', ',');
    const scaled = n / Math.pow(1000, tier);
    const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
    return scaled.toFixed(decimals).replace('.', ',') + ' ' + suffix[tier];
  }
  function renderUpgrades() {
    $('upgradeList').innerHTML = UPGRADES.map(u => {
      const price = cost(u), owned = state.owned[u.id] || 0;
      return `<article class="upgrade-card"><span class="upgrade-icon" aria-hidden="true">${u.icon}</span><div class="upgrade-info"><strong>${u.name}</strong><p>${u.desc}</p><span class="upgrade-meta">+${format(u.baseRate * (1 + state.prestige * .1))} / sec <span class="upgrade-level">NIV. ${owned}</span></span></div><button class="buy-button" type="button" data-buy="${u.id}" ${state.credits < price ? 'disabled' : ''}>ACHETER<small>${format(price)} ◈</small></button></article>`;
    }).join('');
  }
  function prestigeGain() { return Math.max(0, Math.floor(Math.sqrt(state.totalEarned / PRESTIGE_REQUIREMENT))); }
  function rank() {
    const names = ['Opérateur', 'Codeur', 'Architecte', 'Netrunner', 'Magnat', 'Légende'];
    return names[Math.min(Math.floor(state.prestige / 2), names.length - 1)];
  }
  function updateUI() {
    $('credits').textContent = format(state.credits);
    $('perSecond').textContent = format(ratePerSecond());
    $('clickValue').textContent = '+' + format(clickValue());
    $('clicks').textContent = format(state.clicks);
    $('multiplier').textContent = '×' + multiplier().toFixed(1).replace(/\.0$/, '');
    $('prestigeLevel').textContent = `NIVEAU ${state.prestige}`;
    $('rankName').textContent = rank();
    const gain = prestigeGain();
    $('prestigeGain').textContent = format(gain);
    $('prestigeButton').disabled = state.totalEarned < PRESTIGE_REQUIREMENT || gain < 1;
    $('prestigeHint').textContent = gain > 0 ? `${gain} fragment${gain > 1 ? 's' : ''} prêt${gain > 1 ? 's' : ''} à collecter.` : `Disponible à partir de ${format(PRESTIGE_REQUIREMENT)} crédits gagnés au total.`;
    const progress = state.totalEarned % PRESTIGE_REQUIREMENT / PRESTIGE_REQUIREMENT;
    $('levelProgress').style.width = `${progress * 100}%`;
    $('progressPct').textContent = `${Math.floor(progress * 100)}%`;
    $('progressText').textContent = `${format(PRESTIGE_REQUIREMENT - (state.totalEarned % PRESTIGE_REQUIREMENT))} crédits avant le prochain palier`;
    renderUpgrades();
  }
  function save() {
    state.lastSaved = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      $('saveStatus').textContent = 'PROGRESSION SAUVEGARDÉE';
      setTimeout(() => { $('saveStatus').textContent = 'SAUVEGARDE AUTO'; }, 1400);
    } catch (_) { $('saveStatus').textContent = 'SAUVEGARDE INDISPONIBLE'; }
  }
  function addCredits(amount) { if (!Number.isFinite(amount) || amount <= 0) return; state.credits += amount; state.totalEarned += amount; }
  function showToast(message) {
    const el = $('toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }
  function floatAt(x, y, amount) {
    const el = document.createElement('span'); el.className = 'float-text'; el.textContent = '+' + format(amount);
    el.style.left = `${x}px`; el.style.top = `${y}px`; document.body.appendChild(el); setTimeout(() => el.remove(), 850);
  }
  $('mineButton').addEventListener('pointerdown', event => {
    const amount = clickValue(); addCredits(amount); state.clicks++;
    floatAt(event.clientX, event.clientY, amount); updateUI();
    if (navigator.vibrate) navigator.vibrate(12);
  });
  $('upgradeList').addEventListener('click', event => {
    const button = event.target.closest('[data-buy]'); if (!button) return;
    const u = UPGRADES.find(item => item.id === button.dataset.buy); if (!u) return;
    const price = cost(u); if (state.credits < price) return;
    state.credits -= price; state.owned[u.id] = (state.owned[u.id] || 0) + 1;
    updateUI(); save(); showToast(`${u.name} déployé`);
  });
  $('prestigeButton').addEventListener('click', () => {
    const gain = prestigeGain(); if (!gain || state.totalEarned < PRESTIGE_REQUIREMENT) return;
    state.prestige += gain; state.credits = 0; state.totalEarned = 0; state.owned = {};
    updateUI(); save(); showToast(`Reboot réussi — ${gain} fragment${gain > 1 ? 's' : ''} quantique${gain > 1 ? 's' : ''} obtenus`);
  });
  $('boostButton').addEventListener('click', () => { $('boostModal').hidden = false; $('closeModal').focus(); });
  $('closeModal').addEventListener('click', () => $('boostModal').hidden = true);
  $('boostModal').addEventListener('click', event => { if (event.target === $('boostModal')) $('boostModal').hidden = true; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') $('boostModal').hidden = true; });
  $('resetButton').addEventListener('click', () => {
    if (!window.confirm('Effacer toute la progression enregistrée sur cet appareil ?')) return;
    localStorage.removeItem(SAVE_KEY); state = freshState(); updateUI(); save(); showToast('Progression réinitialisée');
  });
  let lastTick = Date.now();
  setInterval(() => {
    const now = Date.now(), elapsed = Math.min((now - lastTick) / 1000, 10); lastTick = now;
    addCredits(ratePerSecond() * elapsed);
    if (now - lastUiUpdate > 250) { updateUI(); lastUiUpdate = now; }
  }, 100);
  setInterval(save, 5000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else lastTick = Date.now(); });
  window.addEventListener('beforeunload', save);
  updateUI();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('sw.js', document.baseURI))
        .then(() => console.info('Neon Miner service worker registered.'))
        .catch(error => console.warn('Neon Miner service worker registration failed:', error));
    }, { once: true });
  }
})();
