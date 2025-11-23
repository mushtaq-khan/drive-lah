# Voucher & Promotion Service

Backend assessment built with NestJS, TypeORM, and PostgreSQL to manage vouchers, promotions, and rule-based discount application on orders.

## Features
- CRUD APIs for vouchers and promotions with validation rules (expiry, usage limits, min order value, eligible categories/items).
- Soft delete on vouchers/promotions so inactive codes are hidden but retain historical references.
- Apply endpoint that enforces business constraints:
  - Prevents reuse of the same code within one order.
  - Rejects expired or fully-used discounts.
  - Validates minimum order value and eligible products/categories.
  - Caps combined discounts to 50% (configurable) of the order total.
- Order persistence with line items and audit of applied vouchers/promotions.
- Swagger UI for live API documentation (`/docs`).

## Tech Stack
- **Runtime:** Node.js 20+ / NestJS 11
- **Database:** PostgreSQL (TypeORM with auto-loaded entities)
- **Validation & Docs:** class-validator / class-transformer / Swagger

## Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   Copy `.env.example` to `.env` and update DB credentials (local Postgres or a managed instance such as ElephantSQL/Supabase).
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=postgres
   DATABASE_PASSWORD=postgres
   DATABASE_NAME=voucher_service
   DATABASE_SSL=false
   MAX_DISCOUNT_PERCENT=50
   ```
3. **Run the service**
   ```bash
   # development
   npm run start:dev

   # production
   npm run start:prod
   ```
4. **Swagger docs**: visit `http://localhost:3000/docs` (global API prefix `/api`).

## Testing & Linting
```bash
npm run lint
npm run test
```

## API Overview
| Area | Endpoint | Description |
| --- | --- | --- |
| Vouchers | `POST /api/vouchers` | Create voucher (auto generates code if omitted). |
|  | `GET /api/vouchers` | List all vouchers. |
|  | `GET /api/vouchers/available` | List only non-expired, under-limit vouchers. |
|  | `PATCH /api/vouchers/:id` | Update voucher fields. |
|  | `DELETE /api/vouchers/:id` | Soft delete (hard delete) voucher. |
| Promotions | `POST /api/promotions` | Create promotion with eligible categories/items. |
|  | `GET /api/promotions` | List all promotions. |
|  | `GET /api/promotions/available` | List promotions still valid. |
|  | `PATCH /api/promotions/:id` | Update promotion details. |
|  | `DELETE /api/promotions/:id` | Delete promotion. |
| Orders | `POST /api/orders/apply` | Apply voucher/promotion to an order, returns discount + summary. |

Request/response schemas are available in Swagger and easily exportable to Postman.

## Business Rules Recap
- Voucher/promotion usage increments per successful application and cannot exceed defined limits.
- Minimum order value (voucher) and eligible categories/items (promotion) are strictly enforced.
- Only one voucher per order; promotion codes must be unique within the order payload.
- Combined discounts are capped via `MAX_DISCOUNT_PERCENT` (default 50%).
- Discounted amount cannot exceed subtotal or eligible item totals.

## Deployment Notes
- Deploy the NestJS service to Render/Heroku/Vercel (Node runtime). Configure environment variables as per `.env.example`.
- Use a managed PostgreSQL instance (ElephantSQL/Supabase). Set `DATABASE_SSL=true` if required by the provider.
- Ensure the `/docs` route is enabled in production for reviewers (optionally protect with auth layer if needed).

## Future Enhancements
- JWT-based authentication + role checks.
- Rate limiting using Nest Throttler to guard public endpoints.
- Integration tests covering discount edge cases.
