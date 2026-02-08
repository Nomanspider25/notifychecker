# NotifyChecker - Leon Bike Zone ERP + Notification App

This is a full-stack app (frontend + backend) for **M/S Leon Bike Zone**, now upgraded with a creative dashboard and real-time synchronization.

## Included business setup

- Business profile and contact info preloaded.
- ERP module catalog preloaded:
  - Inventory/Product/Service Sales/Purchase/Sales Return/Purchase Return
  - Pre-order/Quotation/BRTA registration
  - Voucher + accounting reports
  - Users/customers/suppliers/staff
  - HR & payroll features
- Client management with WhatsApp preference.
- Invoice creation with EMI due date.
- Automatic dispatch logic:
  - WhatsApp channel for clients with WhatsApp
  - SMS channel for clients without WhatsApp
- EMI reminder engine for **3 days before due date**.
- Payment entry + automatic payment receipt message.
- Admin panel action to send custom message to any client.

## New real-time upgrades

- **Server-Sent Events** stream (`/api/events`) for instant dashboard updates.
- **Auto scheduler** runs reminder engine every minute so reminders work anytime.
- **Duplicate-safe reminder creation** for the same invoice and 3-day trigger.
- **Live KPI dashboard** with sales, open invoices, message count, and client totals.
- **Creative modern UI** with dark-gradient visual design.

## Tech stack

- Node.js + Express backend
- File-based JSON persistence (`data/db.json`)
- Vanilla JS frontend (`public/`)

## Run

```bash
npm install
npm start
```

Open `http://localhost:3000`

## Core API

- `GET /api/bootstrap`
- `GET /api/events`
- `POST /api/clients`
- `POST /api/invoices`
- `POST /api/payments`
- `POST /api/reminders/run`
- `POST /api/messages/admin`
