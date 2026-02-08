function chooseChannel(client) {
  return client.hasWhatsApp ? 'WHATSAPP' : 'SMS';
}

export function createMessage({ client, kind, body }) {
  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    clientId: client.id,
    clientName: client.name,
    phone: client.phone,
    channel: chooseChannel(client),
    kind,
    body,
    sentAt: new Date().toISOString()
  };
}

export function buildPaymentReceiptMessage({ client, payment, invoice }) {
  return createMessage({
    client,
    kind: 'PAYMENT_RECEIPT',
    body: `Dear ${client.name}, we received payment of ${payment.amount} for invoice #${invoice.id}. Thank you.`
  });
}

export function buildReminderMessage({ client, invoice }) {
  return createMessage({
    client,
    kind: 'EMI_REMINDER',
    body: `Reminder: EMI for invoice #${invoice.id} is due on ${invoice.emiDueDate}. Please pay within 3 days.`
  });
}

export function buildInvoiceMessage({ client, invoice }) {
  return createMessage({
    client,
    kind: 'INVOICE_DISPATCH',
    body: `Invoice #${invoice.id} total ${invoice.total} sent as PDF via ${client.hasWhatsApp ? 'WhatsApp' : 'SMS link'}.`
  });
}

export function buildAdminMessage({ client, text }) {
  return createMessage({
    client,
    kind: 'ADMIN_BROADCAST',
    body: text
  });
}
