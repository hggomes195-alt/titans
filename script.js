const button = document.querySelector('.menu-button');
const navigation = document.querySelector('.nav-links');
button.addEventListener('click', () => {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  navigation.classList.toggle('open');
});
document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => navigation.classList.remove('open')));
document.getElementById('year').textContent = new Date().getFullYear();

document.querySelectorAll('.store-buy').forEach(button => button.addEventListener('click', async () => {
  const character = document.getElementById('character-name').value.trim();
  const email = document.getElementById('buyer-email').value.trim();
  const result = document.getElementById('store-result');
  result.textContent = 'Gerando seu Pix...';

  try {
    const response = await fetch('/api/create-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character, email, packageAmount: button.dataset.package })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível gerar o Pix.');
    result.innerHTML = `<strong>Pix criado!</strong><p>Copie o código abaixo para pagar:</p><textarea readonly>${data.qrCode || ''}</textarea>`;
  } catch (error) {
    result.textContent = error.message;
  }
}));
