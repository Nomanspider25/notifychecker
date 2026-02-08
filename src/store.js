import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const defaultDb = {
  businessProfile: {
    name: 'M/S LEON BIKE ZONE',
    proprietor: 'Md. Shahidul Islam',
    manager: 'Md. Nahiduzzaman Leon',
    phone: {
      proprietor: '01719044095',
      leon: '01796474059',
      showroom: '01778728873'
    },
    address: 'Natun Chowpathi, Bus Stand Degree College Gate, Taraganj Rangpur'
  },
  modules: [
    'Inventory management',
    'Product management',
    'Services sales management',
    'Purchases management',
    'Sales management',
    'Sales returns',
    'Purchases returns',
    'Pre-order',
    'Quotation',
    'BRTA registration',
    'Receipt voucher',
    'Payment voucher',
    'Contra voucher',
    'Journal voucher',
    'Accounting groups & Ledgers',
    'Particulars',
    'Chart of accounts',
    'Journal entry',
    'Balance sheet',
    'Profit loss A/C',
    'Trial balance',
    'General ledger',
    'Voucher ledger',
    'Users customers suppliers staff',
    'HR & Payroll',
    'Leave day setup',
    'Leave apply',
    'Leave apply list',
    'Festival bonus setup',
    'Performance bonus setup',
    'Working days setup',
    'Office time setup'
  ],
  clients: [],
  invoices: [],
  payments: [],
  reminders: [],
  messages: []
};

function ensureDbFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
}

export function readDb() {
  ensureDbFile();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

export function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function nextId(items) {
  if (items.length === 0) return 1;
  return Math.max(...items.map((item) => Number(item.id))) + 1;
}
