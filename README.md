# Mabrig Academic Assistance

Open-source MVP for Mabrig ICT & Academic Assistance: student ordering, academic support, document processing, printing, binding and campus delivery.

## MVP

- Student-facing Next.js storefront
- UNN Academic Writer for assignments, assessments, term papers and seminar papers with direct DOCX download
- File Converter for DOCX → PDF and PDF → editable DOCX, with 4MB upload validation and no intentional file persistence
- Cover Page Creator with live preview, UNN-oriented fields, four border themes and editable Word-native DOCX page borders
- Agentic verified-reference pipeline: research-query planning → Crossref DOI resolution → retraction/update screening → optional Semantic Scholar evidence enrichment → source scoring → student approval → claim-linked citations → deterministic bibliography
- Optional source-verification appendix records DOI, quality score, evidence level, metadata checks and retraction status for every cited source
- Order request form with protected, downloadable file retention (uploads up to 4MB)
- Academic submissions up to 100 pages
- UNN Undergraduate Project formatting preset with Times New Roman 12pt, 2.0 double spacing, justified body text, academic headings and hanging reference entries
- UNN academic-paper title page with faculty, department, course, student details, page numbering, optional abstract/TOC and lecturer-instruction override
- Order IDs
- Service catalogue
- Responsive mobile/desktop UI
- Admin order search, status filtering, original-file download and formatted Word generation
- APA 7 / MLA 9 reference layouts and empty-paragraph cleanup
- WhatsApp and Telegram admin notifications with the submitted document attached

## FileBridge — phone ↔ laptop

The **FileBridge** feature is available at `/filebridge`; `/file-transfer` redirects there. On the home page, the primary menu stays minimal: Academic Writer, File Converter, FileBridge, and **More** (all previous destinations remain accessible).

Two transfer methods are supported:

- **Direct browser-to-browser (recommended for files up to 100 MB each):** Open `/filebridge` on both the laptop and phone, create a temporary room on one device, and join using its eight-digit code or pairing link. The server stores only ephemeral WebRTC connection metadata in MongoDB; actual file bytes go via the encrypted WebRTC data channel and are held in the recipient browser until downloaded. Both devices must remain on the page with a working connection. No Cloudflare R2 bucket is required. Use the same Wi-Fi or hotspot; some restricted networks prevent peer-to-peer connections because the current version does **not** use a TURN relay.
- **Windows offline receiver:** Open the separately installed MABRIG FileBridge Windows EXE on the laptop. On the phone, open the local private IP address printed by the receiver (example: `http://192.168.1.10:8765`) or use the local-IP navigation box at the bottom of `/filebridge`. This mode supports larger transfers (up to 2 GB per file), is independent of the hosted site, and works without internet. Local HTTP is **not encrypted**; use private Wi-Fi only.

The browser-to-browser pairing API uses the existing server-only `MONGODB_URI` environment variable and an automatically expiring MongoDB collection. No new credentials, external file storage or public bucket are required. Rooms expire after 45 minutes, with brute-force throttling on pairing endpoints.

**Testing:** Check with two real devices. Verify link sharing, offer/answer pairing, a 1 MB photo or document sent both ways, download naming, expiry and disconnect. Android browsers may not automatically save incoming files: tap the **Download** link. The direct connection cannot be guaranteed across all firewalls or without server access.

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

For the verified-reference agent, `CROSSREF_MAILTO` is recommended for Crossref polite-pool identification. `SEMANTIC_SCHOLAR_API_KEY` is optional and improves the reliability of Semantic Scholar enrichment. The writer never constructs a bibliography from model-generated reference strings; citations are rendered from verified metadata.

For submission alerts, set the WhatsApp Cloud API variables and `ADMIN_WHATSAPP_NUMBER=2347065342818`. For Telegram, message your bot once, obtain the numeric chat ID, and set `TELEGRAM_BOT_TOKEN` plus `TELEGRAM_ADMIN_CHAT_ID`. The notification code never blocks order creation when a provider is unavailable.

## Academic integrity

The platform is designed for legitimate academic support such as tutoring, research assistance, editing, proofreading, formatting and document production. Students remain responsible for their own assessed submissions.

## License

MIT
