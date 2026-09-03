const menuButton = document.querySelector('.menu-button');
const navigation = document.getElementById('wiki-nav');
const search = document.getElementById('wiki-search');
const sections = [...document.querySelectorAll('.searchable')];
const noResults = document.getElementById('no-results');
const status = document.getElementById('search-status');

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  navigation.classList.toggle('open');
});

function closeMenu() {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.getElementById('year').textContent = new Date().getFullYear();

function normalize(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function filterWiki() {
  const query = normalize(search.value);
  let matches = 0;
  sections.forEach(section => {
    const content = normalize(`${section.dataset.search || ''} ${section.textContent}`);
    const visible = !query || query.split(/\s+/).every(word => content.includes(word));
    section.classList.toggle('is-hidden', !visible);
    if (visible) matches += 1;
  });
  noResults.hidden = matches !== 0;
  status.textContent = query ? `${matches} capítulo${matches === 1 ? '' : 's'} encontrado${matches === 1 ? '' : 's'} para “${search.value.trim()}”.` : `Explore os ${sections.length} capítulos do guia.`;
}

function clearSearch() { search.value = ''; filterWiki(); }
document.getElementById('clear-search').addEventListener('click', () => { clearSearch(); search.focus(); });
document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
  if (search.value) clearSearch();
}));
window.addEventListener('hashchange', () => {
  if (search.value) clearSearch();
  const target = document.getElementById(location.hash.slice(1));
  if (target) target.scrollIntoView();
});

search.addEventListener('input', filterWiki);
document.addEventListener('keydown', event => {
  const editing = event.target.closest('input, textarea, select, [contenteditable="true"]');
  if (event.key === '/' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    search.focus();
  }
  if (event.key === 'Escape' && document.activeElement === search) {
    search.value = '';
    filterWiki();
    search.blur();
  }
  if (event.key === 'Escape') closeMenu();
});
