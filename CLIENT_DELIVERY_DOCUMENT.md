# UPPL (Udaydev Patan Premier League) — Client Delivery Document

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Features & Functionality](#3-features--functionality)
4. [System Architecture & Workflow](#4-system-architecture--workflow)
5. [Pricing Breakdown](#5-pricing-breakdown)
6. [Maintenance & Hosting Costs](#6-maintenance--hosting-costs)
7. [Suggestions & Recommendations](#7-suggestions--recommendations)
8. [Handover Checklist](#8-handover-checklist)

---

## 1. Project Overview

**Project Name:** UPPL — Udaydev Patan Premier League  
**Project Type:** Full-stack Cricket Tournament Management Web Application (T20 format)  
**Platform:** Web (Responsive — works on desktop, tablet, mobile)  
**Live URL:** https://uppl-ajwn.onrender.com (or custom domain)  
**Repo:** Private Git Repository

### What It Does

UPPL is a complete tournament management platform that handles:

- **Team Registration & Management** — Teams register online, upload logos, pay via eSewa
- **Player Verification** — Players submit documents, admin verifies, career stats tracked
- **Match Scheduling** — Auto-generate groups, league fixtures, playoff brackets
- **Live Ball-by-Ball Scoring** — Real-time scoring with Socket.IO (runs, wickets, overs, boundaries)
- **Points Table** — Auto-calculated standings with NRR (Net Run Rate)
- **Content Management** — News articles (with rich editor), photo gallery, video highlights
- **Sponsor Management** — Tiered sponsor display (Platinum/Gold/Silver/Bronze)
- **User Engagement** — Match predictions, player-of-the-match voting
- **Payments** — eSewa integration for registration fees

---

## 2. Tech Stack

### Frontend (Client-side)

| Technology | Purpose | Version |
|---|---|---|
| React | UI Framework | 18.x |
| TypeScript | Type-safe JavaScript | 5.x |
| Vite | Build tool & dev server | 5.x |
| Tailwind CSS | Utility-first styling | 3.x |
| shadcn/ui + Radix UI | Accessible component library | Latest |
| Material UI (MUI) | Advanced UI components | 7.x |
| React Router DOM | Client-side routing | 6.x |
| TanStack React Query | Server state & caching | Latest |
| TanStack React Table | Data tables | Latest |
| Framer Motion | Animations | Latest |
| React Hook Form + Zod | Form validation | Latest |
| TipTap | Rich text editor (news) | Latest |
| Recharts | Charts & statistics | Latest |
| Socket.IO Client | Real-time live scores | Latest |
| Firebase SDK | Google/Facebook login | Latest |
| Axios | HTTP client | Latest |

### Backend (Server-side)

| Technology | Purpose | Version |
|---|---|---|
| Node.js | Runtime | 18.x |
| Express.js | Web framework | 5.x |
| MongoDB + Mongoose | Database & ODM | 8.x |
| JWT (jsonwebtoken) | Authentication tokens | Latest |
| Socket.IO | Real-time WebSocket engine | Latest |
| Cloudinary SDK | Image/video upload & CDN | Latest |
| Multer | File upload handling | Latest |
| Nodemailer | Email sending (Gmail SMTP) | Latest |
| node-cron | Scheduled tasks | Latest |
| bcryptjs | Password hashing | Latest |
| Helmet | Security headers | Latest |

### Infrastructure

| Service | Purpose | Estimated Cost |
|---|---|---|
| **MongoDB Atlas** (M0 Free Tier or M2) | Database | $0–$15/mo |
| **Cloudinary** (Free tier) | Media storage & CDN | $0 (free 25GB) |
| **Vercel** (Hobby) | Frontend hosting | $0 (free) |
| **Render** (Free or Starter) | Backend hosting | $0–$7/mo |
| **Firebase** (Spark plan) | Social auth | $0 (free) |
| **Custom Domain** | Branding | $10–$15/yr |
| **Gmail SMTP** | Emails | $0 (free) |

---

## 3. Features & Functionality

### 3.1 Public / User-Facing Features

| # | Feature | Description | Status |
|---|---|---|---|
| 1 | **Home Page** | Landing page with tournament overview, hero section, latest updates | ✅ Built |
| 2 | **Teams Directory** | View all registered teams with logos, captains, coaches | ✅ Built |
| 3 | **Team Squad** | Detailed player roster for each team | ✅ Built |
| 4 | **Match Schedule** | Full fixture list with dates, venues, stages (league/playoff/final) | ✅ Built |
| 5 | **Match Details** | Scorecard, ball-by-ball commentary, stats | ✅ Built |
| 6 | **Live Scores** | Real-time ball-by-ball scoring | ✅ Built |
| 7 | **Points Table** | Group standings with NRR calculation | ✅ Built |
| 8 | **News Section** | Internal articles + external cricket news via NewsAPI | ✅ Built |
| 9 | **Photo Gallery** | Albums with fullscreen view | ✅ Built |
| 10 | **Videos** | Embedded YouTube/Vimeo highlights | ✅ Built |
| 11 | **Sponsors Page** | Display sponsors by tier (Platinum/Gold/Silver/Bronze) | ✅ Built |
| 12 | **Players Directory** | All verified players with career statistics | ✅ Built |
| 13 | **Tournament Stats** | Aggregate tournament statistics & charts | ✅ Built |
| 14 | **Watch Live** | Live streaming page | ✅ Built |
| 15 | **User Auth** | Register, Login, Forgot Password, Google/Facebook login | ✅ Built |
| 16 | **User Profile** | Profile management, stats, predictions, voting | ✅ Built |

### 3.2 Tournament Management Features

| # | Feature | Description | Status |
|---|---|---|---|
| 17 | **Tournament Registration** | Team registration with logo upload, payment receipt | ✅ Built |
| 18 | **Season Management** | Create/manage seasons with entry deadlines | ✅ Built |
| 19 | **Auto Group Generation** | Automatic team allocation into groups (shuffle algorithm) | ✅ Built |
| 20 | **Auto Schedule Generation** | Generate league fixtures automatically | ✅ Built |
| 21 | **Team Approval Workflow** | Approve/reject team registrations | ✅ Built |
| 22 | **Player Verification** | Verify player identity with document upload | ✅ Built |

### 3.3 Admin Features

| # | Feature | Description | Status |
|---|---|---|---|
| 23 | **Admin Dashboard** | Stats overview (users, teams, matches, revenue) | ✅ Built |
| 24 | **User Management** | CRUD users, assign roles | ✅ Built |
| 25 | **Match Management** | Create/edit/delete matches, set results | ✅ Built |
| 26 | **Live Scoring Engine** | Professional ball-by-ball scoring: toss, batting/bowling order, over management, powerplay, undo with recalculation, audit logging | ✅ Built |
| 27 | **News Management** | Create/edit/delete with TipTap rich editor | ✅ Built |
| 28 | **Gallery Management** | Albums, images, drag-and-drop reorder | ✅ Built |
| 29 | **Video Management** | Add/manage YouTube/Vimeo videos | ✅ Built |
| 30 | **Sponsor Management** | Organization & individual sponsors with tiering | ✅ Built |
| 31 | **Payment QR Management** | Upload/manage eSewa payment QR codes | ✅ Built |
| 32 | **Settings** | Admin configuration panel | ✅ Built |
| 33 | **Team Members** | Manage committee/organization team | ✅ Built |

### 3.4 Payment Features

| # | Feature | Description | Status |
|---|---|---|---|
| 34 | **eSewa Integration** | Team registration payments via eSewa Nepal | ✅ Built |
| 35 | **Payment QR** | Dynamic QR codes for payments | ✅ Built |
| 36 | **Payment Verification** | Server-side transaction verification | ✅ Built |

### 3.5 Automation

| # | Feature | Description | Status |
|---|---|---|---|
| 37 | **Auto Group Generator** | Auto-generates groups after entry deadline | ✅ Built |
| 38 | **Auto News Fetcher** | Fetches cricket news at 6 AM/6 PM Nepal time | ✅ Built |
| 39 | **Expired News Cleanup** | Auto-deletes external news older than 2 days | ✅ Built |

---

## 4. System Architecture & Workflow

### 4.1 Architecture Diagram (Text)

```
[User's Browser]
       │
       ├── React SPA (Vercel CDN)
       │      ├── Router → Pages
       │      ├── AuthContext → JWT in localStorage
       │      ├── TanStack Query → API data caching
       │      └── Socket.IO Client → Live scores
       │
       ├── Axios ──── HTTPS ────► [Express Backend (Render)]
       │                              ├── JWT Auth Middleware
       │                              ├── Routes → Controllers
       │                              ├── Mongoose Models → MongoDB Atlas
       │                              ├── Cloudinary → Media CDN
       │                              ├── Nodemailer → Email
       │                              ├── NewsAPI → External cricket news
       │                              └── eSewa API → Payment verification
       │
       ├── Socket.IO Client ─────► [Socket.IO Server]
       │                              └── Match rooms → Ball-by-ball broadcasts
       │
       └── Firebase SDK ────► Google/Facebook OAuth
```

### 4.2 User Workflows

#### Team Registration Workflow
```
1. User visits Tournament Registration page
2. Fills team details (name, captain, coach, logo, contact)
3. Uploads payment receipt / pays via eSewa QR
4. Submits → Status = "pending_payment" or "pending"
5. Admin reviews in Admin Dashboard → Team Management
6. Admin approves/rejects → Email notification sent
7. User sees updated status on their dashboard
```

#### Player Verification Workflow
```
1. User registers → Role = "user"
2. User submits verification request with documents (photo, ID)
3. Admin reviews in Player Verification section
4. Admin approves → Role upgraded to "player"
5. Player career stats tracking enabled
6. Player appears in verified Players Directory
```

#### Live Scoring Workflow
```
1. Admin navigates to Match Management → Select match
2. Admin sets Playing XI for both teams (drag-drop lineup)
3. Admin does toss → sets batting/bowling teams
4. Admin starts innings → sets opening batsmen & bowler
5. Ball-by-ball:
   a. Select batsman on strike
   b. Select bowler
   c. Score ball (0,1,2,3,4,6, wide, no-ball, wicket, etc.)
   d. System auto-advances over/bowler changes
   e. Live score broadcasts to all connected clients
6. End innings → auto-switch (if T20)
7. End match → auto-calculate result, update points table
```

#### News Management Workflow (Internal)
```
1. Admin clicks "Create News"
2. Uses TipTap rich text editor (bold, images, tables, etc.)
3. Adds title, summary, meta description, tags, featured image
4. Can save as Draft, Publish now, or Schedule for later
5. Published news appears on News page with SEO-friendly URLs
6. External news auto-fetched from NewsAPI twice daily
```

#### Payment Flow (eSewa)
```
1. User selects eSewa payment option during registration
2. User scans QR code or redirected to eSewa gateway
3. User completes payment on eSewa
4. eSewa sends success callback to backend verification endpoint
5. Backend verifies transaction signature with eSewa secret key
6. On success → team status updated
7. User sees Payment Success page
```

### 4.3 Data Flow

```
User Action → React Event → API Call (Axios) → Express Route → Controller Logic
    → Mongoose Query → MongoDB
    → Response JSON → React State Update → UI Renders

Live Scoring:
Admin scores ball → POST /api/matches/:id/score-ball
    → Mongoose save → Socket.IO emit('ball-event', data)
    → All connected clients receive update → UI updates in real-time
```

---

## 5. Pricing Breakdown

Below is a component-wise pricing estimate for building this application from scratch at current market rates (Nepal/India/South Asia market). Costs are in **USD** and **NPR** (1 USD ≈ 135 NPR).

### 5.1 Development Cost Breakdown

| # | Component | Description | Est. Hours | Cost (USD) | Cost (NPR) |
|---|---|---|---|---|---|
| **A. Frontend Development** | | | | | |
| 1 | **Project Setup & Architecture** | Vite + React + TypeScript, routing, folder structure, API layer, auth context, theme setup | 20 hrs | $400 | ₹54,000 |
| 2 | **Authentication System** | Login, Register, Forgot Password, Google/Facebook login, JWT handling, protected routes | 30 hrs | $600 | ₹81,000 |
| 3 | **Home Page & Landing** | Hero section, stats cards, latest updates, responsive design | 16 hrs | $320 | ₹43,200 |
| 4 | **Teams Pages** | Teams directory, team squad view, team details | 20 hrs | $400 | ₹54,000 |
| 5 | **Match Schedule & Details** | Fixture list, match scorecard, ball-by-ball commentary | 25 hrs | $500 | ₹67,500 |
| 6 | **Live Scores (Frontend)** | Real-time score display, Socket.IO integration, ball-by-ball UI | 30 hrs | $600 | ₹81,000 |
| 7 | **Points Table** | Group standings, NRR calculation display | 12 hrs | $240 | ₹32,400 |
| 8 | **News Section** | News list, article page, featured news, category filtering | 20 hrs | $400 | ₹54,000 |
| 9 | **Photo Gallery** | Albums, grid view, fullscreen, image lightbox | 15 hrs | $300 | ₹40,500 |
| 10 | **Videos Section** | Video grid, embed handling (YouTube/Vimeo) | 8 hrs | $160 | ₹21,600 |
| 11 | **Sponsors Page** | Tiered display, organization & individual sponsors | 10 hrs | $200 | ₹27,000 |
| 12 | **Players Directory** | Player cards, career stats, search/filter | 15 hrs | $300 | ₹40,500 |
| 13 | **User Profile** | Profile management, stats, predictions, voting history | 15 hrs | $300 | ₹40,500 |
| 14 | **Admin Dashboard** | Stats overview, charts (Recharts), activity feed | 20 hrs | $400 | ₹54,000 |
| 15 | **Admin: User Management** | Users table, CRUD, role assignment | 15 hrs | $300 | ₹40,500 |
| 16 | **Admin: Team Management** | Team approval/rejection, team CRUD | 15 hrs | $300 | ₹40,500 |
| 17 | **Admin: Player Verification** | Document review, approve/reject workflow | 12 hrs | $240 | ₹32,400 |
| 18 | **Admin: Match Management** | Match CRUD, result setting | 15 hrs | $300 | ₹40,500 |
| 19 | **Admin: Live Scoring Engine UI** | Playing XI setup, toss, ball scoring interface, over management, undo | 40 hrs | $800 | ₹108,000 |
| 20 | **Admin: News Management** | TipTap editor, CRUD, scheduling, featured image | 20 hrs | $400 | ₹54,000 |
| 21 | **Admin: Gallery Management** | Album CRUD, image upload with drag-reorder | 15 hrs | $300 | ₹40,500 |
| 22 | **Admin: Video Management** | Video CRUD, embed URL handling | 8 hrs | $160 | ₹21,600 |
| 23 | **Admin: Sponsor Management** | Sponsor CRUD, tier management, image upload | 12 hrs | $240 | ₹32,400 |
| 24 | **Admin: Settings & Config** | Season settings, QR management, config panel | 10 hrs | $200 | ₹27,000 |
| 25 | **Tournament Registration Page** | Multi-step registration form, file upload, payment | 20 hrs | $400 | ₹54,000 |
| **Frontend Subtotal** | | | **423 hrs** | **$8,460** | **₹1,142,100** |

| **B. Backend Development** | | | | | |
|---|---|---|---|---|---|
| 26 | **Server Setup & Architecture** | Express server, middleware, error handling, CORS, security | 15 hrs | $300 | ₹40,500 |
| 27 | **Database Design & Models** | 18 Mongoose schemas (User, Team, Match, Player, News, etc.) | 25 hrs | $500 | ₹67,500 |
| 28 | **Auth API (Register, Login, Social, OTP, Reset)** | Complete auth flow with JWT, bcrypt, Firebase verification | 25 hrs | $500 | ₹67,500 |
| 29 | **Team & Player APIs** | CRUD + verification + career stats | 20 hrs | $400 | ₹54,000 |
| 30 | **Match & Live Scoring APIs** | CRUD + ball-by-ball engine + over management + undo with recalculation | 40 hrs | $800 | ₹108,000 |
| 31 | **Points Table Logic** | NRR calculation, standings computation | 15 hrs | $300 | ₹40,500 |
| 32 | **Season & Group Logic** | Season CRUD, group generation algorithm, schedule generation | 20 hrs | $400 | ₹54,000 |
| 33 | **News APIs** | CRUD + external news fetch + scheduling | 15 hrs | $300 | ₹40,500 |
| 34 | **Gallery & Video APIs** | CRUD + Cloudinary integration | 12 hrs | $240 | ₹32,400 |
| 35 | **Sponsor APIs** | Organization & individual sponsor CRUD | 10 hrs | $200 | ₹27,000 |
| 36 | **Payment Integration (eSewa)** | eSewa API integration, signature verification, callback handling | 20 hrs | $400 | ₹54,000 |
| 37 | **Socket.IO Real-time Server** | Match rooms, ball-event broadcasting, connection management | 15 hrs | $300 | ₹40,500 |
| 38 | **Email Service** | Nodemailer setup, verification/rejection emails, OTP emails | 10 hrs | $200 | ₹27,000 |
| 39 | **Admin APIs** | Dashboard stats, admin CRUD, audit logging | 15 hrs | $300 | ₹40,500 |
| 40 | **File Upload Service** | Multer + Cloudinary upload pipeline | 10 hrs | $200 | ₹27,000 |
| **Backend Subtotal** | | | **267 hrs** | **$5,340** | **₹720,900** |

| **C. DevOps & Deployment** | | | | | |
|---|---|---|---|---|---|
| 41 | **Vercel Frontend Deployment** | Build config, env vars, domain setup, SSL | 5 hrs | $100 | ₹13,500 |
| 42 | **Render Backend Deployment** | Deployment config, env vars, health checks | 5 hrs | $100 | ₹13,500 |
| 43 | **MongoDB Atlas Setup** | Cluster creation, IP whitelist, user setup | 3 hrs | $60 | ₹8,100 |
| 44 | **Cloudinary Setup** | Account, upload presets, API keys | 2 hrs | $40 | ₹5,400 |
| 45 | **Firebase Project Setup** | Project creation, OAuth config, API keys | 3 hrs | $60 | ₹8,100 |
| 46 | **Custom Domain & DNS** | Domain purchase, DNS config, SSL | 3 hrs | $60 | ₹8,100 |
| 47 | **CI/CD Pipeline** | GitHub auto-deploy, environment management | 4 hrs | $80 | ₹10,800 |
| **DevOps Subtotal** | | | **25 hrs** | **$500** | **₹67,500** |

| **D. Testing & QA** | | | | | |
|---|---|---|---|---|---|
| 48 | **API Testing** | All endpoints tested (Postman/Thunder Client) | 20 hrs | $300 | ₹40,500 |
| 49 | **Frontend Testing** | Component testing, flow testing | 20 hrs | $300 | ₹40,500 |
| 50 | **Integration Testing** | Full flow testing (registration → scoring → results) | 15 hrs | $225 | ₹30,375 |
| 51 | **Mobile Responsiveness** | Mobile/tablet UI fixes | 10 hrs | $150 | ₹20,250 |
| 52 | **Bug Fixing & Polish** | Issue resolution based on testing | 20 hrs | $300 | ₹40,500 |
| **Testing Subtotal** | | | **85 hrs** | **$1,275** | **₹172,125** |

| **E. Documentation & Handover** | | | | | |
|---|---|---|---|---|---|
| 53 | **Technical Documentation** | API docs, architecture docs, deployment guide | 10 hrs | $200 | ₹27,000 |
| 54 | **User Manual** | Admin guide, user guide | 10 hrs | $200 | ₹27,000 |
| 55 | **Source Code Handover** | Clean repo, .gitignore, README | 5 hrs | $100 | ₹13,500 |
| **Doc Subtotal** | | | **25 hrs** | **$500** | **₹67,500** |

### 5.2 Total Development Summary

| Category | Hours | Cost (USD) | Cost (NPR) |
|---|---|---|---|
| Frontend Development | 423 hrs | $8,460 | ₹1,142,100 |
| Backend Development | 267 hrs | $5,340 | ₹720,900 |
| DevOps & Deployment | 25 hrs | $500 | ₹67,500 |
| Testing & QA | 85 hrs | $1,275 | ₹172,125 |
| Documentation & Handover | 25 hrs | $500 | ₹67,500 |
| **Total** | **825 hrs** | **$16,075** | **₹2,170,125** |

### 5.3 Ongoing Monthly Costs

| Item | Cost (USD/mo) | Cost (NPR/mo) | Notes |
|---|---|---|---|
| MongoDB Atlas (M2) | $15 | ₹2,025 | Production-grade, 2GB storage |
| Render (Starter) | $7 | ₹945 | Backend hosting |
| Vercel (Pro) | $20 | ₹2,700 | Optional — Hobby tier is free |
| Cloudinary (Free) | $0 | ₹0 | Free tier: 25GB storage, 25GB bandwidth |
| Firebase (Spark) | $0 | ₹0 | Free tier |
| Domain Renewal | ~$1.25 | ₹170 | ~$15/year |
| Email Service (SendGrid) | $0 | ₹0 | Free tier: 100 emails/day |
| **Total Monthly** | **~$43** | **~₹5,840** | Can be as low as **$7/mo** with free tiers |

### 5.4 One-time Additional Costs

| Item | Cost |
|---|---|
| Custom Domain Setup | $10–$15/yr |
| SSL Certificate | Free (Vercel/Render provide auto-SSL) |
| Firebase Setup | Free |
| eSewa Merchant Account | Free (but requires business registration) |
| Gmail SMTP | Free (or SendGrid free tier) |
| Logo & Branding Design | $100–$300 (if outsourced) |

---

## 6. Maintenance & Hosting Costs

### 6.1 Monthly Maintenance (Optional — Recommended)

If you want ongoing support after delivery:

| Service | Cost (USD/mo) | Cost (NPR/mo) | What's Included |
|---|---|---|---|
| **Basic Maintenance** | $100 | ₹13,500 | Bug fixes, server monitoring, uptime checks, database backups, security patches |
| **Standard Maintenance** | $200 | ₹27,000 | Everything above + content updates, small feature tweaks, 8 hrs/month development |
| **Premium Maintenance** | $400 | ₹54,000 | Everything above + 20 hrs/month development, priority support, performance optimization |

### 6.2 Recommended Hosting Setup (Production)

| Service | Plan | Monthly Cost |
|---|---|---|
| MongoDB Atlas | M2 (2GB RAM, 2GB storage) | ~$15 |
| Backend Hosting | Render Starter (512MB RAM) | ~$7 |
| Frontend Hosting | Vercel Hobby (Free) | $0 |
| Media Storage | Cloudinary Free (25GB) | $0 |
| Total | | **~$22/mo** |

---

## 7. Suggestions & Recommendations

### 7.1 Immediate Improvements (Low Effort, High Impact)

| # | Suggestion | Effort | Impact | Reason |
|---|---|---|---|---|
| 1 | **Add Loading States & Skeletons** | Low | High | Currently pages may show blank while data loads; using `react-loading-skeleton` is already set up |
| 2 | **Improve Error Handling** | Low | High | Some API errors may show unhandled UI; add global error boundary + toast notifications |
| 3 | **SEO Optimization** | Medium | High | Add react-helmet-async for meta tags, sitemap generation, Open Graph for social sharing |
| 4 | **PWA Support** | Medium | Medium | Add service worker, manifest.json, app can be installed on mobile as "add to home screen" |
| 5 | **Image Optimization** | Low | Medium | Lazy load images, use Cloudinary transformations (auto-format, auto-quality) |
| 6 | **Environment Variables Cleanup** | Low | High | Move all secrets to env, remove hardcoded values (e.g., Cloudinary keys in .env — ALREADY DONE ✅) |
| 7 | **Add 404 Page Polish** | Low | Low | 404 page exists, could add links back to homepage |

### 7.2 Recommended New Features (For v2)

| # | Feature | Estimated Cost | Priority | Description |
|---|---|---|---|---|
| 1 | **Mobile App (React Native/Flutter)** | $5,000–$8,000 | Medium | Native mobile experience for scoring and fan engagement |
| 2 | **WhatsApp / SMS Notifications** | $300–$500 | High | Notify teams about match schedules, results via WhatsApp API |
| 3 | **Live Streaming Integration** | $500–$1,000 | Medium | Embed YouTube Live/Facebook Live directly on Watch Live page |
| 4 | **Multi-language Support (Nepali + English)** | $800–$1,200 | High | i18n for wider audience, especially Nepali language |
| 5 | **Scorecard Export (PDF/Image)** | $200–$400 | Low | Shareable scorecard images for social media (html2canvas + jspdf already in deps) |
| 6 | **Match Commentary Feed** | $300–$500 | Medium | Auto-generated text commentary like ESPNcricinfo |
| 7 | **Fantasy League Module** | $2,000–$3,000 | Low | Users create fantasy teams, earn points based on real performance |
| 8 | **Live Ball-by-Ball Animation** | $400–$600 | Medium | Animated cricket field showing ball placement, wagon wheel |
| 9 | **Payment Receipt Auto-Email** | $100–$200 | Medium | Auto-send payment receipt via email after successful payment |
| 10 | **Tournament Chat/Forum** | $300–$500 | Low | Community discussion per match/team |

### 7.3 Technical Recommendations

#### Security
- ✅ JWT with expiry and refresh token mechanism — already implemented
- ✅ Password hashing with bcrypt — already implemented
- ✅ CORS configured — already implemented
- ⚠️ **Recommend:** Add rate limiting (`express-rate-limit`) to prevent brute force attacks
- ⚠️ **Recommend:** Add request validation middleware for all inputs
- ⚠️ **Recommend:** Add MongoDB injection protection (`express-mongo-sanitize`)

#### Performance
- ⚠️ **Recommend:** Implement Redis caching for frequently accessed data (points table, news)
- ⚠️ **Recommend:** Add CDN caching headers for static assets
- ⚠️ **Recommend:** Database indexing on frequently queried fields (match status, season number, team status)

#### Code Quality
- ✅ TypeScript throughout — excellent for maintainability
- ✅ Mongoose schemas with validation — good
- ⚠️ **Recommend:** Add comprehensive API documentation (Swagger/OpenAPI)
- ⚠️ **Recommend:** Add unit tests for critical logic (scoring engine, points table calculation)
- ⚠️ **Recommend:** Set up ESLint + Prettier for consistent code style

#### Monitoring
- ⚠️ **Recommend:** Add error tracking (Sentry free tier)
- ⚠️ **Recommend:** Add uptime monitoring (UptimeRobot free tier)
- ⚠️ **Recommend:** Add server health check endpoint (already has basic `/` endpoint)

### 7.4 Business Suggestions

| # | Suggestion | Details |
|---|---|---|
| 1 | **Sponsorship Tiers** | Create digital sponsorship packages (Platinum/Gold — already done ✅). Offer sponsor logos on website, social media mentions, banner ads during live matches |
| 2 | **Paid Team Registration** | Already integrated with eSewa ✅ — generates revenue from registration fees |
| 3 | **Advertisement Space** | Add banner ad slots on the website for local businesses |
| 4 | **Live Streaming Monetization** | Partner with local streaming platforms or use YouTube monetization |
| 5 | **Merchandise Store** | Sell team jerseys, caps, merchandise through the platform |
| 6 | **Data Analytics Reports** | Sell post-tournament analytics reports to sponsors and teams |
| 7 | **Player Stats Portfolio** | Players can use their verified stats for professional opportunities |

### 7.5 Pre-Launch Checklist

- [ ] Set up custom domain (e.g., `uppl.com.np`)
- [ ] Configure SSL (auto with Vercel/Render)
- [ ] Update all environment variables for production
- [ ] Switch MongoDB to production cluster (M2+)
- [ ] Test payment flow end-to-end with real eSewa transactions
- [ ] Test social login (Google & Facebook) in production
- [ ] Add Google Analytics / tracking
- [ ] Test email delivery (Nodemailer)
- [ ] Test all admin workflows
- [ ] Set up backup strategy for MongoDB

---

## 8. Handover Checklist

### What the Client Receives

| Item | Status | Notes |
|---|---|---|
| Full Source Code (Git Repo) | ✅ | Private repository with full commit history |
| Admin Credentials | ✅ | Super Admin login credentials |
| Database Access | ✅ | MongoDB Atlas read-only or admin access |
| Cloudinary Access | ✅ | Media storage access |
| Firebase Project Access | ✅ | Social auth configuration |
| Domain Access | ⬜ | If purchased |
| Hosting Dashboard Access | ⬜ | Vercel + Render login |
| eSewa Merchant Access | ⬜ | If set up |
| SSL Certificates | ✅ | Auto-managed |

### Training & Knowledge Transfer

| Item | Recommended |
|---|---|
| Admin Training Session (1-2 hrs) | ✅ Show how to manage matches, scoring, news, gallery |
| User Manual PDF | ✅ Included in delivery |
| Video Tutorials | ⬜ Can be recorded on request |
| Post-Launch Support Period | ✅ 30 days bug-fix included |

---

## Contact for Support

For technical support, bug fixes, or new feature development:

**Developer:** [Your Name / Agency Name]  
**Email:** [Your Email]  
**Phone:** [Your Phone]  
**Response Time:** Within 24 hours (business days)

---

*Document generated for UPPL — Udaydev Patan Premier League*  
*Last Updated: June 2026*
