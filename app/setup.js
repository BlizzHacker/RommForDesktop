
  const $ = id => document.getElementById(id);
  (async () => {
    const cfg = await window.cartridge.getCfg();
    if (cfg.server) $('server').value = cfg.server;
    if (cfg.user) $('user').value = cfg.user;
    if (cfg.romarr) $('romarr').value = cfg.romarr;
  })();
  const address = id => {
    const value = $(id).value.trim();
    return value && !/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? 'https://' + value : value;
  };
  $('go').addEventListener('click', async () => {
    const server = address('server');
    if (!server) { $('status').textContent = 'Enter your own RomM server address.'; return; }
    $('status').textContent = 'Connecting…';
    $('go').disabled = true;
    try { await window.cartridge.saveCfg({ server, romarr: address('romarr'), user: $('user').value.trim(), pass: $('pass').value }); }
    catch (error) { $('status').textContent = error.message; $('go').disabled = false; }
    finally { $('pass').value = ''; }
  });
  ['server', 'user', 'pass', 'romarr'].forEach(id =>
    $(id).addEventListener('keydown', e => { if (e.key === 'Enter') $('go').click(); }));
