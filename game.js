(() => {
  'use strict';

  const SAVE_KEY = 'neonMinerSaveV1';
  const SAVE_VERSION = 3;
  const OFFLINE_CAP_SECONDS = 12 * 60 * 60;
  const PRESTIGE_REQUIREMENT = 1e6;
  const MAX_OWNED = 1e9;
  const BUY_MODES = [1, 10, 100, 'max'];
  const TIER_MILESTONES = [25, 50, 100, 250];
  const SURGE_DURATION_MS = 12_000;
  const HEAT_CAP = 100;
  const HEAT_LOCK_CLEAR = 40;
  const GENERATORS = [
    { id: 'bot', name: 'Bot de minage', desc: 'Un script silencieux qui travaille sans relâche.', icon: '⌘', baseCost: 15, growth: 1.16, baseRate: 0.2 },
    { id: 'rig', name: 'Rig quantique', desc: 'Accélère la production avec des cœurs parallèles.', icon: '⌬', baseCost: 100, growth: 1.17, baseRate: 1.5 },
    { id: 'node', name: 'Nœud fantôme', desc: 'Connecte ta ferme aux marchés décentralisés.', icon: '⟁', baseCost: 1100, growth: 1.18, baseRate: 12 },
    { id: 'cluster', name: 'Cluster neural', desc: 'Une intelligence qui optimise chaque cycle.', icon: '◈', baseCost: 12000, growth: 1.19, baseRate: 90 },
    { id: 'portal', name: 'Portail stellaire', desc: 'Exploite le flux de données interdimensionnel.', icon: '✳', baseCost: 160000, growth: 1.2, baseRate: 700 },
    { id: 'dyson', name: 'Sphère de Dyson', desc: 'Une étoile entière au service de ton réseau.', icon: '☼', baseCost: 3e6, growth: 1.21, baseRate: 6000 }
  ];
  const CIRCUITS = [
    { id: 'drill', name: 'Forage profond', icon: '⌖', generators: ['bot', 'rig'], multiplier: 2.8, heatPerSecond: 7, desc: 'Bots + rigs · burst puissant, chauffe vite.' },
    { id: 'relay', name: 'Relais fantôme', icon: '⌘', generators: ['node', 'cluster'], multiplier: 2.15, heatPerSecond: 5, desc: 'Nœuds + clusters · rendement régulier.' },
    { id: 'quantum', name: 'Noyau quantique', icon: '✧', generators: ['portal', 'dyson'], multiplier: 3.3, heatPerSecond: 10, desc: 'Portails + Dyson · gros gain, grosse chaleur.' }
  ];
  const CONTRACT_TYPES = [
    { id: 'earn', title: 'Flux de crédits', description: 'Génère le quota de crédits.' },
    { id: 'buy', title: 'Expansion du réseau', description: 'Déploie de nouveaux générateurs.' },
    { id: 'surge', title: 'Test de surcharge', description: 'Active des circuits de puissance.' }
  ];
  const RESEARCH = [
    { id: 'drive', name: 'Moteur fractal', icon: '◈', description: '+10 % de production permanente par niveau.', costs: [1, 2, 4, 7, 11] },
    { id: 'cooling', name: 'Cryo-circuit', icon: '❄', description: '+18 % de refroidissement par niveau.', costs: [1, 2, 4, 7, 11] },
    { id: 'amplifier', name: 'Amplificateur', icon: 'ϟ', description: '+0,20× aux bursts; +0,65 chaleur/s.', costs: [1, 2, 4, 7, 11] }
  ];
  const $ = id => document.getElementById(id);
  const freshState = () => ({
    version: SAVE_VERSION, credits: 0, clicks: 0, owned: {}, prestige: 0,
    totalEarned: 0, lifetimeEarned: 0, totalPurchases: 0, totalOverclocks: 0,
    contractsCompleted: 0, contractSerial: 0, contractSteps: { earn: 0, buy: 0, surge: 0 }, contracts: [], signalData: 0,
    research: { drive: 0, cooling: 0, amplifier: 0 },
    surcharge: { heat: 0, activeId: null, activeStartedAt: 0, activeUntil: 0, overheated: false },
    lastSaved: Date.now(), boostUntil: 0, buyMode: 1, soundEnabled: false
  });
  let offlineReport = null;
  let state = loadState();
  let toastTimer;
  let statusTimer;
  let lastUiUpdate = 0;
  let lastTick = Date.now();
  let audioContext = null;

  function normalizeSave(parsed) {
    if (!parsed || typeof parsed !== 'object' || ![1, 2, SAVE_VERSION].includes(parsed.version)) return null;
    const clean = freshState();
    for (const key of ['credits', 'clicks', 'prestige', 'totalEarned', 'lastSaved', 'boostUntil', 'signalData', 'totalPurchases', 'totalOverclocks', 'contractsCompleted', 'contractSerial']) {
      if (Number.isFinite(parsed[key]) && parsed[key] >= 0) clean[key] = parsed[key];
    }
    clean.prestige = Math.min(Math.floor(clean.prestige), MAX_OWNED);
    clean.clicks = Math.min(Math.floor(clean.clicks), Number.MAX_SAFE_INTEGER);
    clean.totalPurchases = Math.floor(clean.totalPurchases);
    clean.totalOverclocks = Math.floor(clean.totalOverclocks);
    clean.contractsCompleted = Math.floor(clean.contractsCompleted);
    clean.contractSerial = Math.floor(clean.contractSerial);
    clean.lifetimeEarned = Number.isFinite(parsed.lifetimeEarned) && parsed.lifetimeEarned >= 0 ? parsed.lifetimeEarned : clean.totalEarned;
    for (const type of CONTRACT_TYPES) {
      const step = parsed.contractSteps && parsed.contractSteps[type.id];
      clean.contractSteps[type.id] = Number.isFinite(step) && step >= 0 ? Math.floor(step) : 0;
    }
    clean.owned = {};
    for (const item of GENERATORS) {
      const value = parsed.owned && parsed.owned[item.id];
      clean.owned[item.id] = Number.isSafeInteger(value) && value > 0 ? Math.min(value, MAX_OWNED) : 0;
    }
    if (BUY_MODES.includes(parsed.buyMode)) clean.buyMode = parsed.buyMode;
    clean.soundEnabled = parsed.soundEnabled === true;
    clean.research = {};
    for (const branch of RESEARCH) {
      const level = parsed.research && parsed.research[branch.id];
      clean.research[branch.id] = Number.isFinite(level) && level >= 0 ? Math.min(Math.floor(level), branch.costs.length) : 0;
    }
    const oldSurcharge = parsed.surcharge && typeof parsed.surcharge === 'object' ? parsed.surcharge : {};
    const validCircuit = CIRCUITS.some(item => item.id === oldSurcharge.activeId);
    clean.surcharge = {
      heat: Number.isFinite(oldSurcharge.heat) ? Math.max(0, Math.min(HEAT_CAP, oldSurcharge.heat)) : 0,
      activeId: validCircuit ? oldSurcharge.activeId : null,
      activeStartedAt: Number.isFinite(oldSurcharge.activeStartedAt) && oldSurcharge.activeStartedAt >= 0 ? oldSurcharge.activeStartedAt : clean.lastSaved,
      activeUntil: Number.isFinite(oldSurcharge.activeUntil) && oldSurcharge.activeUntil >= 0 ? oldSurcharge.activeUntil : 0,
      overheated: oldSurcharge.overheated === true
    };
    if (Array.isArray(parsed.contracts)) {
      clean.contracts = parsed.contracts.flatMap(contract => {
        if (!contract || !CONTRACT_TYPES.some(type => type.id === contract.type)) return [];
        if (!Number.isFinite(contract.target) || contract.target <= 0 || !Number.isFinite(contract.reward) || contract.reward < 1) return [];
        return [{
          type: contract.type,
          target: contract.target,
          reward: Math.floor(contract.reward),
          baseline: Number.isFinite(contract.baseline) && contract.baseline >= 0 ? contract.baseline : 0,
          title: CONTRACT_TYPES.find(type => type.id === contract.type).title
        }];
      });
    }
    const uniqueContracts = [];
    for (const contract of clean.contracts) {
      if (!uniqueContracts.some(item => item.type === contract.type)) uniqueContracts.push(contract);
    }
    clean.contracts = uniqueContracts.slice(0, 3);
    for (const type of CONTRACT_TYPES) {
      if (clean.contracts.length >= 3) break;
      if (!clean.contracts.some(contract => contract.type === type.id)) clean.contracts.push(createContract(clean, type.id));
    }
    return clean;
  }

  function createFreshState() {
    const fresh = freshState();
    for (const type of CONTRACT_TYPES) fresh.contracts.push(createContract(fresh, type.id));
    return fresh;
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      const clean = normalizeSave(parsed);
      if (!clean) return createFreshState();
      offlineReport = settleOffline(clean, Date.now());
      return clean;
    } catch (_) {
      return createFreshState();
    }
  }

  function tierMultiplier(owned) {
    return 2 ** TIER_MILESTONES.filter(threshold => owned >= threshold).length;
  }
  function prestigeMultiplier(s = state) { return 1 + s.prestige * 0.1; }
  function coolingRate(s = state) { return 5 * (1 + (s.research.cooling || 0) * 0.18); }
  function researchProductionMultiplier(s = state) { return 1 + (s.research.drive || 0) * 0.1; }
  function surchargeMultiplier(circuit, s = state) { return circuit.multiplier + (s.research.amplifier || 0) * 0.2; }
  function surchargeHeatRate(circuit, s = state) { return circuit.heatPerSecond + (s.research.amplifier || 0) * 0.65; }
  function baseProductionRate(s = state) {
    return GENERATORS.reduce((sum, u) => {
      const owned = s.owned[u.id] || 0;
      return sum + owned * u.baseRate * tierMultiplier(owned);
    }, 0) * prestigeMultiplier(s) * researchProductionMultiplier(s);
  }
  function circuitProduction(circuit, s = state) {
    return circuit.generators.reduce((sum, id) => {
      const u = GENERATORS.find(item => item.id === id);
      const owned = s.owned[id] || 0;
      return sum + (u ? owned * u.baseRate * tierMultiplier(owned) : 0);
    }, 0) * prestigeMultiplier(s) * researchProductionMultiplier(s);
  }
  function ratePerSecond(s = state, now = Date.now()) {
    let rate = baseProductionRate(s);
    const surcharge = s.surcharge;
    if (surcharge && surcharge.activeId && surcharge.activeUntil > now) {
      const circuit = CIRCUITS.find(item => item.id === surcharge.activeId);
      if (circuit) rate += circuitProduction(circuit, s) * (surchargeMultiplier(circuit, s) - 1);
    }
    return rate;
  }
  function multiplier(s = state) { return (1 + s.prestige * 0.1) * (Date.now() < s.boostUntil ? 2 : 1); }
  function clickValue() { return multiplier() * (1 + Math.floor(state.prestige / 2)) * researchProductionMultiplier(); }
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
    const logOnePlusRatio = logRatio > 40 ? logRatio + Math.log1p(Math.exp(-logRatio)) : Math.log1p(Math.exp(logRatio));
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
  function createContract(s, typeId) {
    const serial = s.contractSerial || 0;
    const type = CONTRACT_TYPES.find(item => item.id === typeId) || CONTRACT_TYPES[serial % CONTRACT_TYPES.length];
    const tier = s.contractSteps[type.id] || 0;
    const scale = Math.pow(1.3, Math.min(tier, 16));
    let target, baseline;
    if (type.id === 'earn') {
      target = Math.ceil(Math.max(100, baseProductionRate(s) * 30) * scale);
      baseline = s.lifetimeEarned || 0;
    } else if (type.id === 'buy') {
      target = 1 + Math.floor(tier / 2);
      baseline = s.totalPurchases || 0;
    } else {
      target = 2 + Math.floor(tier / 2);
      baseline = s.totalOverclocks || 0;
    }
    s.contractSerial = serial + 1;
    s.contractSteps[type.id] = tier + 1;
    return { type: type.id, title: type.title, target, baseline, reward: 1 + Math.floor(tier / 4) };
  }
  function contractProgress(contract) {
    let current = 0;
    if (contract.type === 'earn') current = state.lifetimeEarned;
    else if (contract.type === 'buy') current = state.totalPurchases;
    else current = state.totalOverclocks;
    return Math.max(0, Math.min(contract.target, current - contract.baseline));
  }
  function contractProgressText(contract) {
    const progress = contractProgress(contract);
    const unit = contract.type === 'earn' ? 'crédits' : contract.type === 'buy' ? 'générateurs' : 'surcharges';
    return `${format(progress)} / ${format(contract.target)} ${unit}`;
  }
  function overclockActiveSeconds(s, from, to) {
    const surge = s.surcharge;
    if (!surge || !surge.activeId) return 0;
    const begin = Math.max(from, surge.activeStartedAt || from);
    const finish = Math.min(to, surge.activeUntil);
    return Math.max(0, (finish - begin) / 1000);
  }
  function advanceSurcharge(s, from, to) {
    const elapsed = Math.max(0, (to - from) / 1000);
    const surge = s.surcharge;
    if (!surge) return;
    const activeSeconds = Math.min(elapsed, overclockActiveSeconds(s, from, to));
    const circuit = surge.activeId ? CIRCUITS.find(item => item.id === surge.activeId) : null;
    if (circuit && activeSeconds > 0) surge.heat += surchargeHeatRate(circuit, s) * activeSeconds;
    if (surge.heat >= HEAT_CAP) { surge.heat = HEAT_CAP; surge.overheated = true; }
    const coolingSeconds = Math.max(0, elapsed - activeSeconds);
    surge.heat = Math.max(0, surge.heat - coolingRate(s) * coolingSeconds);
    if (surge.overheated && surge.heat <= HEAT_LOCK_CLEAR) surge.overheated = false;
    if (surge.activeId && surge.activeUntil <= to) {
      surge.activeId = null; surge.activeStartedAt = 0; surge.activeUntil = 0;
    }
  }
  function settleOffline(s, now) {
    const elapsedRaw = Math.max(0, (now - s.lastSaved) / 1000);
    const elapsed = Math.min(elapsedRaw, OFFLINE_CAP_SECONDS);
    const from = now - elapsed * 1000;
    advanceSurcharge(s, from, now);
    const earned = baseProductionRate(s) * elapsed;
    if (Number.isFinite(earned) && earned > 0) {
      s.credits += earned;
      s.totalEarned += earned;
      s.lifetimeEarned += earned;
    }
    s.lastSaved = now;
    return earned > 0 ? { earned, elapsed, capped: elapsedRaw > OFFLINE_CAP_SECONDS } : null;
  }
  function researchCost(branch) {
    const level = state.research[branch.id] || 0;
    return level < branch.costs.length ? branch.costs[level] : Infinity;
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
    $('upgradeList').innerHTML = GENERATORS.map(u => {
      const owned = state.owned[u.id] || 0;
      const count = selectedBuyCount(u);
      const price = count ? bulkCost(u, count) : firstUnitCost(u, owned);
      const tiers = tierMultiplier(owned);
      const rate = u.baseRate * tiers * prestigeMultiplier() * researchProductionMultiplier();
      const disabled = count === 0;
      const buyLabel = state.buyMode === 'max' ? `ACHETER ×${count}` : `ACHETER ×${state.buyMode}`;
      return `<article class="upgrade-card"><span class="upgrade-icon" aria-hidden="true">${u.icon}</span><div class="upgrade-info"><strong>${u.name}</strong><p>${u.desc}</p><span class="upgrade-meta">+${format(rate)} / sec / unité <span class="upgrade-level">NIV. ${format(owned)} · PALIER ×${tiers}</span></span></div><button class="buy-button" type="button" data-buy="${u.id}" ${disabled ? 'disabled' : ''} aria-label="${buyLabel} ${u.name} pour ${format(price)} crédits">${buyLabel}<small>${format(price)} ◈</small></button></article>`;
    }).join('');
  }
  function renderCircuits(now) {
    const surge = state.surcharge;
    $('coreHeat').textContent = `${Math.floor(surge.heat)}%`;
    $('coreHeatFill').style.width = `${Math.min(100, surge.heat)}%`;
    $('coreHeatFill').classList.toggle('hot', surge.heat >= 70);
    $('heatStatus').textContent = surge.overheated ? 'SURCHAUFFE · REFROIDIS SOUS 40%' : surge.activeId ? 'SURCHARGE EN COURS' : surge.heat >= 70 ? 'CŒUR CHAUD · REFROIDISSEMENT' : surge.heat >= 40 ? 'REFROIDISSEMENT EN COURS' : 'CŒUR THERMIQUE STABLE';
    $('circuitList').innerHTML = CIRCUITS.map(circuit => {
      const output = circuitProduction(circuit);
      const ownedNames = circuit.generators.filter(id => state.owned[id] > 0).map(id => GENERATORS.find(u => u.id === id).name);
      const active = surge.activeId === circuit.id && surge.activeUntil > now;
      const remaining = active ? Math.ceil((surge.activeUntil - now) / 1000) : 0;
      const multiplierValue = surchargeMultiplier(circuit);
      const extra = output * (multiplierValue - 1) * (SURGE_DURATION_MS / 1000);
      const heatAdded = surchargeHeatRate(circuit) * (SURGE_DURATION_MS / 1000);
      const heatForecast = Math.min(HEAT_CAP, surge.heat + heatAdded);
      let disabled = false, buttonText = `SURCHARGER ×${multiplierValue.toFixed(1).replace('.', ',')}`;
      if (!ownedNames.length) { disabled = true; buttonText = `DÉPLOIE ${circuit.generators.map(id => GENERATORS.find(u => u.id === id).name).join(' OU ')}`; }
      else if (active) { disabled = true; buttonText = `EN SURCHARGE · ${remaining} S`; }
      else if (surge.activeId) { disabled = true; buttonText = 'UN CIRCUIT À LA FOIS'; }
      else if (surge.overheated) { disabled = true; buttonText = 'REFROIDIS SOUS 40%'; }
      return `<article class="circuit-card ${active ? 'is-active' : ''}"><div class="circuit-top"><span class="circuit-icon">${circuit.icon}</span><div><strong>${circuit.name}</strong><small>${ownedNames.length ? ownedNames.join(' + ') : 'Circuit non déployé'}</small></div><span class="circuit-multiplier">×${multiplierValue.toFixed(1).replace('.', ',')}</span></div><p class="circuit-desc">${circuit.desc}</p><div class="circuit-preview"><span>GAIN ESTIMÉ</span><b>+${format(extra)} crédits</b></div><div class="circuit-preview circuit-cost"><span>CHALEUR SUR 12 S</span><b>+${Math.ceil(heatAdded)} · après : ${Math.floor(heatForecast)}%</b></div>${heatForecast >= HEAT_CAP ? '<p class="circuit-warning">Le cœur se verrouillera jusqu’au refroidissement.</p>' : ''}<button class="secondary-button surge-button" type="button" data-surge="${circuit.id}" ${disabled ? 'disabled' : ''}>ϟ <span>${buttonText}</span></button></article>`;
    }).join('');
  }
  function renderContracts() {
    $('contractList').innerHTML = state.contracts.map((contract, index) => {
      const type = CONTRACT_TYPES.find(item => item.id === contract.type);
      const progress = contractProgress(contract);
      const ratio = Math.min(100, progress / contract.target * 100);
      const complete = progress >= contract.target;
      return `<article class="contract-card ${complete ? 'is-complete' : ''}"><div class="contract-title"><span class="contract-icon">${contract.type === 'earn' ? '◈' : contract.type === 'buy' ? '⌘' : 'ϟ'}</span><div><strong>${contract.title}</strong><small>${type.description}</small></div></div><div class="contract-progress"><div class="contract-progress-fill" style="width:${ratio}%"></div></div><div class="contract-meta"><span>${contractProgressText(contract)}</span><span>+${contract.reward} DATA</span></div><button class="secondary-button contract-claim" type="button" data-claim="${index}" ${complete ? '' : 'disabled'}>${complete ? `RÉCLAMER +${contract.reward} DATA` : 'CONTRAT EN COURS'}</button></article>`;
    }).join('');
  }
  function renderResearch() {
    $('researchList').innerHTML = RESEARCH.map(branch => {
      const level = state.research[branch.id] || 0;
      const cost = researchCost(branch);
      const maxed = level >= branch.costs.length;
      const canBuy = !maxed && state.signalData >= cost;
      return `<article class="research-card"><div class="research-title"><span>${branch.icon}</span><div><strong>${branch.name}</strong><small>NIVEAU ${level}/${branch.costs.length}</small></div></div><p>${branch.description}</p><button class="secondary-button research-buy" type="button" data-research="${branch.id}" ${canBuy ? '' : 'disabled'}>${maxed ? 'MAXIMUM ATTEINT' : `RECHERCHER · ${cost} DATA`}</button></article>`;
    }).join('');
  }
  function updateUI() {
    const now = Date.now();
    $('credits').textContent = format(state.credits);
    $('perSecond').textContent = format(ratePerSecond(state, now));
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
    $('signalData').textContent = format(state.signalData);
    renderPurchaseModes();
    renderUpgrades();
    renderCircuits(now);
    renderContracts();
    renderResearch();
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
    state.lifetimeEarned += amount;
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
      const sequences = { click: [620], buy: [520, 780], prestige: [440, 660, 880], toggle: [660], surge: [390, 590, 880], claim: [740, 980] };
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
    const generator = GENERATORS.find(item => item.id === button.dataset.buy); if (!generator) return;
    const count = selectedBuyCount(generator); if (!count) return;
    const price = bulkCost(generator, count);
    if (!Number.isFinite(price) || !canAfford(price, state.credits)) return;
    state.credits = Math.max(0, state.credits - price);
    state.owned[generator.id] = Math.min(MAX_OWNED, (state.owned[generator.id] || 0) + count);
    state.totalPurchases += count;
    updateUI(); save(); playSound('buy');
    showToast(`${count} × ${generator.name} déployé${count > 1 ? 's' : ''}`);
  });
  document.querySelectorAll('[data-buy-mode]').forEach(button => button.addEventListener('click', () => {
    const mode = button.dataset.buyMode;
    state.buyMode = mode === 'max' ? 'max' : Number(mode);
    updateUI(); save();
  }));
  $('circuitList').addEventListener('click', event => {
    const button = event.target.closest('[data-surge]'); if (!button) return;
    const circuit = CIRCUITS.find(item => item.id === button.dataset.surge); if (!circuit) return;
    if (state.surcharge.activeId || state.surcharge.overheated || circuitProduction(circuit) <= 0) return;
    const now = Date.now();
    state.surcharge.activeId = circuit.id;
    state.surcharge.activeStartedAt = now;
    state.surcharge.activeUntil = now + SURGE_DURATION_MS;
    state.totalOverclocks++;
    updateUI(); save(); playSound('surge');
    showToast(`${circuit.name} en surcharge · ${SURGE_DURATION_MS / 1000} secondes`);
  });
  $('contractList').addEventListener('click', event => {
    const button = event.target.closest('[data-claim]'); if (!button) return;
    const index = Number(button.dataset.claim);
    const contract = state.contracts[index];
    if (!contract || contractProgress(contract) < contract.target) return;
    state.signalData += contract.reward;
    state.contractsCompleted++;
    state.contracts.splice(index, 1);
    state.contracts.push(createContract(state, contract.type));
    updateUI(); save(); playSound('claim');
    showToast(`Contrat rempli · +${contract.reward} données`);
  });
  $('researchList').addEventListener('click', event => {
    const button = event.target.closest('[data-research]'); if (!button) return;
    const branch = RESEARCH.find(item => item.id === button.dataset.research); if (!branch) return;
    const level = state.research[branch.id] || 0;
    const cost = researchCost(branch);
    if (level >= branch.costs.length || state.signalData < cost) return;
    state.signalData -= cost;
    state.research[branch.id] = level + 1;
    updateUI(); save(); playSound('buy');
    showToast(`${branch.name} amélioré · niveau ${level + 1}`);
  });
  $('prestigeButton').addEventListener('click', () => {
    const gain = prestigeGain(); if (!gain) return;
    state.prestige = Math.min(MAX_OWNED, state.prestige + gain);
    state.credits = 0; state.totalEarned = 0;
    state.owned = Object.fromEntries(GENERATORS.map(item => [item.id, 0]));
    state.surcharge = { heat: 0, activeId: null, activeStartedAt: 0, activeUntil: 0, overheated: false };
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
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1200);
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
      offlineReport = settleOffline(imported, Date.now());
      state = imported;
      lastTick = Date.now();
      updateUI(); save();
      if (offlineReport) showOfflineReport(offlineReport);
      showToast('Sauvegarde importée');
    } catch (_) { showToast('Sauvegarde invalide ou illisible'); }
  });
  $('resetButton').addEventListener('click', () => {
    if (!window.confirm('Effacer toute la progression enregistrée sur cet appareil ?')) return;
    localStorage.removeItem(SAVE_KEY); state = createFreshState(); lastTick = Date.now();
    updateUI(); save(); showToast('Progression réinitialisée');
  });

  function tick(now = Date.now()) {
    const from = lastTick;
    const elapsed = Math.min(Math.max(0, (now - from) / 1000), OFFLINE_CAP_SECONDS);
    const effectiveFrom = now - elapsed * 1000;
    const activeSeconds = Math.min(elapsed, overclockActiveSeconds(state, effectiveFrom, now));
    const circuit = state.surcharge.activeId ? CIRCUITS.find(item => item.id === state.surcharge.activeId) : null;
    const extra = circuit && activeSeconds > 0
      ? circuitProduction(circuit) * (surchargeMultiplier(circuit) - 1) * activeSeconds
      : 0;
    addCredits(baseProductionRate(state) * elapsed + extra);
    advanceSurcharge(state, effectiveFrom, now);
    lastTick = now;
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
  if (offlineReport && offlineReport.earned > 0) showOfflineReport(offlineReport);

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
