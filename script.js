import { publicRankingEntries } from './ranking-public.mjs';

const english = document.documentElement.lang.startsWith('en');
const t = (pt, en) => english ? en : pt;
const button = document.querySelector('.menu-button');
const navigation = document.querySelector('.nav-links');
button.addEventListener('click', () => {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  navigation.classList.toggle('open');
});
document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => navigation.classList.remove('open')));
document.getElementById('year').textContent = new Date().getFullYear();

const serverStatus = document.getElementById('server-status');

async function updateServerStatus() {
  if (!serverStatus) return;
  try {
    const response = await fetch('/api/server-status', { cache: 'no-store' });
    if (!response.ok) throw new Error(t('Status indisponível', 'Status unavailable'));
    const data = await response.json();
    serverStatus.className = data.online ? 'is-online' : 'is-offline';
    serverStatus.textContent = data.online ? t('● SERVIDOR ONLINE', '● SERVER ONLINE') : t('● SERVIDOR OFFLINE', '● SERVER OFFLINE');
  } catch {
    serverStatus.className = 'is-offline';
    serverStatus.textContent = t('● SERVIDOR OFFLINE', '● SERVER OFFLINE');
  }
}

updateServerStatus();
setInterval(updateServerStatus, 30000);

function renderRanking(elementId, entries, emptyMessage, guildRanking = false) {
  const container = document.getElementById(elementId);
  entries = publicRankingEntries(entries);
  if (!entries.length) {
    container.innerHTML = `<div class="ranking-empty"><strong>${emptyMessage}</strong><span>${t('Os dados serão atualizados pelo servidor do jogo.', 'Rankings will be updated by the game server.')}</span></div>`;
    return;
  }
  container.replaceChildren(...entries.map((entry, index) => {
    const details = guildRanking ? `${t('Líder', 'Leader')}: ${entry.leader || t('Não informado', 'Not provided')} · ${t('Forte', 'Fort')}: ${entry.fort || t('Nenhum forte', 'No fort')}` : `${entry.wins || 0} ${t('vitórias PvP · Guilda', 'PvP wins · Guild')}: ${entry.guild || t('Sem guilda', 'No guild')}`;
    const row = document.createElement('div');
    row.className = `ranking-row ranking-row-${index + 1}`;
    for (const [tag, text] of [['b', String(index + 1).padStart(2, '0')], ['span', guildRanking ? entry.name : entry.player || entry.name], ['strong', `${entry.score || 0} pts`], ['small', details]]) {
      const node = document.createElement(tag);
      node.textContent = text || '';
      row.append(node);
    }
    return row;
  }));
}

async function loadRankings() {
  try {
    const response = await fetch('/api/rankings');
    const data = await response.json();
    renderRanking('pvp-ranking', data.pvp || [], t('Nenhum jogador ranqueado ainda.', 'No ranked players yet.'));
    renderRanking('guild-ranking', data.guilds || [], t('Nenhuma guilda ranqueada ainda.', 'No ranked guilds yet.'), true);
  } catch {
    renderRanking('pvp-ranking', [], t('Ranking temporariamente indisponível.', 'Rankings temporarily unavailable.'));
    renderRanking('guild-ranking', [], t('Ranking temporariamente indisponível.', 'Rankings temporarily unavailable.'), true);
  }
}

loadRankings();
setInterval(loadRankings, 60000);

document.querySelectorAll('.store-buy').forEach(button => button.addEventListener('click', async () => {
  const character = document.getElementById('character-name').value.trim();
  const email = document.getElementById('buyer-email').value.trim();
  const result = document.getElementById('store-result');
  result.classList.remove('is-visible');
  result.textContent = t('Gerando seu Pix...', 'Generating your PIX payment...');

  try {
    const response = await fetch('/api/create-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character, email, packageAmount: button.dataset.package })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível gerar o Pix.');
    result.innerHTML = `<strong>${t('Pix criado!', 'PIX payment created!')}</strong><p>${t('Aponte o app do banco para o QR Code ou copie o código abaixo:', 'Scan the QR code with your PIX-compatible banking app or copy the payment code below:')}</p><img class="pix-qr-code" src="data:image/png;base64,${data.qrCodeBase64 || ''}" alt="${t('QR Code para pagamento Pix', 'PIX payment QR code')}"><textarea readonly>${data.qrCode || ''}</textarea><p class="pix-delivery-warning">${t('Depois que o pagamento for aprovado, aguarde alguns segundos e entre novamente no jogo para receber suas Titan Coins.', 'After payment approval, wait a few seconds and log into the game again to receive your Titan Coins.')}</p>`;
    requestAnimationFrame(() => result.classList.add('is-visible'));
  } catch (error) {
    const errors = {
      'Informe um nome de personagem válido.': 'Enter a valid character name.',
      'Informe um e-mail válido.': 'Enter a valid email address.',
      'Pacote inválido.': 'Invalid coin package.',
      'MP_ACCESS_TOKEN não configurado.': 'Payments are currently unavailable. Please contact the team.'
    };
    result.textContent = english ? (errors[error.message] || 'Unable to create a PIX payment. Check your connection and details, then try again.') : error.message;
  }
}));
