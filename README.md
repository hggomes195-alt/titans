# Site oficial — Titans Tatics

Site estático: basta publicar a pasta `site` no GitHub Pages, Netlify ou Cloudflare Pages.

## Mercado Pago no Render

O site agora também pode ser executado pelo backend Node.js deste diretório. No Render, crie um Web Service conectado ao repositório e use:

- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Root Directory:** `site` (se o repositório tiver outras pastas)

Em **Environment**, adicione as variáveis `MP_ACCESS_TOKEN` e `PUBLIC_URL`. Use como `PUBLIC_URL` a URL HTTPS fornecida pelo Render, sem barra no final. Nunca publique o token no GitHub ou em arquivos do site.

O endpoint de webhook usado pelo pagamento é `https://seu-dominio/api/webhook`. O webhook apenas confirma o pagamento nesta primeira etapa; a entrega do gift no servidor do jogo ainda precisa ser ligada à fila de recompensas.

## Antes de publicar

- Em `index.html`, troque os links `href="#"` de Discord, Facebook e Instagram pelos links oficiais.
- O botão **Baixar Titans Tatics** usa a página de releases do GitHub do launcher.
- Para GitHub Pages: envie estes arquivos para um repositório, abra **Settings > Pages**, selecione a branch `main` e a pasta `/ (root)`.
