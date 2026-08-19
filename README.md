# Sell Me A Pen

A real-time marketplace for CUNY students to buy and sell textbooks, furniture, and electronics with people on their own campus.

**Live app:** [frontend-vert-one-e9v7pz4zk4.vercel.app](https://frontend-vert-one-e9v7pz4zk4.vercel.app)
**API repo:** [Capstone-iii-marketplace/backend](https://github.com/Capstone-iii-marketplace/backend)

A CUNY Capstone III project.

## Features

- Email/password auth with httpOnly cookie sessions
- Browse and search listings by category (items, tutoring sessions, student guides)
- Real-time chat between buyer and seller, scoped to a listing
- Video calling from within a conversation
- Stripe Checkout for online payment, or reserve-and-pay-in-person
- Seller reviews and ratings, visible on listings and profiles
- Student profiles — major, semester, verified badge

## Tech stack

- React 19 + Vite
- React Router, Context API for auth/cart/socket/call/notification state
- Tailwind CSS + daisyUI
- Socket.IO client
- Lucide React icons

## Getting started

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`. In development, `vite.config.js` proxies `/api` and `/socket.io` to a backend running locally on port 3000 — see the [backend README](https://github.com/Capstone-iii-marketplace/backend) to get that running.

No environment variables are required for the frontend — the API base URL is same-origin by design, proxied in dev by Vite and in production by `vercel.json`, so the auth cookie is never sent cross-origin.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Lint with oxlint |

## Deployment

Deployed on Vercel, building from `main`. `vercel.json` proxies `/api`, `/socket.io`, and `/health` to the Render-hosted backend, and falls back every other route to `index.html` for client-side routing.

## Team

Capstone III — Phyo, Zin, Shan, Seoyeon
