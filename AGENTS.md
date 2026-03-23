# Agents

## Cursor Cloud specific instructions

### Overview

Akhdar Perfumes is a Node.js/Express e-commerce application using MongoDB, EJS templates, and Tailwind CSS. See `README.md` for full setup instructions and project structure.

### Required services

| Service | How to start | Default port |
|---------|-------------|-------------|
| MongoDB | `mongod --dbpath /data/db --fork --logpath /var/log/mongod.log` | 27017 |
| Express dev server | `npm run dev` | 3000 |

### Running the app

1. Start MongoDB first (see table above).
2. Run `npm run seed` to populate sample data (admin: `admin@akhdar-perfumes.com` / `admin123`).
3. Run `npm run dev` to start the Express server with Nodemon hot-reload.

### Build

- `npm run build:css` compiles Tailwind CSS from `src/styles/main.css` to `public/css/styles.css`.
- The storefront also loads Tailwind via CDN fallback, so the app works without a local CSS build during dev.

### Known issues

- The admin login page (`/admin/login`) returns a 500 because it references a missing EJS layout `admin/layout-minimal`. The storefront (home, products, collections, cart) works normally.
- Mongoose emits duplicate schema index warnings at startup; these are harmless.

### Stripe / SMTP

Stripe and SMTP are optional. The app starts and runs without valid keys (placeholders in `.env.example`). Checkout payment processing requires real Stripe test keys.
