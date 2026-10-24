
  const $ = id => document.getElementById(id);
  (async () => {
    const cfg = await window.cartridge.getCfg();
    if (cfg.server) $('server').value = cfg.server;
    if (cfg.user) $('user').value = cfg.user;
  })();
  $('go').addEventListener('click', async () => {
    let server = $('server').value.trim();
    if (!server) { $('status').textContent = 'Enter your own RomM server address.'; return; }
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(server)) server = 'https://' + server;
    $('status').textContent = 'Connecting…';
    $('go').disabled = true;
    try { await window.cartridge.saveCfg({ server, user: $('user').value.trim(), pass: $('pass').value }); }
    catch (error) { $('status').textContent = error.message; $('go').disabled = false; }
    finally { $('pass').value = ''; }
  });
  ['server', 'user', 'pass'].forEach(id =>
    $(id).addEventListener('keydown', e => { if (e.key === 'Enter') $('go').click(); }));
