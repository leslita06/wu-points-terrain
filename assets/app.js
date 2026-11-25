(function () {
  const C = window.CALC, D = C.D, $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const APERCU = /apercu=1/.test(location.search);
  const IC = {
    carte: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    zone: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
    tournee: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M9 15l2 2 4-4"/>',
    blanches: '<circle cx="12" cy="12" r="8" stroke-dasharray="3 3"/><path d="M12 9v6M9 12h6"/>',
    classement: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    alert: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.8 3 2.6 3.5 5.2"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    go: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    liq: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>',
    panne: '<rect x="4" y="4" width="16" height="12" rx="2"/><path d="M8 20h8M12 16v4M9 8l6 4M15 8l-6 4"/>',
    form: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'
  };
  const svg = k => '<svg viewBox="0 0 24 24">' + IC[k] + '</svg>';
  const VIEWS = [['carte', 'Carte'], ['zone', 'Ma zone'], ['tournee', 'Tournée'], ['blanches', 'Zones blanches'], ['classement', 'Classement']];
  const PB = { rupture: ['Rupture de liquidité', 'liq'], panne: ['Panne du terminal', 'panne'], formation: ['Personnel non formé', 'form'] };
  const ETAT = { hausse: 'En hausse', stable: 'Stable', baisse: 'En baisse', inactif: 'Inactif' };
  const TYPES = { banque: 'Banque', microfinance: 'Microfinance', mobile: 'Portefeuille mobile' };
  const SH = { banque: 'sq', microfinance: 'ci', mobile: 'di' };
  const COL = { hausse: '#1f7a4d', stable: '#3a3a3a', baisse: '#E07A00', inactif: '#c0392b' };
  const TODAY = new Date(2026, 10, 24);
  const dstr = (d, y) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', ...(y ? { year: 'numeric' } : {}) });
  const ago = n => { const d = new Date(TODAY); d.setDate(d.getDate() - n); return d; };
  const jours = n => n === 0 ? "aujourd'hui" : n === 1 ? 'hier' : 'il y a ' + n + ' jours';
  const MOISL = ['juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre'];

  // comptes rendus enregistrés sur ce téléphone
  let CR = {};
  try { CR = JSON.parse(localStorage.getItem('wu-cr') || '{}'); } catch (e) { CR = {}; }
  const saveCR = () => { try { localStorage.setItem('wu-cr', JSON.stringify(CR)); } catch (e) {} };
  const lastVisit = p => CR[p.id] ? 0 : p.v;

  // zone choisie
  let ZONE = 'Yopougon';
  try { ZONE = localStorage.getItem('wu-zone') || ZONE; } catch (e) {}
  if (ZONE !== 'tout' && ZONE !== 'Abidjan' && !C.ZONES.includes(ZONE)) ZONE = 'Yopougon';
  const zsel = $('zone');
  const ab = D.zones.filter(z => z.g === 'Abidjan').map(z => z.z).sort((a, b) => a.localeCompare(b, 'fr'));
  const it = D.zones.filter(z => z.g !== 'Abidjan').map(z => z.z).sort((a, b) => a.localeCompare(b, 'fr'));
  zsel.innerHTML = '<option value="tout">Tout le réseau</option><optgroup label="Abidjan"><option value="Abidjan">Abidjan, toutes communes</option>' +
    ab.map(z => `<option>${z}</option>`).join('') + '</optgroup><optgroup label="Intérieur">' + it.map(z => `<option>${z}</option>`).join('') + '</optgroup>';
  zsel.value = ZONE;
  const zlabel = () => ZONE === 'tout' ? 'Tout le réseau' : ZONE === 'Abidjan' ? 'Abidjan' : ZONE;
  const zoneCom = () => { const l = C.pts(ZONE); const s = [...new Set(l.map(p => p.c))]; return s; };

  // navigation
  $('tabs').innerHTML = VIEWS.map(([k, l]) => `<a href="#${k}" data-v="${k}">${svg(k)}${l}${k === 'tournee' ? ' <span class="badge" id="nb-t"></span>' : ''}</a>`).join('');
  $('tabbar').innerHTML = VIEWS.map(([k, l]) => `<a href="#${k}" data-v="${k}">${svg(k)}<span>${k === 'blanches' ? 'Zones' : l}</span>${k === 'tournee' ? '<span class="badge" id="nb-t2"></span>' : ''}</a>`).join('');
  let VIEW = 'carte';
  function route() {
    const h = (location.hash || '#carte').slice(1);
    VIEW = VIEWS.some(v => v[0] === h) ? h : 'carte';
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + VIEW));
    document.body.dataset.v = VIEW;
    document.querySelectorAll('[data-v]').forEach(a => a.classList.toggle('on', a.dataset.v === VIEW));
    window.scrollTo(0, 0);
    render();
  }
  window.addEventListener('hashchange', route);
  zsel.addEventListener('change', () => { ZONE = zsel.value; try { localStorage.setItem('wu-zone', ZONE); } catch (e) {} ; fitDone = false; fit2Done = false; render(); });

  const kpi = (ic, v, l, cls) => `<div class="kpi ${cls || ''}"><span class="ic">${svg(ic)}</span><div><b>${v}</b><span>${l}</span></div></div>`;
  const tagEtat = p => `<i class="tg ${p.st}">${ETAT[p.st]}${p.st === 'baisse' || p.st === 'hausse' ? ' ' + C.pct(p.ev) : ''}</i>`;
  const evs = x => `<span class="${x >= 0.005 ? 'up' : x <= -0.005 ? 'down' : ''}">${C.pct(x)}</span>`;

  // ---------- CARTE ----------
  const FT = { banque: true, microfinance: true, mobile: true };
  let FE = 'tous';
  $('f-type').innerHTML = Object.entries(TYPES).map(([k, l]) => `<button data-k="${k}" class="on"><i class="shape ${SH[k]}"></i>${l === 'Portefeuille mobile' ? 'Mobile' : l + 's'}</button>`).join('');
  $('f-etat').innerHTML = [['tous', 'Tous'], ['baisse', 'En baisse'], ['inactif', 'Inactifs'], ['visite', 'À revoir'], ['pb', 'Problème ouvert']].map(([k, l]) => `<button data-k="${k}" class="${k === 'tous' ? 'on' : ''}">${l}</button>`).join('');
  $('f-type').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; FT[b.dataset.k] = !FT[b.dataset.k]; if (!Object.values(FT).some(Boolean)) FT[b.dataset.k] = true; b.classList.toggle('on', FT[b.dataset.k]); drawMap(); });
  $('f-etat').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; FE = b.dataset.k; [...$('f-etat').children].forEach(x => x.classList.toggle('on', x === b)); drawMap(); });
  const okEtat = p => FE === 'tous' || (FE === 'visite' ? lastVisit(p) > 30 : FE === 'pb' ? p.pb.length > 0 : p.st === FE);
  let map, layer, fitDone = false;
  function icon(p, sel) {
    const s = p.pt === 'mobile' ? 11 : 13;
    return L.divIcon({ className: 'pm' + (sel ? ' sel' : ''), iconSize: [s + 6, s + 6], html: `<i class="${SH[p.pt]}" style="width:${s}px;height:${s}px;background:${COL[p.st]}"></i>` });
  }
  function drawMap() {
    if (!map) {
      map = L.map('map', { zoomControl: !matchMedia('(max-width:900px)').matches, attributionControl: true, preferCanvas: false }).setView([5.35, -4.02], 12);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
      layer = L.layerGroup().addTo(map);
    }
    layer.clearLayers();
    const all = C.pts(ZONE), list = all.filter(p => FT[p.pt] && okEtat(p));
    list.forEach(p => {
      const m = L.marker([p.la, p.lo], { icon: icon(p), riseOnHover: true }).addTo(layer);
      m.bindTooltip(`<b>${esc(p.nom)}</b><br>${C.fcfa(p.a[5])} en novembre`, { direction: 'top', offset: [0, -6] });
      m.on('click', () => openFiche(p.id));
    });
    if (!fitDone && all.length) { map.fitBounds(L.latLngBounds(all.map(p => [p.la, p.lo])).pad(.08), { maxZoom: 15 }); fitDone = true; }
    const s = C.resume(all);
    $('ms-t').textContent = zlabel();
    $('ms-s').textContent = `${all.length} points de versement, ${list.length} affichés. Novembre du 1er au ${C.J}.`;
    $('k-carte').innerHTML = kpi('money', C.mfcfa(s.mt), 'versés en novembre') +
      kpi('trend', C.pct(s.ev), 'rythme de novembre face à la moyenne d\'août à octobre') +
      kpi('alert', s.inact + s.baisse, 'points inactifs ou en baisse', 'red');
    setTimeout(() => map.invalidateSize(), 50);
  }

  // ---------- FICHE ----------
  function bars(vals, opt) {
    opt = opt || {};
    const proj = vals[5] * C.MOIS / C.J;
    const mx = Math.max(...vals.slice(0, 5), proj) || 1;
    return vals.map((v, i) => {
      const last = i === 5;
      const h = Math.max(2, v / mx * 100);
      const ph = last ? Math.max(0, (proj - v) / mx * 100) : 0;
      return `<div class="b"><em>${opt.fmt ? opt.fmt(v) : C.fmt(v)}</em>` +
        (last && ph > 0 ? `<i class="proj" style="height:${ph}%;border-radius:6px 6px 0 0"></i>` : '') +
        `<i class="${last ? 'part' : ''}" style="height:${h}%;${last && ph > 0 ? 'border-radius:0' : ''}"></i><span>${D.mois[i]}${last ? ' (' + C.J + ' j)' : ''}</span></div>`;
    }).join('');
  }
  const mfmt = v => v >= 1e9 ? C.dec(v / 1e9, 1) + ' Md' : v >= 1e6 ? C.dec(v / 1e6, 1) + ' M' : C.dec(v / 1e3, 0) + ' k';
  let OPEN = null;
  function openFiche(id, focusForm) {
    const p = D.points.find(x => x.id === id); if (!p) return;
    OPEN = id;
    const cr = CR[id];
    const v = lastVisit(p);
    const pbs = p.pb.length ? '<ul class="pbs">' + p.pb.map(b => `<li>${svg(PB[b.t][1])}<div><b>${PB[b.t][0]}</b><small>Signalé le ${dstr(ago(b.d))}, ouvert depuis ${b.d} jours</small></div></li>`).join('') + '</ul>' : '<p class="okp">Aucun problème ouvert.</p>';
    const ops = p.j === 0 ? `Aujourd'hui à ${p.h}` : `${dstr(ago(p.j))} à ${p.h} (${jours(p.j)})`;
    $('d-body').innerHTML = `
      <div class="fh"><div class="pt">${TYPES[p.pt]}, ${p.id}</div><h2>${esc(p.nom)}</h2>
        <div class="tgs">${tagEtat(p)}${p.pb.length ? `<i class="tg pb">${p.pb.length} problème ouvert</i>` : ''}${v > 30 ? `<i class="tg visite">Pas de visite depuis ${v} j</i>` : ''}${cr ? '<i class="tg fait">Visité</i>' : ''}</div></div>
      <div class="g3"><div><b>${C.fmt(p.m[5])}</b><span>transferts versés en novembre</span></div><div><b>${C.mfcfa(p.a[5])}</b><span>montant versé en novembre</span></div><div><b>${evs(p.ev)}</b><span>face à la moyenne d'août à octobre</span></div></div>
      <div class="sec"><h4>Montant versé sur 6 mois (FCFA)</h4><div class="bars">${bars(p.a, { fmt: mfmt })}</div>
        <p class="note">Novembre du 1er au ${C.J}. En pointillé, le mois complet au même rythme : ${C.mfcfa(p.ryt)}.</p></div>
      <div class="sec"><h4>Activité</h4><dl class="dl">
        <dt>Dernière opération</dt><dd>${ops}, versement de ${C.fcfa(p.mt)}</dd>
        <dt>Transferts par mois</dt><dd>${C.fmt(p.moyN)} en moyenne d'août à octobre</dd>
        <dt>Partenaire</dt><dd>${p.p}</dd>
        <dt>Commercial</dt><dd>${D.com[p.c]}</dd>
        <dt>Dernière visite</dt><dd>${cr ? `Aujourd'hui, compte rendu enregistré` : `${dstr(ago(p.v))} (${jours(p.v)})<br><span class="muted">${esc(p.vn)}</span>`}</dd>
      </dl></div>
      <div class="sec"><h4>Problèmes ouverts</h4>${pbs}</div>
      <div class="sec" id="d-cr"><h4>Compte rendu de visite</h4>${cr ? savedHtml(cr) : formHtml(p)}</div>
      <p class="note"><a href="https://www.google.com/maps/dir/?api=1&destination=${p.la},${p.lo}" target="_blank" rel="noopener">Itinéraire jusqu'au point</a></p>`;
    const f = $('d-body').querySelector('form');
    if (f) f.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(f);
      CR[id] = { vu: fd.get('vu').trim(), pb: fd.get('pb'), act: fd.get('act').trim(), dt: fd.get('dt'), at: TODAY.toISOString().slice(0, 10) };
      saveCR(); openFiche(id); render(true);
    });
    const ed = $('d-body').querySelector('[data-edit]');
    if (ed) ed.addEventListener('click', () => { delete CR[id]; saveCR(); openFiche(id, true); render(true); });
    $('drawer').classList.add('on'); $('scrim').classList.add('on'); $('drawer').setAttribute('aria-hidden', 'false');
    $('drawer').scrollTop = 0;
    if (focusForm) setTimeout(() => { $('d-cr').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 260);
  }
  function formHtml(p) {
    const d = new Date(TODAY); d.setDate(d.getDate() + 7);
    const pb0 = p.pb.length ? p.pb[0].t : 'aucun';
    return `<form class="cr">
      <label>Ce que j'ai constaté<textarea name="vu" required placeholder="Ex. : guichet ouvert, affiche des tarifs en place, file le matin"></textarea></label>
      <label>Problème relevé<select name="pb"><option value="aucun"${pb0 === 'aucun' ? ' selected' : ''}>Aucun</option><option value="rupture"${pb0 === 'rupture' ? ' selected' : ''}>Rupture de liquidité</option><option value="panne"${pb0 === 'panne' ? ' selected' : ''}>Panne du terminal</option><option value="formation"${pb0 === 'formation' ? ' selected' : ''}>Personnel non formé</option></select></label>
      <label>Action convenue<div class="two"><input name="act" required placeholder="Ex. : rappeler le gérant pour la liquidité"><input type="date" name="dt" required value="${d.toISOString().slice(0, 10)}" aria-label="Date de l'action"></div></label>
      <button class="btn y" type="submit">${svg('edit')}Enregistrer la visite</button>
    </form>`;
  }
  function savedHtml(c) {
    const pb = c.pb === 'aucun' ? 'Aucun problème' : PB[c.pb][0];
    return `<div class="saved"><b>Visite enregistrée</b>${esc(c.vu)}<br>${pb}<br>Action : ${esc(c.act)}, pour le ${dstr(new Date(c.dt + 'T12:00:00'))}</div><p class="note"><button class="btn" data-edit type="button">Modifier</button></p>`;
  }
  function closeFiche() { $('drawer').classList.remove('on'); $('scrim').classList.remove('on'); $('drawer').setAttribute('aria-hidden', 'true'); OPEN = null; }
  $('d-x').addEventListener('click', closeFiche); $('scrim').addEventListener('click', closeFiche);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeFiche(); });
  document.addEventListener('click', e => { const li = e.target.closest('[data-p]'); if (li && !e.target.closest('a')) openFiche(li.dataset.p, li.dataset.f === '1'); });

  // ---------- MA ZONE ----------
  let ZCRIT = 'mt';
  $('z-crit').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; ZCRIT = b.dataset.c; [...$('z-crit').children].forEach(x => x.classList.toggle('on', x === b)); drawZone(); });
  const li = (p, val) => `<li data-p="${p.id}"><i class="dot etat-${p.st}"></i><div class="n"><b>${esc(p.nom)}</b><small>${TYPES[p.pt]}, visité ${lastVisit(p) === 0 ? "aujourd'hui" : jours(p.v)}</small></div><div class="v">${val}</div></li>`;
  function drawZone() {
    const l = C.pts(ZONE), s = C.resume(l), coms = zoneCom();
    $('z-t').textContent = 'Ma zone : ' + zlabel();
    $('z-s').textContent = `${l.length} points, suivis par ${coms.map(c => D.com[c]).join(', ').replace(/\.$/, '')}. Novembre du 1er au ${C.J}.`;
    $('k-zone').innerHTML = kpi('money', C.mfcfa(s.mt), `versés en novembre, ${C.fmt(s.tr)} transferts`) +
      kpi('trend', C.pct(s.ev), "rythme de novembre face à la moyenne d'août à octobre") +
      kpi('alert', `${s.inact} inactifs, ${s.baisse} en baisse`, `${s.pb} points avec un problème ouvert`, 'red');
    const mon = [0, 1, 2, 3, 4, 5].map(i => l.reduce((t, p) => t + p.a[i], 0));
    $('z-chart').innerHTML = bars(mon, { fmt: mfmt });
    $('z-ev').textContent = 'Novembre au même rythme : ' + C.mfcfa(s.ryt);
    const bp = {};
    l.forEach(p => { bp[p.p] = (bp[p.p] || 0) + p.a[5]; });
    const parts = Object.entries(bp).sort((a, b) => b[1] - a[1]), mx = parts[0] ? parts[0][1] : 1;
    $('z-part').innerHTML = parts.map(([k, v]) => `<div class="hb"><span>${k}</span><div><i style="width:${v / mx * 100}%"></i></div><b>${mfmt(v)}</b></div>`).join('');
    const key = ZCRIT === 'mt' ? (p => p.a[5]) : (p => p.st === 'inactif' ? -9 : p.ev);
    const sorted = l.slice().sort((a, b) => key(b) - key(a));
    const val = p => ZCRIT === 'mt' ? `${C.mfcfa(p.a[5])}<small>${evs(p.ev)}</small>` : `${p.st === 'inactif' ? '<span class="down">Inactif</span>' : evs(p.ev)}<small class="muted">${C.mfcfa(p.a[5])}</small>`;
    const n = Math.min(5, Math.floor(sorted.length / 2));
    $('z-top').innerHTML = sorted.slice(0, n).map(p => li(p, val(p))).join('');
    $('z-bot').innerHTML = sorted.slice(-n).reverse().map(p => li(p, val(p))).join('');
    $('z-note').textContent = ZCRIT === 'mt' ? 'Classés selon le montant versé du 1er au ' + C.J + ' novembre.' : "Évolution : novembre ramené à 30 jours, comparé à la moyenne mensuelle d'août à octobre. Les inactifs sont classés en dernier.";
  }

  // ---------- TOURNEE ----------
  const JOURS = [new Date(2026, 10, 24), new Date(2026, 10, 25), new Date(2026, 10, 26), new Date(2026, 10, 27)];
  function plan() {
    const pr = C.priorites(ZONE, {}).slice(0, 20);
    if (!pr.length) return [];
    // un secteur par jour : on balaie les points autour du centre de la zone
    const cla = pr.reduce((s, x) => s + x.p.la, 0) / pr.length, clo = pr.reduce((s, x) => s + x.p.lo, 0) / pr.length;
    const ang = x => Math.atan2(x.p.la - cla, x.p.lo - clo);
    const sw = pr.slice().sort((a, b) => ang(a) - ang(b));
    const per = Math.ceil(sw.length / JOURS.length);
    const days = [];
    for (let d = 0; d < JOURS.length; d++) {
      let g = sw.slice(d * per, (d + 1) * per);
      if (!g.length) continue;
      // ordre de passage : le plus urgent d'abord, puis le plus proche
      const out = [g.reduce((a, b) => (a.p.st === 'inactif' ? 0 : 1) <= (b.p.st === 'inactif' ? 0 : 1) ? a : b)];
      g = g.filter(x => x !== out[0]);
      while (g.length) { const l = out[out.length - 1].p; g.sort((a, b) => C.km(l.la, l.lo, a.p.la, a.p.lo) - C.km(l.la, l.lo, b.p.la, b.p.lo)); out.push(g.shift()); }
      days.push({ d: JOURS[d], s: out });
    }
    return days;
  }
  function drawTournee() {
    const all = C.priorites(ZONE, {}), days = plan();
    const nb = days.reduce((s, d) => s + d.s.length, 0);
    const done = days.reduce((s, d) => s + d.s.filter(x => CR[x.p.id]).length, 0);
    const enjeu = days.reduce((s, d) => s + d.s.reduce((t, x) => t + x.p.perte, 0), 0);
    const coms = zoneCom();
    $('t-s').textContent = `${zlabel()}, du mardi 24 au vendredi 27 novembre. ${coms.length === 1 ? 'Tournée de ' + D.com[coms[0]] : 'Les 20 points les plus urgents, ' + coms.length + ' commerciaux. Choisissez une commune pour la tournée d\'un commercial.'}`;
    $('k-tour').innerHTML = kpi('pin', `${done} / ${nb}`, 'visites faites cette semaine', 'dark') +
      kpi('alert', all.length, `points à voir en priorité dans la zone${all.length > nb ? ', ' + nb + ' cette semaine' : ''}`, 'red') +
      kpi('money', C.mfcfa(enjeu), 'par mois de recul chez les points de la tournée');
    $('t-days').innerHTML = days.map(d => `<div class="day"><h3>${d.d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, c => c.toUpperCase())} <small>${d.s.length} visites, secteur ${[...new Set(d.s.map(x => x.p.s === 'centre' ? x.p.z + ' centre' : x.p.z + ' ' + x.p.s))].slice(0, 2).join(', ')}</small></h3>
      <ol class="stops">${d.s.map((x, i) => { const r = C.raisons(x.p, {}); const f = CR[x.p.id]; return `<li class="${f ? 'done' : ''}" data-p="${x.p.id}"><span class="o">${f ? '✓' : i + 1}</span><div class="n"><b>${esc(x.p.nom)}</b><small>${C.mfcfa(x.p.a[5])} en novembre${x.p.pb.length ? ', ' + PB[x.p.pb[0].t][0].toLowerCase() : ''}</small><div class="tgs">${r.map(y => `<i class="tg ${y.k}">${y.t}</i>`).join('')}${f ? '<i class="tg fait">Visité</i>' : ''}</div></div><button class="btn ${f ? '' : 'k'}" data-p="${x.p.id}" data-f="1" type="button">${svg('edit')}${f ? 'Voir le compte rendu' : 'Compte rendu'}</button></li>`; }).join('')}</ol></div>`).join('') || '<div class="card"><p class="okp">Aucun point prioritaire dans cette zone.</p></div>';
    const acts = Object.entries(CR).map(([id, c]) => ({ p: D.points.find(x => x.id === id), c })).filter(x => x.p && C.pts(ZONE).includes(x.p)).sort((a, b) => a.c.dt.localeCompare(b.c.dt));
    $('t-actions').innerHTML = acts.length ? acts.map(x => `<li data-p="${x.p.id}"><b>${dstr(new Date(x.c.dt + 'T12:00:00'))}</b><div>${esc(x.c.act)}<small>${esc(x.p.nom)}</small></div></li>`).join('') : '<li class="empty">Les actions datées apparaissent ici dès qu\'un compte rendu est enregistré.</li>';
    const n = all.length;
    ['nb-t', 'nb-t2'].forEach(k => $(k).textContent = Math.max(0, nb - done) || '');
  }

  // ---------- ZONES BLANCHES ----------
  let map2, l2, fit2Done = false, X = 3;
  $('xkm').addEventListener('input', e => { X = +e.target.value; drawBlanches(); });
  function drawBlanches() {
    $('xkm-v').textContent = X + ' km';
    const b = C.blanches(ZONE, X), props = C.propositions(ZONE, X, 5), g = props.reduce((s, p) => s + p.g, 0);
    $('b-s').textContent = `${zlabel()}. Habitants estimés par carré d'un kilomètre, distance à vol d'oiseau jusqu'au point actif le plus proche.`;
    $('k-bl').innerHTML = kpi('users', C.fmt(b.loin), `habitants à plus de ${X} km d'un point actif, ${C.dec(b.tot ? b.loin / b.tot * 100 : 0, 1)} % de la zone`, 'red') +
      kpi('pin', b.list.length, 'quartiers concernés') +
      kpi('trend', C.fmt(g), `habitants rapprochés à ${X} km ou moins par ${props.length} nouveaux points`);
    $('b-props').innerHTML = props.length ? props.map((p, i) => `<li data-ll="${p.la},${p.lo}"><span class="o">${i + 1}</span><div><b>${p.q}</b><br><small class="muted">${p.la.toFixed(3)}, ${p.lo.toFixed(3)}</small></div><b>+${C.fmt(p.g)}</b></li>`).join('') : '<li>Aucun emplacement utile à cette distance.</li>';
    $('b-meth').textContent = `Chaque emplacement est choisi l'un après l'autre : celui qui rapproche le plus d'habitants encore à plus de ${X} km. Le chiffre à droite compte ces habitants.`;
    $('b-q').innerHTML = b.list.slice(0, 15).map(q => `<li data-ll="${q.cells[0][0]},${q.cells[0][1]}"><div><b>${q.q}</b><small>jusqu'à ${C.dec(q.dmax, 1)} km du point actif le plus proche</small></div><b>${C.fmt(q.hab)}</b></li>`).join('') || '<li>Aucun quartier à plus de ' + X + ' km.</li>';
    if (!map2) {
      map2 = L.map('map2', { zoomControl: true }).setView([5.35, -4.02], 11);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map2);
      l2 = L.layerGroup().addTo(map2);
    }
    l2.clearLayers();
    const d = C.dist(), h = 0.005;
    C.cellsOf(ZONE).forEach(c => { if (d[c.i] > X) L.rectangle([[c[0] - h, c[1] - h], [c[0] + h, c[1] + h]], { stroke: false, fillColor: '#c0392b', fillOpacity: Math.min(.65, .18 + c[2] / 20000) }).bindTooltip(`${C.fmt(c[2])} habitants, ${C.dec(d[c.i], 1)} km du point le plus proche`).addTo(l2); });
    C.pts(ZONE).filter(p => p.st !== 'inactif').forEach(p => L.circleMarker([p.la, p.lo], { radius: 3.5, color: '#000', weight: 1, fillColor: '#000', fillOpacity: .9 }).addTo(l2));
    props.forEach((p, i) => {
      L.circle([p.la, p.lo], { radius: X * 1000, color: '#000', weight: 1.5, dashArray: '5 5', fillColor: '#FFDD00', fillOpacity: .12 }).addTo(l2);
      L.marker([p.la, p.lo], { icon: L.divIcon({ className: 'pin', html: String(i + 1), iconSize: [26, 26] }) }).bindTooltip(`${p.q} : +${C.fmt(p.g)} habitants`).addTo(l2);
    });
    if (!fit2Done) { const ll = C.cellsOf(ZONE).map(c => [c[0], c[1]]); if (ll.length) map2.fitBounds(L.latLngBounds(ll).pad(.05)); fit2Done = true; }
    setTimeout(() => map2.invalidateSize(), 50);
  }
  ['b-props', 'b-q'].forEach(k => $(k).addEventListener('click', e => { const t = e.target.closest('[data-ll]'); if (!t || !map2) return; const [a, b] = t.dataset.ll.split(',').map(Number); map2.setView([a, b], 14); $('map2').scrollIntoView({ behavior: 'smooth', block: 'center' }); }));

  // ---------- CLASSEMENT ----------
  $('c-crit').addEventListener('change', drawClass);
  function drawClass() {
    const grp = ZONE === 'tout' ? 'tout' : (D.zones.find(z => z.z === ZONE) || { g: 'Abidjan' }).g;
    const coms = C.commerciaux(grp === 'tout' ? 'tout' : grp === 'Abidjan' ? 'Abidjan' : null) ;
    const list = grp === 'Intérieur' ? C.commerciaux('tout').filter(c => D.points.find(p => p.c === c.c).g === 'Intérieur') : coms;
    list.sort((a, b) => b.mt - a.mt);
    const mine = zoneCom();
    $('c-s').textContent = `${zlabel()}. Commerciaux ${grp === 'tout' ? 'de tout le réseau' : grp === 'Abidjan' ? "d'Abidjan" : "de l'intérieur"}, points de la zone choisie. Novembre du 1er au ${C.J}.`;
    $('c-com').innerHTML = `<thead><tr><th>#</th><th>Commercial</th><th class="hm">Zones</th><th class="r">Montant du mois</th><th class="r">Évolution</th><th class="r hm">Inactifs</th><th>Visités en 30 j</th></tr></thead><tbody>` +
      list.map((c, i) => `<tr class="${mine.includes(c.c) ? 'me' : ''}" data-z="${esc(c.zones.split(', ')[0])}"><td class="rk">${i + 1}</td><td><b>${c.nom}</b></td><td class="hm">${c.zones}</td><td class="r">${C.mfcfa(c.mt)}</td><td class="r">${evs(c.ev)}</td><td class="r hm">${c.inact}</td><td><span class="cov"><i style="width:${c.couv * 100}%"></i></span>${c.vis} / ${c.n}</td></tr>`).join('') + '</tbody>';
    const cr = $('c-crit').value;
    const key = { mt: p => p.a[5], ev: p => p.st === 'inactif' ? -9 : p.ev, tr: p => p.m[5], v: p => -lastVisit(p) }[cr];
    const pts = C.pts(ZONE).slice().sort((a, b) => key(b) - key(a));
    $('c-pts').innerHTML = `<thead><tr><th>#</th><th>Point</th><th class="r">Montant du mois</th><th class="r hm">Transferts</th><th class="r">Évolution</th><th class="hm">Dernière visite</th></tr></thead><tbody>` +
      pts.map((p, i) => `<tr data-p="${p.id}"><td class="rk">${i + 1}</td><td class="nm"><i class="dot etat-${p.st}" style="margin-right:8px"></i><b>${esc(p.nom)}</b></td><td class="r">${C.mfcfa(p.a[5])}</td><td class="r hm">${C.fmt(p.m[5])}</td><td class="r">${p.st === 'inactif' ? '<span class="down">Inactif</span>' : evs(p.ev)}</td><td class="hm">${lastVisit(p) === 0 ? "aujourd'hui" : jours(p.v)}</td></tr>`).join('') + '</tbody>';
  }
  $('c-com').addEventListener('click', e => { const tr = e.target.closest('tr[data-z]'); if (!tr) return; ZONE = tr.dataset.z; zsel.value = ZONE; try { localStorage.setItem('wu-zone', ZONE); } catch (x) {} fitDone = false; fit2Done = false; render(); });

  function render(keep) {
    if (VIEW === 'carte') drawMap();
    if (VIEW === 'zone') drawZone();
    if (VIEW === 'tournee' || true) drawTournee();
    if (VIEW === 'blanches') drawBlanches();
    if (VIEW === 'classement') drawClass();
  }
  if (APERCU) document.body.classList.add('apercu');
  window.__K = () => { const I = C.impact(); return { points: I.n, perte: Math.round(I.perte), risque: I.risque.length, loin: I.b.loin, gagne: I.gagne, nv: I.nv.length, nvMoy: Math.round(I.nvMoy) }; };
  window.__open = openFiche;
  route();
})();
