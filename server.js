import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const app = express();
const port = process.env.PORT || 3000;
const publicUrl = process.env.PUBLIC_URL || '';
const accessToken = process.env.MP_ACCESS_TOKEN?.trim();
const gameSyncToken = process.env.GAME_SYNC_TOKEN?.trim();
const rewardsFile = path.join(process.cwd(), 'data', 'rewards.json');
const rankingsFile = path.join(process.cwd(), 'data', 'rankings.json');

const packages = new Map([
  [5, { coins: 5, price: 5.00 }],
  [10, { coins: 10, price: 10.00 }],
  [30, { coins: 30, price: 30.00 }],
  [50, { coins: 50, price: 50.00 }]
]);

app.use(express.json());
app.use(express.static('.'));

async function readRewards() {
  try {
    return JSON.parse(await fs.readFile(rewardsFile, 'utf8'));
  } catch {
    return [];
  }
}

async function saveRewards(rewards) {
  await fs.mkdir(path.dirname(rewardsFile), { recursive: true });
  await fs.writeFile(rewardsFile, JSON.stringify(rewards, null, 2));
}

async function readRankings() {
  try {
    return JSON.parse(await fs.readFile(rankingsFile, 'utf8'));
  } catch {
    return { pvp: [], guilds: [], updatedAt: null };
  }
}

async function saveRankings(rankings) {
  await fs.mkdir(path.dirname(rankingsFile), { recursive: true });
  await fs.writeFile(rankingsFile, JSON.stringify(rankings, null, 2));
}

app.post('/api/create-pix', async (request, response) => {
  if (!accessToken) return response.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado.' });

  const { character, email, packageAmount } = request.body;
  const normalizedCharacter = String(character || '').trim();
  const normalizedEmail = String(email || '').trim();
  const selectedPackage = packages.get(Number(packageAmount));

  if (!/^[a-zA-Z0-9_-]{3,24}$/.test(normalizedCharacter)) {
    return response.status(400).json({ error: 'Informe um nome de personagem válido.' });
  }
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return response.status(400).json({ error: 'Informe um e-mail válido.' });
  }
  if (!selectedPackage) return response.status(400).json({ error: 'Pacote inválido.' });

  try {
    const orderId = crypto.randomUUID();
    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);
    const result = await payment.create({
      body: {
        transaction_amount: selectedPackage.price,
        description: `${selectedPackage.coins} Titan Coins - Titans Tatics`,
        payment_method_id: 'pix',
        payer: { email: normalizedEmail },
        external_reference: JSON.stringify({ orderId, character: normalizedCharacter, coins: selectedPackage.coins }),
        notification_url: publicUrl ? `${publicUrl}/api/webhook` : undefined
      },
      requestOptions: { idempotencyKey: orderId }
    });

    response.json({
      orderId,
      paymentId: result.id,
      qrCode: result.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64
    });
  } catch (error) {
    console.error('Erro ao criar Pix:', {
      message: error.message,
      status: error.status,
      cause: error.cause
    });
    response.status(502).json({ error: 'Não foi possível criar o Pix.' });
  }
});

app.post('/api/webhook', async (request, response) => {
  response.sendStatus(200);
  const paymentId = request.body?.data?.id || request.query['data.id'];
  if (!accessToken || !paymentId) return;

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);
    const result = await payment.get({ id: paymentId });
    if (result.status === 'approved') {
      const reference = JSON.parse(result.external_reference || '{}');
      const selectedPackage = packages.get(Number(reference.coins));
      if (!selectedPackage || Number(result.transaction_amount) !== selectedPackage.price) {
        console.error('Pagamento aprovado com pacote ou valor divergente:', paymentId);
        return;
      }
      const rewards = await readRewards();
      if (!rewards.some(reward => String(reward.paymentId) === String(paymentId))) {
        rewards.push({
          paymentId: String(paymentId),
          orderId: reference.orderId,
          character: reference.character,
          coins: selectedPackage.coins,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
        await saveRewards(rewards);
      }
      console.log('Pagamento aprovado. Recompensa pendente:', paymentId);
    }
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error.message);
  }
});

app.get('/api/rewards', async (request, response) => {
  if (!gameSyncToken || request.get('x-game-token') !== gameSyncToken) {
    return response.sendStatus(401);
  }
  const rewards = await readRewards();
  response.json(rewards.filter(reward => reward.status === 'pending'));
});

app.post('/api/rewards/:paymentId/claim', async (request, response) => {
  if (!gameSyncToken || request.get('x-game-token') !== gameSyncToken) {
    return response.sendStatus(401);
  }
  const rewards = await readRewards();
  const reward = rewards.find(item => String(item.paymentId) === String(request.params.paymentId));
  if (!reward) return response.status(404).json({ error: 'Recompensa não encontrada.' });
  reward.status = 'claimed';
  reward.claimedAt = new Date().toISOString();
  await saveRewards(rewards);
  response.sendStatus(204);
});

app.get('/api/rankings', async (request, response) => {
  response.json(await readRankings());
});

app.post('/api/rankings/sync', async (request, response) => {
  if (!gameSyncToken || request.get('x-game-token') !== gameSyncToken) {
    return response.sendStatus(401);
  }
  const { pvp, guilds } = request.body || {};
  if (!Array.isArray(pvp) || !Array.isArray(guilds)) {
    return response.status(400).json({ error: 'Formato de ranking inválido.' });
  }
  await saveRankings({ pvp: pvp.slice(0, 10), guilds: guilds.slice(0, 10), updatedAt: new Date().toISOString() });
  response.sendStatus(204);
});

app.listen(port, () => console.log(`Site online na porta ${port}`));
