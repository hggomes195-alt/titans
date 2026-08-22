# Site oficial — Titans Tatics

Site estático: basta publicar a pasta `site` no GitHub Pages, Netlify ou Cloudflare Pages.

## Mercado Pago no Render

O site agora também pode ser executado pelo backend Node.js deste diretório. No Render, crie um Web Service conectado ao repositório e use:

- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Root Directory:** `site` (se o repositório tiver outras pastas)

Em **Environment**, adicione `MP_ACCESS_TOKEN`, `PUBLIC_URL` e `GAME_SYNC_TOKEN`. Crie uma senha longa e aleatória para `GAME_SYNC_TOKEN`; ela será usada somente pelo servidor do jogo para consultar recompensas. Use como `PUBLIC_URL` a URL HTTPS fornecida pelo Render, sem barra no final. Nunca publique tokens no GitHub ou em arquivos do site.

O endpoint de webhook usado pelo pagamento é `https://seu-dominio/api/webhook`. O servidor do jogo consulta recompensas pendentes em `GET /api/rewards` enviando o cabeçalho `x-game-token`. A entrega e a confirmação de processamento no servidor do jogo ainda precisam ser ligadas à fila.

## Antes de publicar

- Em `index.html`, troque os links `href="#"` de Discord, Facebook e Instagram pelos links oficiais.
- O botão **Baixar Titans Tatics** usa a página de releases do GitHub do launcher.
- Para GitHub Pages: envie estes arquivos para um repositório, abra **Settings > Pages**, selecione a branch `main` e a pasta `/ (root)`.
