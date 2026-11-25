/* Calculs partagés par l'accueil et l'application. Montants en FCFA. */
(function () {
  const D = window.WU;
  const J = D.jours, MOIS = 30;
  const rad = x => x * Math.PI / 180;
  function km(a, b, c, d) {
    const x = rad(d - b) * Math.cos(rad((a + c) / 2)), y = rad(c - a);
    return Math.sqrt(x * x + y * y) * 6371;
  }
  // chiffres de chaque point
  D.points.forEach(p => {
    p.moy = (p.a[2] + p.a[3] + p.a[4]) / 3;               // montant mensuel moyen août à octobre
    p.moyN = (p.m[2] + p.m[3] + p.m[4]) / 3;
    p.ryt = p.a[5] * MOIS / J;                              // novembre ramené à un mois complet
    p.ev = p.moy ? p.ryt / p.moy - 1 : 0;
    p.st = p.j >= 7 ? 'inactif' : p.ev <= -0.2 ? 'baisse' : p.ev >= 0.1 ? 'hausse' : 'stable';
    p.perte = (p.st === 'inactif' || p.st === 'baisse') ? Math.max(0, p.moy - p.ryt) : 0;
    p.nom = p.p + ', ' + p.z + (p.s === 'centre' ? ' centre' : ' ' + p.s);
  });
  const ZONES = D.zones.map(z => z.z);
  const inZone = (p, z) => !z || z === 'tout' || p.z === z || (z === 'Abidjan' && p.g === 'Abidjan');
  const pts = z => D.points.filter(p => inZone(p, z));
  const cellsOf = z => D.cells.filter(c => !z || z === 'tout' || c[3] === z || (z === 'Abidjan' && D.zones.find(q => q.z === c[3]).g === 'Abidjan'));
  const actifs = () => D.points.filter(p => p.st !== 'inactif');
  function nearest(la, lo, list) {
    let m = 1e9;
    for (const p of list) { const d = km(la, lo, p.la, p.lo); if (d < m) m = d; }
    return m;
  }
  let _dist = null;
  function dist() { if (!_dist) { const a = actifs(); _dist = D.cells.map(c => nearest(c[0], c[1], a)); } return _dist; }
  D.cells.forEach((c, i) => c.i = i);
  // habitants à plus de X km d'un point actif, par quartier
  function blanches(z, X) {
    const d = dist(), q = {};
    let tot = 0, loin = 0;
    cellsOf(z).forEach(c => {
      tot += c[2];
      if (d[c.i] > X) {
        loin += c[2];
        const k = c[3] + ' ' + c[4];
        const e = q[k] || (q[k] = { q: c[3] + (c[4] === 'centre' ? ' centre' : ' ' + c[4]), z: c[3], hab: 0, cells: [], dmax: 0 });
        e.hab += c[2]; e.cells.push(c); e.dmax = Math.max(e.dmax, d[c.i]);
      }
    });
    const list = Object.values(q).sort((a, b) => b.hab - a.hab);
    return { tot, loin, list };
  }
  // emplacements proposés un par un : à chaque tour, le carré qui rapproche le plus d'habitants encore loin
  function propositions(z, X, k) {
    const d = dist().slice(), cs = cellsOf(z), out = [];
    for (let r = 0; r < k; r++) {
      let best = null;
      cs.forEach(c => {
        if (c[2] < 1000) return;
        let g = 0;
        cs.forEach(e => { if (d[e.i] > X && km(c[0], c[1], e[0], e[1]) <= X) g += e[2]; });
        if (!best || g > best.g) best = { la: c[0], lo: c[1], z: c[3], s: c[4], g };
      });
      if (!best || best.g < 2000) break;
      cs.forEach(e => { const x = km(best.la, best.lo, e[0], e[1]); if (x < d[e.i]) d[e.i] = x; });
      best.q = best.z + (best.s === 'centre' ? ' centre' : ' ' + best.s);
      out.push(best);
    }
    return out;
  }
  // points à voir en priorité
  function raisons(p, cr) {
    const r = [];
    const vu = cr && cr[p.id];
    if (p.st === 'inactif') r.push({ k: 'inactif', t: 'Inactif depuis ' + p.j + ' j' });
    if (p.st === 'baisse') r.push({ k: 'baisse', t: 'En baisse de ' + Math.round(-p.ev * 100) + ' %' });
    if (!vu && p.v > 30) r.push({ k: 'visite', t: 'Pas de visite depuis ' + p.v + ' j' });
    return r;
  }
  function priorites(z, cr) {
    const rang = p => p.st === 'inactif' ? 0 : p.st === 'baisse' ? 1 : 2;
    return pts(z).map(p => ({ p, r: raisons(p, cr) })).filter(x => x.r.length)
      .sort((a, b) => rang(a.p) - rang(b.p) || (b.p.perte - a.p.perte) || (b.p.moy - a.p.moy));
  }
  function resume(list) {
    const s = { n: list.length, tr: 0, mt: 0, moy: 0, ryt: 0, inact: 0, baisse: 0, nv: 0, pb: 0 };
    list.forEach(p => {
      s.tr += p.m[5]; s.mt += p.a[5]; s.moy += p.moy; s.ryt += p.ryt;
      if (p.st === 'inactif') s.inact++; if (p.st === 'baisse') s.baisse++;
      if (p.v > 30) s.nv++; if (p.pb.length) s.pb++;
    });
    s.ev = s.moy ? s.ryt / s.moy - 1 : 0;
    return s;
  }
  function commerciaux(z) {
    const ids = [...new Set(pts(z).map(p => p.c))];
    return ids.map(c => {
      const l = D.points.filter(p => p.c === c);
      const s = resume(l);
      s.c = c; s.nom = D.com[c];
      s.zones = [...new Set(l.map(p => p.z))].join(', ');
      s.vis = l.filter(p => p.v <= 30).length;
      s.couv = s.vis / l.length;
      return s;
    });
  }
  function impact() {
    const all = D.points;
    const risque = all.filter(p => p.perte > 0);
    const perte = risque.reduce((s, p) => s + p.perte, 0);
    const b = blanches('tout', 3);
    const props = propositions('tout', 3, 5);
    const gagne = props.reduce((s, p) => s + p.g, 0);
    const nv = all.filter(p => p.v > 30);
    const nvMoy = nv.reduce((s, p) => s + p.moy, 0);
    return { risque, perte, b, props, gagne, nv, nvMoy, n: all.length };
  }
  const sp = s => s.replace(/\u202f|\u00a0/g, ' ');
  const fmt = n => sp(Math.round(n).toLocaleString('fr-FR'));
  const dec = (x, d) => sp(x.toLocaleString('fr-FR', { maximumFractionDigits: d }));
  const fcfa = n => fmt(n) + ' FCFA';
  const mfcfa = n => n >= 1e9 ? dec(n / 1e9, 2) + ' Md FCFA' : n >= 1e6 ? dec(n / 1e6, 1) + ' M FCFA' : fcfa(n);
  const pct = x => (x > 0 ? '+' : '') + dec(Math.round(x * 1000) / 10, 1) + ' %';
  window.CALC = { D, km, pts, cellsOf, dist, blanches, propositions, raisons, priorites, resume, commerciaux, impact, ZONES, J, MOIS, fmt, fcfa, mfcfa, pct, dec };
})();
