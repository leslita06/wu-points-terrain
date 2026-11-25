(function () {
  const C = window.CALC, D = C.D, I = C.impact();
  document.querySelectorAll('.asof').forEach(e => e.textContent = D.date);
  document.getElementById('h-asof').textContent = I.n + ' points, 18 communes et villes';
  const pctLoin = C.dec(I.b.loin / I.b.tot * 100, 1);
  const card = (v, l, m) => `<article class="imp"><div class="v">${v}</div><div class="l">${l}</div><details><summary>Méthode</summary><p>${m}</p></details></article>`;
  document.getElementById('impacts').innerHTML =
    card(C.mfcfa(I.perte) + ' par mois', `à récupérer chez ${I.risque.length} points inactifs ou en baisse`,
      `Pour chaque point sans opération depuis 7 jours ou plus, ou dont novembre est 20 % sous la moyenne : montant mensuel moyen versé d'août à octobre, moins le montant de novembre ramené à 30 jours (du 1er au ${C.J} novembre). Somme sur les ${I.risque.length} points. C'est ce que la tournée vise en priorité.`) +
    card(C.fmt(I.b.loin) + ' habitants', `à plus de 3 km d'un point actif, ${pctLoin} % de la zone`,
      `Habitants estimés par carré d'un kilomètre sur les 18 communes et villes, soit ${C.fmt(I.b.tot)} au total. Distance à vol d'oiseau jusqu'au point actif le plus proche ; un point inactif depuis 7 jours ne compte pas. 5 nouveaux points bien placés en rapprocheraient ${C.fmt(I.gagne)} à 3 km ou moins.`) +
    card(I.nv.length + ' points', `sans visite depuis plus de 30 jours, ${C.mfcfa(I.nvMoy)} versés par mois`,
      `Points dont la dernière visite du commercial remonte à plus de 30 jours au ${D.date}, sur ${I.n}. Le montant est la somme de leur moyenne mensuelle versée d'août à octobre : l'activité qui tourne sans que personne n'y soit passé.`);
})();
