# Campus marketplace — product requirements

**Status:** draft
**Last updated:** 2026-08-11
**Scope:** CUNY Capstone III demo project

---

## 1. Problem

Students buy and sell the same things every semester — textbooks, dorm furniture, mini-fridges, bikes, thrifted clothes — and currently do it across Instagram stories, GroupMe, and Facebook groups. Those channels have no search, no listing history, no way to tell whether an item is still available, and no record that a deal happened.

A campus-scoped marketplace fixes the discovery problem (one searchable place) and the trust problem (everyone is a verified student at the same school, meeting in person on campus).

Trust is the actual differentiator. Craigslist and Facebook Marketplace already solve discovery, and they solve it better than we ever will — what they cannot offer is the knowledge that the person on the other end is a classmate who swipes into the same building, who is findable, and who has something to lose by behaving badly. A stranger from the internet meeting you in a parking lot is a fundamentally different transaction from a junior in your department meeting you outside the library. Every product decision below should protect that difference rather than dilute it.

## 2. Goals

**In scope for the demo**

1. A student can create an account and sign in.
2. A student can post an item for sale with photos and a price.
3. A student can browse and search listings.
4. A buyer can chat with a seller in real time about a specific listing.
5. A buyer can either pay online through Stripe or reserve the item and pay cash in person.
6. A completed sale marks the listing sold and emails both parties.
7. Every account is tied to a verified campus email, and that verification is visible wherever a student decides whether to trust a stranger.

**Explicitly out of scope**

| Cut | Why |
| --- | --- |
| Stripe Connect / seller payouts | Onboarding, verification states, and payout handling are days of work that demo as a form. Test-mode payments land in the platform account instead. |
| Reviews and seller ratings | Needs volume to be meaningful; adds a table plus UI for no demo value. |
| Offers / counter-offers | Price negotiation happens in chat. |
| Favorites, saved searches, notifications feed | Nice-to-have surface area, no bearing on the core flow. |
| Shipping and addresses | All transactions are in-person handoffs on campus. |
| Admin panel, moderation, reporting | Real product need, not a demo need. |

**Non-goals.** This is not a general-purpose marketplace, not a payments platform, and not a shipping product. It is a campus bulletin board with real chat and real checkout.

## 3. Users

**Seller** — a student with something to get rid of, usually at the end of a semester. Wants to post fast, from a phone, with minimal fields. Cares most about not being ghosted.

**Buyer** — a student looking for a specific thing (a course textbook) or browsing for a deal. Wants to know an item is still available before walking across campus.

The same account does both. There is no separate seller signup.

## 4. Core flow

1. Sign up with email and password, then sign in. Listings are browsable while logged out; posting, chatting, and buying require an account.
2. Dashboard shows all active listings with search and category filters.
3. Clicking a listing opens item detail — photos, price, condition, seller, and a "message seller" button.
4. Chat is a real-time thread scoped to that one listing and that one buyer. Price gets negotiated here.
5. Once they agree, the buyer checks out one of two ways:
   - **Pay online** — Stripe Checkout. The listing goes `pending`, and Stripe's webhook flips it to `sold`.
   - **Reserve for pickup** — the listing goes `pending` with a 24-hour hold. They meet, cash changes hands, and the seller confirms receipt to mark it `sold`. An expired hold returns the listing to `active`.
6. Both paths send a confirmation email to buyer and seller.

## 5. Requirements

### 5.1 Authentication

- Email and password signup. Passwords hashed with bcrypt, never stored or logged in plaintext.
- Session cookies (`httpOnly`, `sameSite`), readable by Socket.IO from the handshake so chat authenticates with the same session as HTTP.
- Auth is enforced on the action, not the page: clicking "message seller" while logged out routes to login and returns the user where they were.
- Signup requires a `.edu` address, followed by a click-through verification link. An unverified account can browse but cannot post, chat, or buy — the three actions where another student is trusting you.
- Because live demos need throwaway accounts, the domain check reads from an allowlist in configuration rather than being hardcoded, and seeded demo accounts are created pre-verified. The rule stays enforced in the code path being demonstrated.

### 5.2 Listings

- Fields: title, description, price, category, condition, photos, and which payment methods the seller accepts.
- A seller can edit or remove their own listing while it is `active`. A `pending` or `sold` listing is locked.
- Status lifecycle: `active → pending → sold`, plus `removed`. Only `active` listings appear in the feed.
- Photos upload to object storage (S3 or Cloudinary); the database stores URLs only.
- Prices are stored as integer cents.

### 5.3 Chat

- One thread per `(listing, buyer)` pair, enforced by a unique constraint. A buyer asking about two items gets two threads.
- Messages are persisted before broadcast, so refreshing shows history and an offline recipient does not lose messages.
- Socket.IO rooms are keyed by conversation id. A user may only join rooms for conversations they are the buyer or seller in — verified server-side on join, not trusted from the client.
- Typing indicators and read receipts are optional polish, not requirements.

### 5.4 Payments

- **Online:** Stripe Checkout in test mode. An order row is created and the listing set to `pending` before redirect.
- **Source of truth is the webhook**, not the browser redirect. Users close tabs; webhooks still fire.
- The webhook must be idempotent — Stripe retries and will deliver the same event more than once. A unique index on `stripe_session_id` makes a duplicate delivery fail harmlessly.
- **In person:** a reserve action creates an order with a 24-hour `expires_at`. The seller — not the buyer — confirms the handoff, because the seller is the one who knows whether cash actually appeared. Expired holds release the listing back to `active`.
- Listing status and order status must be updated in the same transaction. Drift between them produces items that are permanently unbuyable.
- **No card or bank details are ever stored in our database.** Card entry happens on Stripe's hosted checkout.

### 5.5 Trust and campus identity

This is the section that makes the product worth building rather than a generic classifieds clone.

- **Verified campus email is the trust primitive.** A student who completes verification gets a "Verified student" badge that appears on their profile, on every listing they post, and in the chat header. Verification is binary and non-transferable; there is no way to buy or self-assert it.
- **Campus scoping.** Every user belongs to a campus, derived from their email domain. The default feed shows listings from your own campus only. For a CUNY-wide system this matters — a Queens College student should not have to filter past Brooklyn College couches they will never drive to. A "nearby campuses" toggle is a natural extension, deliberately not in demo scope.
- **Profiles carry earned signal, not claims.** A profile shows the campus, the month they joined, their verified badge, and their active listings. Nothing on it is free-text bragging. Account age is quietly one of the strongest trust signals available and costs nothing to display.
- **Real names, not handles.** Sellers appear under the name on their account. Pseudonymity is what makes strangers on the internet feel like strangers; a first name and last initial with a campus attached feels like a classmate.
- **The conversation stays on the platform.** Chat is the only contact channel before a sale, which means there is a record of what was promised. This is also why email-the-seller was cut — it moves the negotiation somewhere we cannot show it and cannot reference if a deal sours.
- **Meet-on-campus guidance.** Item detail and the confirmation email suggest meeting in a public campus location during daylight — library entrance, student center, security desk. This is a paragraph of copy and a link, not a feature, and it is the highest safety-per-hour investment in the product.
- **Handoff confirmation is the seller's.** For cash sales the seller confirms receipt, because they are the party who knows whether money changed hands. This is a trust decision, not just a state-machine one.

**What we are deliberately not claiming.** Verification proves someone holds a campus email address. It does not prove they are honest, and the product should never imply it does. There is no escrow, no guarantee, no dispute resolution. Copy should say "verified student," never "safe" or "protected."

Two mechanisms are designed for but out of demo scope, and both are the obvious next build: **reporting a listing or user**, and **lightweight reputation** — completed-sale counts rather than five-star ratings, which are noisy at low volume and punish new sellers.

### 5.6 Email

Transactional only: sale confirmation to both parties, including the counterparty's contact info so they can arrange pickup. Sent through a provider (Resend, SendGrid, or similar). Email failure must not roll back a completed sale.

## 6. Data model

Six tables. Full column list and rationale live alongside this doc; the shape is:

- `users` — identity only, no payment columns. Carries `campus` and `verified_at` (null until the email link is clicked) to support §5.5.
- `listings` — catalog, owns the `status` that the whole flow pivots on.
- `listing_images` — ordered photos per listing.
- `conversations` — one row per `(listing, buyer)`, unique.
- `messages` — belongs to a conversation.
- `orders` — one table for both payment methods, distinguished by `method`. Carries `stripe_session_id` for online and `expires_at` for in-person holds.

## 7. Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19 + Vite |
| Backend | Node + Express |
| Database | PostgreSQL (Prisma for schema, migrations, and queries) |
| Real-time | Socket.IO |
| Payments | Stripe Checkout, test mode |
| Auth | bcrypt + `express-session` with a Postgres session store |
| Uploads | Multer to S3 or Cloudinary |
| Email | Transactional email provider |

Single Express process serves the API and the Socket.IO server. No queue, no cache, no microservices — none are justified at demo scale.

## 8. Security

- Passwords hashed, never logged.
- Every mutation re-checks ownership server-side. A seller id in the request body is never trusted; it comes from the session.
- Socket room membership authorized on join.
- Stripe webhook signature verified; amounts read from the Stripe event, never from the client.
- Parameterized queries throughout (Prisma handles this).
- Rate limiting on login and signup.
- Uploads validated by type and size.

## 9. Success criteria

The demo succeeds if, live and without recovery:

1. Two browsers signed in as different users exchange chat messages with visible latency under a second.
2. A test-card checkout completes and the listing visibly becomes sold in the other browser.
3. A reserve-for-cash flow holds the item, and the seller confirms it sold.
4. Search returns a listing by title.
5. A second buyer cannot purchase an item already `pending` or `sold`.
6. An unverified account is visibly blocked from posting or buying, and the verified badge appears on listings and in chat.

Criterion 5 is the one most likely to fail under demo conditions and deserves explicit testing.

## 10. Open questions

- Is there an inbox screen listing all conversations, or is chat reachable only from item detail? This determines how much the `conversations` table earns its place.
- Category list — fixed enum or free text?
- Does the seller choose accepted payment methods per listing, or is it an account-level setting?
- Hold duration: 24 hours is a guess. Shorter demos better; longer is more realistic.

## 11. Risks

| Risk | Mitigation |
| --- | --- |
| Stripe webhooks cannot reach localhost | Use the Stripe CLI to forward events; test this early, not the night before. |
| Cash deals are unenforceable — a buyer can reserve and ghost | Expiring holds. Accept that the system records claims, and do not build features that pretend otherwise. |
| Listing/order status drift | Single transaction on every state change; integration test for the double-purchase case. |
| Live demo network failure during chat | Rehearse on the venue network; have a recorded fallback. |
| Scope creep into Connect, reviews, offers | This document's out-of-scope table is the reference. |
| Verification emails land in spam and block the whole demo | Test deliverability early; seed pre-verified demo accounts as a fallback. |
| Trust badge overpromises, and a bad experience reflects on the platform | Copy says "verified student," never "safe." No guarantee is offered anywhere in the product. |
