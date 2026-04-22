# Shopify → Akhdar Perfumes Migration Runbook

This runbook is ordered from infrastructure to data to go-live.

## 1) Prepare environment

1. Copy env template:
   ```bash
   cp .env.example .env
   ```
2. Fill in required keys:
   - `MONGODB_URI`
   - `SESSION_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`

## 2) Install + verify app

```bash
npm install
npm run build:css
npm run dev
```

Visit:
- Storefront: `http://localhost:3000`
- Admin: `http://localhost:3000/admin/login`

## 3) Import data from Shopify

### Products (implemented)

1. In Shopify admin export products as CSV.
2. Save file in this repo, for example: `data/shopify-products.csv`
3. Run:
   ```bash
   npm run import:shopify-products -- data/shopify-products.csv
   ```

Notes:
- Import is idempotent by product `handle`.
- Tags are also created as collections when they do not already exist.

### Customers and orders (manual for now)

- Export customers/orders from Shopify for backup and optional import.
- Keep Shopify in read-only mode during final cutover window.

## 4) Payment + webhook setup

1. In Stripe dashboard, add webhook endpoint:
   - `https://<your-domain>/checkout/webhook`
2. Subscribe to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
3. Copy endpoint signing secret to `STRIPE_WEBHOOK_SECRET`.

## 5) Production deployment

Use `render.yaml` or `vercel.json`.

### Render

- Set all env vars in dashboard.
- Ensure persistent MongoDB and backups are enabled.

### Vercel

- Add all env vars in project settings.
- Confirm file uploads strategy (local filesystem on serverless is ephemeral).

## 6) Pre-launch checklist

- [ ] Product pages match Shopify content/images
- [ ] Cart add/update/remove works
- [ ] Test card checkout works end-to-end
- [ ] Confirmation email sends
- [ ] Admin can view/process orders
- [ ] 404/error pages render correctly

## 7) DNS + final cutover

1. Put Shopify into maintenance/freeze period.
2. Point DNS to new platform.
3. Validate live checkout with small real transaction.
4. Keep Shopify active for 7–14 days as fallback history source.
5. Cancel Shopify plan after validation window.
