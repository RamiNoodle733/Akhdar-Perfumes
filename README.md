# Akhdar Perfumes - E-Commerce Platform

A full-featured e-commerce website for authentic Arabian attars and perfume oils, built with Node.js, Express, MongoDB, and EJS.

## Features

- 🛍️ **Full E-Commerce**: Product catalog, collections, cart, checkout
- 💳 **Stripe Payments**: Secure payment processing with Stripe
- 🎨 **Modern UI**: Tailwind CSS with responsive design
- 📱 **3D Product Viewer**: Interactive 3D bottle visualization with AR support
- 🔐 **Admin Panel**: Full admin dashboard for managing products, orders, and customers
- 🔍 **Search**: Predictive search with real-time results
- 📧 **Fragrance Notes**: Display top, heart, and base notes for each product

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **View Engine**: EJS
- **Styling**: Tailwind CSS
- **Payments**: Stripe
- **3D/AR**: model-viewer
- **Deployment**: Render

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Stripe account (for payments)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/akhdar-perfumes.git
cd akhdar-perfumes
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Update the `.env` file with your credentials:
```env
MONGODB_URI=mongodb://localhost:27017/akhdar-perfumes
SESSION_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

5. Seed the database with sample data:
```bash
npm run seed
```

Optional: import products from a Shopify CSV export:
```bash
npm run import:shopify-products -- data/shopify-products.csv
```

6. Build CSS (for production):
```bash
npm run build:css
```

7. Start the development server:
```bash
npm run dev
```

8. Visit `http://localhost:3000`

### Admin Access

After seeding, you can access the admin panel at `/admin` with:
- **Email**: admin@akhdar-perfumes.com
- **Password**: admin123

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run seed` - Seed database with sample data
- `npm run import:shopify-products -- <file.csv>` - Import/update products from Shopify export CSV
- `npm run build:css` - Build Tailwind CSS for production

## Shopify Migration Runbook

For full cutover steps (env setup, data import, Stripe webhook setup, deployment, and DNS cutover), see:

- `docs/MIGRATION_RUNBOOK.md`

## Project Structure

```
├── server.js           # Main Express application
├── package.json        # Dependencies and scripts
├── tailwind.config.js  # Tailwind CSS configuration
├── render.yaml         # Render deployment config
├── seed.js             # Database seeder
├── src/
│   ├── models/         # MongoDB/Mongoose models
│   │   ├── Product.js
│   │   ├── Collection.js
│   │   ├── Order.js
│   │   ├── Customer.js
│   │   ├── Admin.js
│   │   └── Page.js
│   ├── routes/         # Express routes
│   │   ├── home.js
│   │   ├── products.js
│   │   ├── collections.js
│   │   ├── cart.js
│   │   ├── checkout.js
│   │   ├── pages.js
│   │   ├── api.js
│   │   └── admin.js
│   ├── views/          # EJS templates
│   │   ├── layouts/
│   │   ├── partials/
│   │   ├── pages/
│   │   └── admin/
│   └── styles/         # CSS source files
│       └── main.css
├── public/             # Static assets
│   ├── css/
│   ├── js/
│   └── images/
└── uploads/            # Uploaded product images
```

## Deployment to Render

1. Push your code to GitHub

2. Connect your repository to Render

3. The `render.yaml` blueprint will automatically configure:
   - Web service (Node.js)
   - MongoDB database

4. Set environment variables in Render dashboard:
   - `MONGODB_URI` (from Render MongoDB or Atlas)
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`

5. Deploy!

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | Environment (development/production) |
| `MONGODB_URI` | MongoDB connection string |
| `SESSION_SECRET` | Secret for session encryption |
| `STRIPE_SECRET_KEY` | Stripe secret API key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

## License

MIT

## Support

For support, email akhdarperfumes@gmail.com
