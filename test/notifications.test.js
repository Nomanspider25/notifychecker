import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInvoiceMessage, buildReminderMessage } from '../src/notifications.js';

test('buildInvoiceMessage uses WhatsApp channel when available', () => {
  const message = buildInvoiceMessage({
    client: { id: 1, name: 'Rahim', phone: '0171', hasWhatsApp: true },
    invoice: { id: 3, total: 1000 }
  });

  assert.equal(message.channel, 'WHATSAPP');
  assert.equal(message.kind, 'INVOICE_DISPATCH');
});

test('buildReminderMessage uses SMS channel when WhatsApp unavailable', () => {
  const message = buildReminderMessage({
    client: { id: 2, name: 'Karim', phone: '0181', hasWhatsApp: false },
    invoice: { id: 4, emiDueDate: '2026-01-15' }
  });

  assert.equal(message.channel, 'SMS');
  assert.equal(message.kind, 'EMI_REMINDER');
});
