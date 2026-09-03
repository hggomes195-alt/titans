(() => {
  const current = new URL(window.location.href);
  const englishPage = /-en\.html$/.test(current.pathname);
  const wiki = /wiki(?:-en)?\.html$/.test(current.pathname);
  const explicit = current.searchParams.get('lang');
  let saved;
  try { saved = localStorage.getItem('titans-language'); } catch {}
  const valid = value => value === 'pt' || value === 'en';
  const language = valid(explicit) ? explicit : englishPage ? 'en' : valid(saved) ? saved : /^en\b/i.test(navigator.language || '') ? 'en' : 'pt';
  const target = code => {
    const url = new URL(current.href);
    url.pathname = url.pathname.replace(/[^/]*$/, (wiki ? 'wiki' : 'index') + (code === 'en' ? '-en' : '') + '.html');
    url.searchParams.set('lang', code);
    return url;
  };
  try { localStorage.setItem('titans-language', language); } catch {}
  if (englishPage !== (language === 'en')) {
    window.location.replace(target(language).href);
    return;
  }
  const updateLinks = () => document.querySelectorAll('[data-language]').forEach(link => { link.href = target(link.dataset.language).href; });
  updateLinks();
  window.addEventListener('hashchange', () => { current.hash = window.location.hash; updateLinks(); });
  document.querySelectorAll('[data-language]').forEach(link => link.addEventListener('click', () => {
    try { localStorage.setItem('titans-language', link.dataset.language); } catch {}
  }));
})();
