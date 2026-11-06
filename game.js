(() => {
  'use strict';

  const SAVE_KEY = 'neonMinerSaveV1';
  const SAVE_VERSION = 2;
  const OFFLINE_CAP_SECONDS = 12 * 60 * 60;
  const PRESTIGE_REQUIREMENT = 1e6;
  const MAX_OWNED = 1e9;
  const BUY_MODES = [1, 10, 100, 'max'];
  const TIER_MILESTONES = [25, 50, 100, 250];
  const UPGRADES = [
    { id: 'bot', name: 'Bot de minage', desc: 'Un script silencieux qui travaille sans relâche.', icon: '⌘', baseCost: 15, growth: 1.16, baseRate: 0.2 },
    { id: 'rig', name: 'Rig quantique', desc: 'Accélère la production avec des cœurs parallèles.', icon: '⌬', baseCost: 100, growth: 1.17, baseRate: 1.5 },
    { id: 'node', name: 'Nœud fantôme', desc: 'Connecte ta ferme aux marchés décentralisés.', icon: '⟁', baseCost: 1100, growth: 1.18, baseRate: 12 },
    { id: 'cluster', name: 'Cluster neural', desc: 'Une intelligence qui optimise chaque cycle.', icon: '◈', baseCost: 12000, growth: 1.19, baseRate: 90 },
    { id: 'portal', name: 'Portail stellaire', desc: 'Exploite le flux de données interdimensionnel.', icon: '✳', baseCost: 160000, growth: 1.2, baseRate: 700 },
    { id: 'dyson', name: 'Sphère de Dyson', desc: 'Une étoile entière au service de ton réseau.', icon: '☼', baseCost: 3e6, growth: 1.21, baseRate: 6000 }
  ];
  const $ = id => document.getElementById(id);
  const freshState = () => ({ version: SAVE_VERSION, credits: 0, clicks: 0, owned: {}, prestige: 0, totalEarned: 0, lastSaved: Date.now(), boostUntil: 0, buyMode: 1, soundEnabled: false });
  let offlineReport = null;
  let state = loadState();
  let toastTimer;
  let statusTimer;
  let lastUiUpdate = 0;
  let lastTick = Date.now();
  let audioContext = null;

  function normalizeSave(parsed) {
    if (!parsed || typeof parsed !== 'object' || ![1, SAVE_VERSION].includes(parsed.version)) return null;
    const clean = freshState();
    for (const key of ['credits', 'clicks', 'prestige', 'totalEarned', 'lastSaved', 'boostUntil']) {
      if (Number.isFinite(parsed[key]) && parsed[key] >= 0) clean[key] = parsed[key];
    }
    clean.prestige = Math.min(Math.floor(clean.prestige), MAX_OWNED);
    clean.clicks = Math.min(Math.floor(clean.clicks), Number.MAX_SAFE_INTEGER);
    clean.owned = {};
    for (const item of UPGRADES) {
      const value = parsed.owned && parsed.owned[item.id];
      clean.owned[item.id] = Number.isSafeInteger(value) && value > 0 ? Math.min(value, MAX_OWNED) : 0;
    }
    if (BUY_MODES.includes(parsed.buyMode)) clean.buyMode = parsed.buyMode;
    clean.soundEnabled = parsed.soundEnabled === true;
    return clean;
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      const clean = normalizeSave(parsed);
      if (!clean) return freshState();
      const now = Date.now();
      const elapsed = Math.min(Math.max(0, (now - clean.lastSaved) / 1000), OFFLINE_CAP_SECONDS);
      const earned = ratePerSecond(clean) * elapsed;
      if (Number.isFinite(earned) && earned > 0) {
        clean.credits += earned;
        clean.totalEarned += earned;
        offlineReport = { earned, elapsed, capped: (now - clean.lastSaved) / 1000 > OFFLINE_CAP_SECONDS };
      }
      clean.lastSaved = now;
      return clean;
    } catch (_) {
      return freshState();
    }
  }

  function tierMultiplier(owned) {
    return 2 ** TIER_MILESTONES.filter(threshold => owned >= threshold).length;
  }
  function prestigeMultiplier(s = state) { return 1 + s.prestige * 0.1; }
  function multiplier(s = state) { return prestigeMultiplier(s) * (Date.now() < s.boostUntil ? 2 : 1); }
  function ratePerSecond(s = state) {
    return UPGRADES.reduce((sum, u) => {
      const owned = s.owned[u.id] || 0;
      return sum + owned * u.baseRate * tierMultiplier(owned);
    }, 0) * prestigeMultiplier(s);
  }
  function clickValue() { return multiplier() * (1 + Math.floor(state.prestige / 2)); }
  function firstUnitCost(u, owned = state.owned[u.id] || 0) {
    const result = u.baseCost * Math.pow(u.growth, owned);
    return Number.isFinite(result) ? result : Infinity;
  }
  function bulkCost(u, count, owned = state.owned[u.id] || 0) {
    if (count <= 0) return 0;
    const first = firstUnitCost(u, owned);
    const exponent = count * Math.log(u.growth);
    if (!Number.isFinite(first) || exponent > 700) return Infinity;
    return first * Math.expm1(exponent) / (u.growth - 1);
  }
  function canAfford(cost, budget) {
    if (cost <= budget) return true;
    if (!Number.isFinite(cost) || !Number.isFinite(budget)) return false;
    return cost - budget <= Math.max(1e-9, Math.abs(budget) * 1e-12);
  }
  function affordableCount(u) {
    const owned = state.owned[u.id] || 0;
    const room = Math.max(0, MAX_OWNED - owned);
    if (!room || state.credits < firstUnitCost(u, owned)) return 0;
    const first = firstUnitCost(u, owned);
    const logGrowth = Math.log(u.growth);
    const logRatio = Math.log(state.credits) + Math.log(u.growth - 1) - Math.log(first);
    const logOnePlusRatio = logRatio > 40
      ? logRatio + Math.log1p(Math.exp(-logRatio))
      : Math.log1p(Math.exp(logRatio));
    let count = Math.floor(logOnePlusRatio / logGrowth);
    if (!Number.isFinite(count)) count = room;
    count = Math.max(0, Math.min(room, count));
    while (count > 0 && !canAfford(bulkCost(u, count, owned), state.credits)) count--;
    while (count < room && canAfford(bulkCost(u, count + 1, owned), state.credits)) count++;
    return count;
  }
  function selectedBuyCount(u) {
    const room = MAX_OWNED - (state.owned[u.id] || 0);
    if (state.buyMode === 'max') return affordableCount(u);
    const count = Math.min(state.buyMode, room);
    return canAfford(bulkCost(u, count), state.credits) ? count : 0;
  }
  function format(n) {
    if (!Number.isFinite(n)) return '∞';
    if (n < 1000) return Math.floor(Math.max(0, n)).toLocaleString('fr-FR');
    const suffix = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    const tier = Math.floor(Math.log10(n) / 3);
    if (tier >= suffix.length) return n.toExponential(2).replace('.', ',');
    const scaled = n / Math.pow(1000, tier);
    const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
    return scaled.toFixed(decimals).replace('.', ',') + ' ' + suffix[tier];
  }
  function prestigeGain() { return Math.max(0, Math.floor(Math.sqrt(state.totalEarned / PRESTIGE_REQUIREMENT))); }
  function nextPrestigeThreshold() { return Math.pow(prestigeGain() + 1, 2) * PRESTIGE_REQUIREMENT; }
  function rank() {
    const names = ['Opérateur', 'Codeur', 'Architecte', 'Netrunner', 'Magnat', 'Légende'];
    return names[Math.min(Math.floor(state.prestige / 2), names.length - 1)];
  }
  function renderPurchaseModes() {
    document.querySelectorAll('[data-buy-mode]').forEach(button => {
      const active = String(state.buyMode) === button.dataset.buyMode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $('buyModeLabel').textContent = state.buyMode === 'max' ? 'Tout ce qui est disponible' : `Acheter par lots de ${state.buyMode}`;
  }
  function renderUpgrades() {
    $('upgradeList').innerHTML = UPGRADES.map(u => {
      const owned = state.owned[u.id] || 0;
      const count = selectedBuyCount(u);
      const price = count ? bulkCost(u, count) : firstUnitCost(u, owned);
      const tiers = tierMultiplier(owned);
      const rate = u.baseRate * tiers * prestigeMultiplier();
      const disabled = count === 0;
      const buyLabel = state.buyMode === 'max' ? `ACHETER ×${count}` : `ACHETER ×${state.buyMode}`;
      return `<article class="upgrade-card"><span class="upgrade-icon" aria-hidden="true">${u.icon}</span><div class="upgrade-info"><strong>${u.name}</strong><p>${u.desc}</p><span class="upgrade-meta">+${format(rate)} / sec / unité <span class="upgrade-level">NIV. ${format(owned)} · PALIER ×${tiers}</span></span></div><button class="buy-button" type="button" data-buy="${u.id}" ${disabled ? 'disabled' : ''} aria-label="${buyLabel} ${u.name} pour ${format(price)} crédits">${buyLabel}<small>${format(price)} ◈</small></button></article>`;
    }).join('');
  }
  function updateUI() {
    $('credits').textContent = format(state.credits);
    $('perSecond').textContent = format(ratePerSecond());
    $('clickValue').textContent = '+' + format(clickValue());
    $('clicks').textContent = format(state.clicks);
    $('multiplier').textContent = '×' + multiplier().toFixed(1).replace(/\.0$/, '');
    $('prestigeLevel').textContent = `NIVEAU ${state.prestige}`;
    $('rankName').textContent = rank();
    $('prestigeGain').textContent = format(prestigeGain());
    $('prestigeButton').disabled = prestigeGain() < 1;
    $('prestigeHint').textContent = prestigeGain() > 0
      ? `${format(prestigeGain())} fragment${prestigeGain() > 1 ? 's' : ''} prêt${prestigeGain() > 1 ? 's' : ''} à collecter.`
      : `Disponible à partir de ${format(PRESTIGE_REQUIREMENT)} crédits gagnés ce cycle.`;
    const threshold = nextPrestigeThreshold();
    const progress = Math.min(1, state.totalEarned / threshold);
    $('levelProgress').style.width = `${progress * 100}%`;
    $('progressPct').textContent = `${Math.floor(progress * 100)}%`;
    $('progressText').textContent = `${format(Math.max(0, threshold - state.totalEarned))} crédits avant le prochain fragment`;
    $('soundToggle').classList.toggle('is-on', state.soundEnabled);
    $('soundToggle').setAttribute('aria-pressed', String(state.soundEnabled));
    renderPurchaseModes();
    renderUpgrades();
  }
  function save() {
    state.lastSaved = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      $('saveStatus').textContent = 'PROGRESSION SAUVEGARDÉE';
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => { $('saveStatus').textContent = 'SAUVEGARDE AUTO'; }, 1400);
    } catch (_) { $('saveStatus').textContent = 'SAUVEGARDE INDISPONIBLE'; }
  }
  function addCredits(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    state.credits += amount;
    state.totalEarned += amount;
  }
  function showToast(message) {
    const el = $('toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }
  function floatAt(x, y, amount) {
    const el = document.createElement('span'); el.className = 'float-text'; el.textContent = '+' + format(amount);
    el.style.left = `${x}px`; el.style.top = `${y}px`; document.body.appendChild(el); setTimeout(() => el.remove(), 850);
  }
  function playSound(kind) {
    if (!state.soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext ||= new AudioContextClass();
      if (audioContext.state === 'suspended') audioContext.resume();
      const sequences = { click: [620], buy: [520, 780], prestige: [440, 660, 880], toggle: [660] };
      const notes = sequences[kind] || sequences.click;
      notes.forEach((frequency, index) => {
        const start = audioContext.currentTime + index * 0.075;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = kind === 'click' ? 'sine' : 'triangle';
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.045, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
        oscillator.connect(gain); gain.connect(audioContext.destination);
        oscillator.start(start); oscillator.stop(start + 0.15);
      });
    } catch (_) { /* L'audio est facultatif; ne jamais interrompre la partie. */ }
  }

  $('mineButton').addEventListener('click', event => {
    const amount = clickValue(); addCredits(amount); state.clicks++;
    floatAt(event.clientX, event.clientY, amount); updateUI(); playSound('click');
    if (navigator.vibrate) navigator.vibrate(12);
  });
  $('upgradeList').addEventListener('click', event => {
    const button = event.target.closest('[data-buy]'); if (!button) return;
    const u = UPGRADES.find(item => item.id === button.dataset.buy); if (!u) return;
    const count = selectedBuyCount(u); if (!count) return;
    const price = bulkCost(u, count);
    if (!Number.isFinite(price) || !canAfford(price, state.credits)) return;
    state.credits = Math.max(0, state.credits - price);
    state.owned[u.id] = Math.min(MAX_OWNED, (state.owned[u.id] || 0) + count);
    updateUI(); save(); playSound('buy');
    showToast(`${count} × ${u.name} déployé${count > 1 ? 's' : ''}`);
  });
  document.querySelectorAll('[data-buy-mode]').forEach(button => button.addEventListener('click', () => {
    const mode = button.dataset.buyMode;
    state.buyMode = mode === 'max' ? 'max' : Number(mode);
    updateUI(); save();
  }));
  $('prestigeButton').addEventListener('click', () => {
    const gain = prestigeGain(); if (!gain) return;
    state.prestige = Math.min(MAX_OWNED, state.prestige + gain);
    state.credits = 0; state.totalEarned = 0; state.owned = Object.fromEntries(UPGRADES.map(item => [item.id, 0]));
    updateUI(); save(); playSound('prestige');
    showToast(`Reboot réussi — ${format(gain)} fragment${gain > 1 ? 's' : ''} quantique${gain > 1 ? 's' : ''} obtenus`);
  });
  $('boostButton').addEventListener('click', () => { $('boostModal').hidden = false; $('closeModal').focus(); });
  $('closeModal').addEventListener('click', () => $('boostModal').hidden = true);
  $('boostModal').addEventListener('click', event => { if (event.target === $('boostModal')) $('boostModal').hidden = true; });
  $('closeOfflineModal').addEventListener('click', () => $('offlineModal').hidden = true);
  $('offlineModal').addEventListener('click', event => { if (event.target === $('offlineModal')) $('offlineModal').hidden = true; });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { $('boostModal').hidden = true; $('offlineModal').hidden = true; }
  });
  $('soundToggle').addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    updateUI(); save();
    if (state.soundEnabled) playSound('toggle');
    showToast(state.soundEnabled ? 'Sons activés' : 'Sons désactivés');
  });
  $('exportButton').addEventListener('click', () => {
    save();
    const data = JSON.stringify(state, null, 2);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    link.download = `neon-miner-save-${new Date().toISOString().slice(0, 10)}.json`;
    link.click(); URL.revokeObjectURL(link.href);
    showToast('Sauvegarde exportée en JSON');
  });
  $('importButton').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', async event => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 256 * 1024) { showToast('Fichier trop volumineux'); return; }
    try {
      const parsed = JSON.parse(await file.text());
      const imported = normalizeSave(parsed);
      if (!imported) throw new Error('format invalide');
      if (!window.confirm('Importer cette sauvegarde et remplacer la progression de cet appareil ?')) return;
      const now = Date.now();
      const elapsed = Math.min(Math.max(0, (now - imported.lastSaved) / 1000), OFFLINE_CAP_SECONDS);
      const earned = ratePerSecond(imported) * elapsed;
      if (Number.isFinite(earned) && earned > 0) {
        imported.credits += earned;
        imported.totalEarned += earned;
        offlineReport = { earned, elapsed, capped: (now - imported.lastSaved) / 1000 > OFFLINE_CAP_SECONDS };
      } else offlineReport = null;
      imported.lastSaved = now;
      state = imported;
      lastTick = now;
      updateUI(); save();
      if (offlineReport) showOfflineReport(offlineReport);
      showToast('Sauvegarde importée');
    } catch (_) { showToast('Sauvegarde invalide ou illisible'); }
  });
  $('resetButton').addEventListener('click', () => {
    if (!window.confirm('Effacer toute la progression enregistrée sur cet appareil ?')) return;
    localStorage.removeItem(SAVE_KEY); state = freshState(); lastTick = Date.now();
    updateUI(); save(); showToast('Progression réinitialisée');
  });

  function tick(now = Date.now()) {
    const elapsed = Math.min(Math.max(0, (now - lastTick) / 1000), OFFLINE_CAP_SECONDS);
    lastTick = now;
    addCredits(ratePerSecond() * elapsed);
  }
  setInterval(() => {
    const now = Date.now(); tick(now);
    if (now - lastUiUpdate > 250) { updateUI(); lastUiUpdate = now; }
  }, 100);
  setInterval(save, 5000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) save();
    else { tick(); updateUI(); save(); }
  });
  window.addEventListener('beforeunload', save);
  updateUI();
  if (offlineReport && offlineReport.earned > 0) {
    showOfflineReport(offlineReport);
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('sw.js', document.baseURI))
        .then(() => console.info('Neon Miner service worker registered.'))
        .catch(error => console.warn('Neon Miner service worker registration failed:', error));
    }, { once: true });
  }

  function formatDuration(seconds) {
    const whole = Math.floor(Math.max(0, seconds));
    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    if (hours) return `${hours} h ${minutes} min`;
    if (minutes) return `${minutes} min`;
    return `${whole} s`;
  }
  function showOfflineReport(report) {
    $('offlineSummary').textContent = `Pendant ${formatDuration(report.elapsed)}, ta ferme a généré ${format(report.earned)} crédits.${report.capped ? ' Le calcul hors ligne est plafonné à 12 heures.' : ''}`;
    $('offlineModal').hidden = false;
    $('closeOfflineModal').focus();
  }
})();
