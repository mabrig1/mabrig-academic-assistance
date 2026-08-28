# Mabrig Academic Assistance

Open-source MVP for Mabrig ICT & Academic Assistance: student ordering, academic support, document processing, printing, binding and campus delivery.

## MVP

- Student-facing Next.js storefront
- Order request form with protected, downloadable file retention (uploads up to 4MB)
- Academic submissions up to 100 pages
- UNN Undergraduate Project formatting preset with Times New Roman 12pt, 1.5 spacing, justified body text, academic headings and hanging reference entries
- Order IDs
- Service catalogue
- Responsive mobile/desktop UI
- Admin order search, status filtering, original-file download and formatted Word generation
- APA 7 / MLA 9 reference layouts and empty-paragraph cleanup
- WhatsApp and Telegram admin notifications with the submitted document attached

## Roadmap

1. PostgreSQL + Prisma/Drizzle persistence
2. Paystack checkout and verified webhooks
3. WhatsApp Business Cloud API
4. Telegram bot
5. Student/admin authentication
6. Worker assignment dashboard
7. Printing and binding workflow
8. UNN campus delivery zones and rider tracking
9. Notifications and order tracking
10. AI customer, pricing, operations and quality-assurance agents
11. Referral system and opt-in student CRM

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Copy `.env.example` to `.env.local` when integrations are added. Never commit real API keys.

For submission alerts, set the WhatsApp Cloud API variables and `ADMIN_WHATSAPP_NUMBER=2347065342818`. For Telegram, message your bot once, obtain the numeric chat ID, and set `TELEGRAM_BOT_TOKEN` plus `TELEGRAM_ADMIN_CHAT_ID`. The notification code never blocks order creation when a provider is unavailable.

## Academic integrity

The platform is designed for legitimate academic support such as tutoring, research assistance, editing, proofreading, formatting and document production. Students remain responsible for their own assessed submissions.

## License

MIT
