# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server on http://localhost:8080
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

No test suite is configured.

## Architecture

This is a multi-step client intake form (שאלון קבלת לקוח) for Chasida Tax Advisory. Built with React + TypeScript + Vite, using shadcn/ui components and Tailwind CSS.

### Form Flow

Steps are numbered 1–5 internally but the step components are named Step0–Step4:

| `currentStep` | Component | Title |
|---|---|---|
| 1 | `Step0Welcome` | ככה מתחילים לנגן |
| 2 | `Step1Purpose` | המטרה המשותפת |
| 3 | `Step2PersonalInfo` | מידע נחוץ |
| 4 | `Step3Documents` | עדכון מסמכים |
| 5 | `Step4Completion` | סיום |

### State Management

All form state lives in `src/contexts/FormContext.tsx` via a single `FormProvider`. The context holds:

- `personalInfo` — name, phone, email, marital status, consents
- `serviceType` — selected purposes (business / company / nonprofit / tax_refund / war_compensation / other) with new/existing sub-status for user and spouse separately
- `detailedInfo` / `spouseInfo` — ID numbers, birth dates, gov portal credentials
- `businessInfo` / `spouseBusinessInfo` — sole proprietor or partnership details, company details
- `nonprofitInfo` / `spouseNonprofitInfo` — board members, objectives, etc.
- `documentsInfo` — uploaded files
- `feedbackInfo` — meeting scheduling, notifications

All state auto-saves to `sessionStorage` on every change (Files are stripped before saving since they can't be serialized). On mount, state is restored from `sessionStorage`.

### Data Submission (Webhook)

`sendToWebhook(url, data, options?)` in `FormContext` sends data to n8n automation webhooks. For n8n.link-up.co.il and n8n.chasida.biz URLs, it proxies through a Supabase Edge Function (`n8n-proxy`) instead of calling the webhook directly.

### External Integrations

- **Supabase** — `src/integrations/supabase/client.ts` (auto-generated, do not edit). Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` env vars. Used for the n8n proxy Edge Function.
- **n8n** — automation platform receiving webhook data at two domains: `n8n.link-up.co.il` and `n8n.chasida.biz`.

### Layout

`FormLayout` wraps all steps and provides:
- Desktop: left sidebar with step progress + right panel with `OwnershipTree` and mascot image
- Mobile: top sticky progress bar + floating "לתשומת ליבכם" attention button
- "לתשומת ליבכם" modal with legal disclaimers
- Fixed footer crediting LinkUp

`OwnershipTree` (`src/components/OwnershipTree.tsx`) renders a visual tree of the client's business/entity ownership based on selections in `serviceType`.

### Path Aliases

`@/` maps to `src/`. UI primitives are in `src/components/ui/` (shadcn/ui, do not edit directly).

### Production Base Path

In production mode, the app is served under `/newclient` (configured in `App.tsx` `basename`).
