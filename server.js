import crypto from 'node:crypto';
import express from 'express';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const app = express();
const port = process.env.PORT || 3000;
const publicUrl = process.env.PUBLIC_URL || '';
const accessToken = process.env.MP_ACCESS_TOKEN;

const packages = new Map([
  [500, { gold: 500, price: 5.00 }],
  [1000, { gold: 1000, price: 10.00 }],
  [5500, { gold: 5500, price: 50.00 }]
]);

app.use(express.json());
app.use(express.static('.'));

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
        description: `${selectedPackage.gold} Gold - Titans Tatics`,
        payment_method_id: 'pix',
        payer: { email: normalizedEmail },
        external_reference: JSON.stringify({ orderId, character: normalizedCharacter, gold: selectedPackage.gold }),
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
      console.log('Pagamento aprovado. Entrega pendente:', result.external_reference);
      // Próximo passo: enviar esta recompensa para a fila consumida pelo servidor do jogo.
    }
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error.message);
  }
});

app.listen(port, () => console.log(`Site online na porta ${port}`));
