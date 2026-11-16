# KhelaBD Admin Panel

A separate Next.js 16 app for running the KhelaBD store, built with TypeScript, Ant Design 6 and Axios.
It's deployed on its own (for example `admin.khelabd.com`) and talks to the **same backend** as the storefront.

Right now it runs on realistic demo data saved in your browser, so every screen works before the API exists.
When the backend is ready you set **one environment variable**.

---

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3001  (storefront runs on :3000)
```

Production: `npm run build && npm start`.

**Demo accounts** (shown on the login page while demo mode is on):

| Role | Email | Password |
|---|---|---|
| Super admin | admin@khelabd.com | Admin@123 |
| Manager | manager@khelabd.com | Manager@123 |
| Support | support@khelabd.com | Support@123 |

---

## What you can manage

| Area | Features |
|---|---|
| **Dashboard** | Revenue, orders, average order value and new customers vs. the previous period; revenue/orders chart (7 / 30 / 90 days / custom); orders by status; payment-method split; top products; stock alerts; recent orders |
| **Orders** | Filter by status, payment method, payment status, date range; search by order #, name, phone, TrxID or tracking ID; step-by-step workflow (Pending → Confirmed → Processing → Shipped → Delivered, or Cancel with reason); courier assignment (Pathao, Steadfast, RedX, Sundarban, eCourier, Paperfly, own rider); payment status updates; internal notes; full timeline showing who did what; printable invoice; CSV export |
| **Products** | Search and filter (category, status, low/out of stock); sort; bulk publish/draft/archive, add to or remove from flash sale, delete; create/edit with image upload (reorder, cover image), sizes, colours, highlights, specifications, SKU, stock, price vs. compare-at price, featured/new/flash-sale flags; unsaved-changes warning; CSV export |
| **Categories / Brands** | Create, edit and delete; renaming a slug or brand updates its products; deleting is blocked while products still use it |
| **Customers** | Search, sort by spend or orders, profile with order history, block/unblock (for repeated fake COD orders), CSV export |
| **Coupons** | Percentage, fixed amount or free delivery; minimum order, usage limit, expiry date, on/off toggle |
| **Reviews** | Moderation queue: publish, hide or delete, including in bulk |
| **Settings** | Store info, announcement bar, delivery charges (inside/outside Dhaka, free-delivery threshold), turn each payment method on/off, COD maximum order value, low-stock threshold, flash-sale end time, maintenance mode |
| **Staff & roles** | Add or disable staff, assign roles, reset passwords, permission matrix |

### Roles

| | Super admin | Manager | Support |
|---|:-:|:-:|:-:|
| Dashboard, view orders/products/customers | ✓ | ✓ | ✓ |
| Process orders, moderate reviews | ✓ | ✓ | ✓ |
| Edit products, categories, brands, coupons, block customers | ✓ | ✓ | |
| Store settings, staff management | ✓ | | |

Defined in `src/config/permissions.ts`. Menus, pages and buttons hide automatically for each role.
**Your backend must enforce the same rules**: the UI check is only for convenience. In demo mode the
mock services enforce them too, so you can see the expected 403 behaviour.

---

## Connecting your real API

1. In `.env.local`, set `NEXT_PUBLIC_API_BASE_URL` and set **`NEXT_PUBLIC_USE_MOCK_API=false`**.
2. In `src/config/api.ts`, adjust the endpoint paths (all under `/admin/*`) to match your backend.
3. If your response envelope differs, edit `unwrapResponse()` in `src/lib/api/client.ts`.

Each service (`src/services/*.ts`) has the real Axios call next to a demo implementation, so pages never change.
The demo implementations also document the business rules the backend should follow:

- Status changes must follow `STATUS_FLOW` (`src/config/site.ts`), and an order can't be marked shipped without a courier.
- When a COD order is delivered, its payment is marked paid automatically.
- When an order is cancelled, its items go back into stock.
- Slugs, SKUs, coupon codes and staff emails must be unique. Return `422` with `{ errors: { field: "message" } }` and the form highlights the field.
- A category or brand that still has products can't be deleted (`409`).
- The store must always have at least one active super admin, and staff can't deactivate or delete themselves.

The full list of request/response shapes is in `src/types/admin.ts` and the comments in `src/config/api.ts`.

**Image uploads:** `POST /admin/uploads` (multipart, field `file`) → `{ url }`. Images are resized to at most 1000 px
and converted to WebP in the browser first. This also strips EXIF/GPS data. Add your CDN host to `images.remotePatterns`
and the CSP `img-src` in `next.config.ts`.

### Storefront integration

Product, category, coupon and order changes reach the storefront automatically once both apps use the same backend.
To make **settings** take effect too (delivery charges, enabled payment methods, announcement, maintenance mode,
flash-sale timer), expose a public `GET /settings` and have the storefront read it instead of its static
`src/config/site.ts`.

---

## Security

**Built in**
- **Separate app and session.** The admin runs on its own origin with its own cookie (`ADMIN_COOKIE_NAME`), so a storefront XSS can't reach admin cookies.
- Every route except `/login` is protected by `src/proxy.ts`. The session is re-validated with `GET /admin/auth/me` on load, so role changes and disabled accounts take effect immediately. Any `401` from the API signs the user out.
- **Idle timeout:** automatic sign-out after `NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES` minutes of inactivity (default 30). This protects shared shop computers.
- **Login protection:** a generic "invalid email or password" message (no account enumeration), a 60-second lockout after 5 failed attempts in the browser, and only internal paths allowed as `?redirect=` targets.
- Strong password policy for staff (10+ characters with upper and lower case, a number and a symbol).
- Strict headers: CSP, `X-Frame-Options: DENY`, HSTS, `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex`, `Cache-Control: private, no-store`. `robots.txt` disallows everything.
- Cookie auth with automatic CSRF header. Bearer tokens, if used, are kept in memory only.
- Confirmation dialogs on every destructive action.
- Input length limits, validation and sanitisation; user content such as reviews is always rendered as text, never HTML.
- **CSV export protects against formula injection:** cells starting with `= + - @` are escaped.
- Upload checks on file type and size.
- Payment gateway secrets never appear in the panel; they belong in server configuration.

**Your backend must also**
- Set the admin cookie as `HttpOnly; Secure; SameSite=Strict`, scoped to the admin domain, with a short lifetime.
- Rate-limit `/admin/auth/login`. Consider 2FA (TOTP) for super admins, and IP allow-listing if staff work from fixed locations.
- Check the role/permission on **every** `/admin/*` endpoint and write an audit log (the order timeline is a good start).
- Validate uploads on the server (check the file's magic bytes, re-encode, store on a separate CDN domain).

---

## Project structure

```
src/
  app/login/                 Sign-in page
  app/(panel)/               All authenticated pages (dashboard, orders, products, …)
  components/shell/          Sidebar layout, session/idle handling, change password
  components/charts/         Lightweight SVG area chart + bar list (no chart library)
  components/products/       Product form + image uploader
  config/api.ts              ← base URL, mock switch, all /admin endpoints
  config/permissions.ts      Roles → permissions, route guards
  config/site.ts             Payment methods, order/payment statuses, status workflow
  lib/api/                   Axios client, error normalisation, mock switch
  lib/utils.ts               BDT formatting, validation, CSV export, image resizing
  mocks/                     Demo database (localStorage) + sample catalogue
  services/                  One file per area: real API call + demo version
  types/index.ts             Domain types shared with the storefront (keep in sync)
  types/admin.ts             Admin-only types
```

The domain types in `src/types/index.ts` are a copy of the storefront's. If they start to drift, move both apps into a
monorepo (npm workspaces or Turborepo) with a shared `types` package.
