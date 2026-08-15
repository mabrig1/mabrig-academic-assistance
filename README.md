# Mabrig Academic Assistance

Open-source MVP for Mabrig ICT & Academic Assistance: student ordering, academic support, document processing, printing, binding and campus delivery.

## MVP

- Student-facing Next.js storefront
- Order request form with file attachment
- Order IDs
- Service catalogue
- Responsive mobile/desktop UI
- Integration-ready environment variables for Paystack, WhatsApp, Telegram, AI and object storage

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

## Academic integrity

The platform is designed for legitimate academic support such as tutoring, research assistance, editing, proofreading, formatting and document production. Students remain responsible for their own assessed submissions.

## License

MIT
