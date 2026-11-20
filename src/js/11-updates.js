/* ============ HatRack — change log, roles and “What’s new” ============
   One list drives everything here: RELEASE.changelog, built from src/release.json.
   It feeds Configure → Change log, the What’s new summary after an update, the What’s new
   tour track and (at build time) CHANGELOG.md and the guide.

   Each change has a kind (new / improved / fixed / changed / removed) and an audience:
   "all" — everyone sees it — or "admin" — only people whose role on this device is Admin.
   HatRack has no sign-in, so the role is a per-device choice (Everyday use or Admin). */

const KINDS = { new: 'New', improved: 'Improved', fixed: 'Fixed', changed: 'Changed', removed: 'Removed' };
const KIND_GLYPH = { new: '✦', improved: '↑', fixed: '✓', changed: '⇄', removed: '−' };
const AUDIENCES = { all: 'Everyone', admin: 'Admins' };
const ROLES = [['user', 'Everyday use'], ['admin', 'Admin']];
const myRole = () => (U.role === 'user' ? 'user' : 'admin');
const roleName = r => (r === 'user' ? 'Everyday use' : 'Admin');
const kindOf = it => (KINDS[it.kind] ? it.kind : 'new');
const audOf = it => (it.audience === 'admin' ? 'admin' : 'all');
const appliesTo = (it, role) => audOf(it) === 'all' || role === 'admin';
function setRole(r) { U.role = r === 'user' ? 'user' : 'admin'; saveUI(); }

/** releases after `since` up to the current one (only the current one when `since` is empty),
    each with just the changes that apply to `role`, plus how many were left out */
function releasesSince(since, role) {
  return RELEASE.changelog
    .filter(r => cmpVer(r.version, RELEASE.version) <= 0 && (since ? cmpVer(r.version, since) > 0 : r.version === RELEASE.version))
    .map(r => ({ ...r, items: r.items.filter(it => !role || appliesTo(it, role)), hidden: role ? r.items.filter(it => !appliesTo(it, role)).length : 0 }));
}
const changesFor = (role, since) => releasesSince(since, role).flatMap(r => r.items);
const prevVersion = () => (RELEASE.changelog[1] || {}).version || '0.0.0';
const fmtShortDate = s => { const d = parseYMD(s); return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : s; };
const shortDate = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); };
const slideOf = id => (id && tourData() ? tourData().slides[id] : null);
const trackOf = id => (tourData()?.tracks.admin.includes(id) ? 'admin' : 'user');

/* ---------- the What’s new summary ---------- */
let wnState = null;
/** opts.since: show changes after this version (default: just the current release); opts.auto: opened by itself after an update */
function openWhatsNew(opts = {}) {
  $('.wn-modal')?.closest('.modal-back')?.close();
  wnState = { since: opts.since || prevVersion(), auto: !!opts.auto, role: myRole() };
  const m = openModal({ title: 'What’s new', cls: 'wn-modal', autofocus: false, help: 'whats-new', body: '<div class="wn" id="wn"></div>', onClose: () => { wnState = null; } });
  m.querySelector('#wn').addEventListener('click', onWhatsNewClick);
  renderWhatsNew();
}
function renderWhatsNew() {
  const box = $('#wn'); if (!box || !wnState) return;
  const st = wnState, cur = RELEASE.changelog[0];
  const rels = releasesSince(st.since, st.role).filter(r => r.items.length || r.version === RELEASE.version);
  const items = rels.flatMap(r => r.items), hidden = releasesSince(st.since, st.role).reduce((n, r) => n + r.hidden, 0);
  const withItems = rels.filter(r => r.items.length), multi = withItems.length > 1;
  const showAll = cmpVer(st.since, '0.0.1') < 0;
  const eyebrow = st.auto ? `Updated · HatRack ${cur.version}` : `HatRack ${cur.version} · ${fmtLongDate(cur.date)}`;
  const head = showAll ? 'Every update so far' : multi ? `${withItems.length} updates since you were last here` : (cur.title || `What’s new in HatRack ${cur.version}`);
  const sub = showAll ? `${plural(items.length, 'change')} across ${plural(withItems.length, 'release')}, newest first.`
    : st.auto && cmpVer(st.since, '1.0.0') > 0 ? `You were on ${st.since}; this is ${cur.version}. ${items.length ? `${plural(items.length, 'change')} for you.` : ''}`
      : `Released ${fmtLongDate(cur.date)}. ${items.length ? `${plural(items.length, 'change')} for you.` : ''}`;
  let i = 0;
  const card = (it, ver) => {
    const k = kindOf(it), s = slideOf(it.slide);
    const thumb = s && s.img ? `<button class="wn-thumb" data-wnshow="${esc(it.slide)}" aria-label="Show me: ${esc(it.title)}"><img src="${esc(s.img)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('ph');this.remove()"></button>`
      : `<div class="wn-thumb ph" aria-hidden="true"><span>${KIND_GLYPH[k]}</span></div>`;
    return `<article class="wn-card k-${k}" style="--i:${i++}">${thumb}<div class="wn-cbody">
      <div class="wn-tags"><span class="kchip k-${k}">${KINDS[k]}</span>${audOf(it) === 'admin' ? '<span class="achip">Admins</span>' : ''}${ver ? `<span class="vchip">${esc(ver)}</span>` : ''}</div>
      <h4>${esc(it.title)}</h4><p>${esc(it.text)}</p>${s ? `<button class="linkish" data-wnshow="${esc(it.slide)}">Show me</button>` : ''}</div></article>`;
  };
  const body = !items.length
    ? `<div class="wn-empty"><span class="wn-empty-glyph" aria-hidden="true">✓</span><h3>Nothing here changes ${st.role === 'user' ? 'everyday use' : 'how you work'}</h3>
        <p>${hidden ? `This update has ${plural(hidden, 'change')} for admins only. ` : ''}Everything works as before.</p>
        <div class="wn-empty-acts">${hidden ? '<button class="btn" data-wnrole="admin">Show admin changes</button>' : ''}<button class="btn" data-wnall>See earlier updates</button></div></div>`
    : multi || showAll
      ? withItems.slice().sort((a, b) => cmpVer(b.version, a.version)).map(r => `<section class="wn-rel"><h3 class="wn-rel-h"><span class="cl-ver">${esc(r.version)}</span><span class="muted">${esc(fmtLongDate(r.date))}</span>${r.title ? `<span>${esc(r.title)}</span>` : ''}</h3>
          <div class="wn-grid">${r.items.map(it => card(it)).join('')}</div></section>`).join('')
      : `<div class="wn-grid">${items.map(it => card(it)).join('')}</div>`;
  const walk = tourData() && whatsNewSlides(st.since).length > 1;
  box.innerHTML = `<div class="wn-scroll">
    <header class="wn-hero">
      <div class="wn-hero-text"><span class="wn-eyebrow">${esc(eyebrow)}</span><h2>${esc(head)}</h2><p>${esc(sub)}</p></div>
      <div class="wn-role"><span>Showing changes for</span><div class="seg" role="group" aria-label="Role on this device">${ROLES.map(([k, l]) => `<button data-wnrole="${k}" aria-pressed="${st.role === k}">${l}</button>`).join('')}</div></div>
    </header>${body}</div>
    <div class="wn-foot">
      <button class="linkish" data-wnlog>Full change log</button>
      ${hidden && items.length ? `<span class="muted sm">+ ${plural(hidden, 'setup change')} for admins</span>` : ''}
      <span class="spacer"></span>
      ${walk && items.length ? '<button class="btn" data-wnwalk>Walk me through it</button>' : ''}
      <button class="btn primary" data-close>Got it</button>
    </div>`;
  box.querySelector('.wn-foot .primary')?.focus({ preventScroll: true });
}
function onWhatsNewClick(e) {
  const b = e.target.closest('button'); if (!b || !wnState) return;
  if (b.dataset.wnrole) { wnState.role = b.dataset.wnrole; setRole(b.dataset.wnrole); return renderWhatsNew(); }
  if (b.hasAttribute('data-wnall')) { wnState.since = '0.0.0'; wnState.auto = false; return renderWhatsNew(); }
  const since = wnState.since;
  const close = () => $('.wn-modal')?.closest('.modal-back')?.close();
  if (b.dataset.wnshow) { close(); return openTour('whatsnew', { since, step: 'wn-' + b.dataset.wnshow }); }
  if (b.hasAttribute('data-wnwalk')) { close(); return openTour('whatsnew', { since }); }
  if (b.hasAttribute('data-wnlog')) { close(); U.settingsTab = 'changelog'; saveUI(); setView('settings'); }
}

/* ---------- Configure → Change log ---------- */
const clOpts = () => ({ order: 'asc', q: '', aud: '', kind: '', ...(U.cl || {}) });
function paneChangelog() {
  const cl = clOpts(), rels = RELEASE.changelog, first = rels[rels.length - 1];
  const all = rels.flatMap(r => r.items), adminOnly = all.filter(it => audOf(it) === 'admin').length;
  return `<div class="pane-head"><h2>Change log</h2><button class="help-link" data-guide="admin-changelog">How this works</button></div>
    <p>Every release of HatRack and what changed in it, in order. The list ships with the app, so it’s the same everywhere HatRack is opened — download a copy for your records.</p>
    <div class="stats cl-stats">
      <div class="stat"><div class="v">${esc(RELEASE.version)}</div><div class="l">Current version · ${esc(fmtShortDate(RELEASE.date))}</div></div>
      <div class="stat"><div class="v">${rels.length}</div><div class="l">Releases since ${esc(fmtShortDate(first.date))}</div></div>
      <div class="stat"><div class="v">${all.length}</div><div class="l">Changes recorded</div></div>
      <div class="stat"><div class="v">${adminOnly}</div><div class="l">For admins only</div></div>
    </div>
    <h3>Updates for your role</h3>
    <div class="set-actions cl-role"><div class="seg" role="group" aria-label="Role on this device">${ROLES.map(([k, l]) => `<button data-role="${k}" aria-pressed="${myRole() === k}">${l}</button>`).join('')}</div>
      <span class="muted sm">What HatRack shows <b>on this device</b> after an update. Everyday use: changes to daily work. Admin: those plus setup changes.</span></div>
    <div class="cl-histhead"><h3>History</h3><div class="cl-dl"><span class="muted sm">Download the whole log</span><button class="btn sm" data-cldl="csv">CSV</button><button class="btn sm" data-cldl="md">Markdown</button><button class="btn sm" data-cldl="json">JSON</button></div></div>
    <div class="cl-tools">
      <input class="inp" type="search" data-cl="q" value="${esc(cl.q)}" placeholder="Search changes" aria-label="Search changes">
      <select class="inp" data-cl="aud" aria-label="Who it’s for">${[['', 'All changes'], ['all', 'For everyone'], ['admin', 'For admins only']].map(o => opt(o[0], o[1], cl.aud)).join('')}</select>
      <select class="inp" data-cl="kind" aria-label="Kind of change">${[['', 'All kinds'], ...Object.entries(KINDS)].map(o => opt(o[0], o[1], cl.kind)).join('')}</select>
      <div class="seg" role="group" aria-label="Order">${[['asc', 'Oldest first'], ['desc', 'Newest first']].map(([k, l]) => `<button data-clorder="${k}" aria-pressed="${cl.order === k}">${l}</button>`).join('')}</div>
    </div>
    <div id="cl-list">${changelogListHTML(cl)}</div>`;
}
function clFiltered(cl) {
  const q = norm(cl.q);
  const rels = RELEASE.changelog.map(r => ({
    ...r, items: r.items.filter(it => (!cl.aud || audOf(it) === cl.aud) && (!cl.kind || kindOf(it) === cl.kind)
      && (!q || norm(`${r.version} ${r.title || ''} ${it.title} ${it.text} ${KINDS[kindOf(it)]}`).includes(q))),
  })).filter(r => r.items.length);
  return cl.order === 'desc' ? rels : rels.reverse();
}
function changelogListHTML(cl) {
  const rels = clFiltered(cl), seen = U.versions || {};
  if (!rels.length) return '<p class="muted">No changes match. Clear the search or filters.</p>';
  return `<ol class="cl-timeline">${rels.map(r => `<li class="cl-rel${r.version === RELEASE.version ? ' current' : ''}" data-ver="${esc(r.version)}">
    <div class="cl-rhead"><span class="cl-ver">${esc(r.version)}</span><span class="cl-date">${esc(fmtLongDate(r.date))}</span>${r.title ? `<b class="cl-rtitle">${esc(r.title)}</b>` : ''}
      ${r.version === RELEASE.version ? '<span class="cl-cur">Current</span>' : ''}${seen[r.version] ? `<span class="cl-seen">First opened on this device ${esc(shortDate(seen[r.version]))}</span>` : ''}</div>
    <ul class="cl-items">${r.items.map(it => { const k = kindOf(it); return `<li><span class="kchip k-${k}">${KINDS[k]}</span>
      <div class="cl-txt"><b>${esc(it.title)}${audOf(it) === 'admin' ? ' <span class="achip">Admins</span>' : ''}</b><span>${esc(it.text)}</span></div>
      ${slideOf(it.slide) ? `<button class="linkish sm" data-clshow="${esc(it.slide)}">Show me</button>` : '<span></span>'}</li>`; }).join('')}</ul></li>`).join('')}</ol>`;
}
function onChangelogInput(el) {
  U.cl = { ...clOpts(), [el.dataset.cl]: el.value }; saveUI();
  const l = $('#cl-list'); if (l) l.innerHTML = changelogListHTML(U.cl);
}
/** handles the Change log pane's buttons; returns true when it dealt with the click */
function onChangelogClick(b) {
  if (b.dataset.role) { setRole(b.dataset.role); rerenderPane(); toast(`This device now shows updates for ${roleName(myRole())}`); return true; }
  if (b.dataset.clorder) { U.cl = { ...clOpts(), order: b.dataset.clorder }; saveUI(); rerenderPane(); return true; }
  if (b.dataset.cldl) { downloadChangelog(b.dataset.cldl); return true; }
  if (b.dataset.clshow) { openTour(trackOf(b.dataset.clshow), { step: b.dataset.clshow }); return true; }
  return false;
}

/* ---------- downloads: the whole log, in the order chosen on the page ---------- */
function changelogMarkdown(rels) {
  const lines = [`# HatRack change log`, '', `Every release of HatRack and what changed, ${rels[0] === RELEASE.changelog[0] ? 'newest' : 'oldest'} first. Current version: ${RELEASE.version}.`, ''];
  rels.forEach(r => {
    lines.push(`## ${r.version} — ${r.date}${r.title ? ` · ${r.title}` : ''}`, '');
    r.items.forEach(it => lines.push(`- **${it.title}** _(${KINDS[kindOf(it)]} · ${AUDIENCES[audOf(it)]})_ — ${it.text}`));
    lines.push('');
  });
  return lines.join('\n');
}
function downloadChangelog(fmt) {
  const desc = clOpts().order === 'desc', rels = desc ? RELEASE.changelog : RELEASE.changelog.slice().reverse();
  const seen = U.versions || {}, name = `hatrack-changelog-${RELEASE.version}`;
  if (fmt === 'csv') {
    const rows = [['Version', 'Release date', 'Release', 'Kind', 'For', 'Change', 'Details', 'Tour step', 'First opened on this device']];
    rels.forEach(r => r.items.forEach(it => rows.push([r.version, r.date, r.title || '', KINDS[kindOf(it)], AUDIENCES[audOf(it)], it.title, it.text, it.slide || '', seen[r.version] ? seen[r.version].slice(0, 10) : ''])));
    downloadText(`${name}.csv`, toCSV(rows), 'text/csv');
  } else if (fmt === 'md') downloadText(`${name}.md`, changelogMarkdown(rels), 'text/markdown');
  else downloadText(`${name}.json`, JSON.stringify({
    app: 'HatRack', current: RELEASE.version, exportedAt: new Date().toISOString(), order: desc ? 'newest first' : 'oldest first',
    releases: rels.map(r => ({ version: r.version, date: r.date, title: r.title || '', firstOpenedOnThisDevice: seen[r.version] || null, changes: r.items.map(it => ({ kind: kindOf(it), audience: audOf(it), title: it.title, text: it.text, tourStep: it.slide || null })) })),
  }, null, 2), 'application/json');
  toast('Change log downloaded');
}
