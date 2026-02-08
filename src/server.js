import express from 'express';
import path from 'node:path';
import { readDb, writeDb, nextId } from './store.js';
import {
  buildAdminMessage,
  buildInvoiceMessage,
  buildPaymentReceiptMessage,
  buildReminderMessage
} from './notifications.js';

const app = express();
const eventClients = new Set();

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

function broadcast(event, payload) {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of eventClients) {
    client.write(data);
  }
}

function saveDbAndBroadcast(db, reason) {
  writeDb(db);
  broadcast('db:update', { reason, at: new Date().toISOString() });
}

function runReminderEngine(source = 'manual') {
  const db = readDb();
  const now = new Date();

  const generated = [];
  for (const invoice of db.invoices) {
    if (!invoice.emiDueDate || invoice.status === 'PAID') continue;

    const due = new Date(invoice.emiDueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diffDays !== 3) continue;

    const alreadyCreated = db.reminders.some((item) => item.invoiceId === invoice.id && item.diffDays === 3);
    if (alreadyCreated) continue;

    const client = db.clients.find((item) => item.id === invoice.clientId);
    if (!client) continue;

    const message = buildReminderMessage({ client, invoice });
    db.reminders.push({
      id: nextId(db.reminders),
      invoiceId: invoice.id,
      messageId: message.id,
      diffDays: 3,
      source,
      createdAt: message.sentAt
    });
    db.messages.push(message);
    generated.push(message);
  }

  if (generated.length > 0) {
    saveDbAndBroadcast(db, 'reminder_engine');
  }

  return generated;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, now: new Date().toISOString() }));

app.get('/api/bootstrap', (_req, res) => {
  const db = readDb();
  res.json({
    businessProfile: db.businessProfile,
    modules: db.modules,
    clients: db.clients,
    invoices: db.invoices,
    payments: db.payments,
    reminders: db.reminders,
    messages: db.messages
  });
});

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  eventClients.add(res);

  req.on('close', () => {
    eventClients.delete(res);
  });
});

app.post('/api/clients', (req, res) => {
  const { name, phone, hasWhatsApp, type = 'regular' } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' });

  const db = readDb();
  const client = { id: nextId(db.clients), name, phone, hasWhatsApp: Boolean(hasWhatsApp), type };
  db.clients.push(client);
  saveDbAndBroadcast(db, 'client_created');
  return res.status(201).json(client);
});

app.post('/api/invoices', (req, res) => {
  const { clientId, total, emiDueDate } = req.body;
  const db = readDb();
  const client = db.clients.find((item) => item.id === Number(clientId));
  if (!client) return res.status(404).json({ error: 'client not found' });

  const invoice = {
    id: nextId(db.invoices),
    clientId: client.id,
    total: Number(total || 0),
    emiDueDate,
    createdAt: new Date().toISOString(),
    status: 'OPEN'
  };
  db.invoices.push(invoice);

  db.messages.push(buildInvoiceMessage({ client, invoice }));
  saveDbAndBroadcast(db, 'invoice_created');
  return res.status(201).json(invoice);
});

app.post('/api/payments', (req, res) => {
  const { invoiceId, amount, method = 'cash' } = req.body;
  const db = readDb();
  const invoice = db.invoices.find((item) => item.id === Number(invoiceId));
  if (!invoice) return res.status(404).json({ error: 'invoice not found' });

  const client = db.clients.find((item) => item.id === Number(invoice.clientId));
  const payment = {
    id: nextId(db.payments),
    invoiceId: invoice.id,
    amount: Number(amount || 0),
    method,
    paidAt: new Date().toISOString()
  };

  db.payments.push(payment);
  const totalPaid = db.payments
    .filter((item) => item.invoiceId === invoice.id)
    .reduce((sum, item) => sum + item.amount, 0);
  if (totalPaid >= invoice.total) invoice.status = 'PAID';

  db.messages.push(buildPaymentReceiptMessage({ client, payment, invoice }));
  saveDbAndBroadcast(db, 'payment_recorded');
  return res.status(201).json(payment);
});

app.post('/api/reminders/run', (_req, res) => {
  const generated = runReminderEngine('manual');
  return res.json({ generated: generated.length, messages: generated });
});

app.post('/api/messages/admin', (req, res) => {
  const { clientId, text } = req.body;
  const db = readDb();
  const client = db.clients.find((item) => item.id === Number(clientId));
  if (!client) return res.status(404).json({ error: 'client not found' });
  if (!text) return res.status(400).json({ error: 'text is required' });

  const message = buildAdminMessage({ client, text });
  db.messages.push(message);
  saveDbAndBroadcast(db, 'admin_message');
  return res.status(201).json(message);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`NotifyChecker running at http://localhost:${port}`);
});

setInterval(() => {
  runReminderEngine('auto_scheduler');
}, 60 * 1000);
