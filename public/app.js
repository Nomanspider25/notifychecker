async function fetchBootstrap() {
  const response = await fetch('/api/bootstrap');
  return response.json();
}

function optionHtml(value, label) {
  return `<option value="${value}">${label}</option>`;
}

function renderKpi(state) {
  const openInvoices = state.invoices.filter((item) => item.status !== 'PAID').length;
  const totalSales = state.invoices.reduce((sum, item) => sum + Number(item.total), 0);

  document.getElementById('kpi-clients').textContent = state.clients.length;
  document.getElementById('kpi-open-invoices').textContent = openInvoices;
  document.getElementById('kpi-sales').textContent = totalSales.toFixed(2);
  document.getElementById('kpi-messages').textContent = state.messages.length;
}

function render(state) {
  document.getElementById('biz-name').textContent = state.businessProfile.name;
  document.getElementById('biz-meta').textContent = `Pro: ${state.businessProfile.proprietor} | Managed by: ${state.businessProfile.manager}`;
  document.getElementById('biz-address').textContent = state.businessProfile.address;

  document.getElementById('module-list').innerHTML = state.modules.map((item) => `<li>${item}</li>`).join('');

  const clientOptions = state.clients.map((item) => optionHtml(item.id, `${item.name} (${item.phone})`)).join('');
  document.getElementById('invoice-client').innerHTML = clientOptions;
  document.getElementById('message-client').innerHTML = clientOptions;

  const invoiceOptions = state.invoices
    .map((item) => optionHtml(item.id, `Invoice #${item.id} | client ${item.clientId} | total ${item.total} | ${item.status}`))
    .join('');
  document.getElementById('payment-invoice').innerHTML = invoiceOptions;

  document.getElementById('message-log').innerHTML = state.messages
    .slice()
    .reverse()
    .map((m) => `<li><b>${m.kind}</b> → ${m.clientName} (${m.channel}) : ${m.body}</li>`)
    .join('');

  renderKpi(state);
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function refresh() {
  const state = await fetchBootstrap();
  render(state);
}

function bindForms() {
  document.getElementById('client-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await postJson('/api/clients', {
      name: formData.get('name'),
      phone: formData.get('phone'),
      hasWhatsApp: formData.get('hasWhatsApp') === 'on',
      type: formData.get('type')
    });
    event.target.reset();
    await refresh();
  });

  document.getElementById('invoice-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await postJson('/api/invoices', {
      clientId: Number(formData.get('clientId')),
      total: Number(formData.get('total')),
      emiDueDate: formData.get('emiDueDate')
    });
    event.target.reset();
    await refresh();
  });

  document.getElementById('payment-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await postJson('/api/payments', {
      invoiceId: Number(formData.get('invoiceId')),
      amount: Number(formData.get('amount'))
    });
    event.target.reset();
    await refresh();
  });

  document.getElementById('admin-message-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await postJson('/api/messages/admin', {
      clientId: Number(formData.get('clientId')),
      text: formData.get('text')
    });
    event.target.reset();
    await refresh();
  });

  document.getElementById('run-reminders').addEventListener('click', async () => {
    await postJson('/api/reminders/run', {});
    await refresh();
  });
}

function bindLiveUpdates() {
  const note = document.getElementById('sync-note');
  const events = new EventSource('/api/events');

  events.addEventListener('connected', () => {
    note.textContent = 'Live channel connected.';
  });

  events.addEventListener('db:update', async () => {
    note.textContent = `Synced at ${new Date().toLocaleTimeString()}`;
    await refresh();
  });

  events.onerror = () => {
    note.textContent = 'Live channel reconnecting...';
  };
}

function bindClock() {
  const clock = document.getElementById('clock');
  const tick = () => {
    clock.textContent = new Date().toLocaleString();
  };

  tick();
  setInterval(tick, 1000);
}

bindForms();
bindLiveUpdates();
bindClock();
refresh();
