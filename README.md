# uDeets – The Local Community Hub Platform

uDeets is a modern community hub platform designed to help people discover, create, and stay connected with local communities, organizations, and businesses.

The platform enables communities (temples, associations, restaurants, fitness groups, etc.) to create digital hubs where they can share announcements, events, offers, and updates — while users subscribe and stay informed.

---

## 🚀 Current Status – v0 (Frontend-First)

This repository contains the **frontend-first implementation (v0)** of uDeets.

The goal of v0 is to:

- Validate UI/UX
- Establish routing architecture
- Lock in brand system and design consistency
- Prove the Discover → Hub → Engagement flow
- Prepare for backend integration

No backend or persistent data layer is implemented yet. All data is mock-driven and client-side.

---

## 🛠 Tech Stack

- Next.js (App Router)
- React
- Tailwind CSS
- Static assets from `/public`
- Monorepo-ready structure under `apps/web`

---

## 📂 Project Structure (High-Level)

```
apps/
  web/
    app/
      page.tsx                  → Home (/)
      auth/page.tsx             → Auth UI (/auth)
      discover/page.tsx         → Discover hubs (/discover)
      hubs/
        [category]/
          [slug]/
            page.tsx            → Dynamic hub route
            HubClient.tsx       → Interactive hub UI
public/
  hub-images/
  udeets-logo.png
```

---

## 🧭 Routing Architecture

| Route | Purpose |
|--------|----------|
| `/` | Landing page |
| `/auth` | Sign In / Sign Up UI |
| `/discover` | Hub discovery (search + near me filtering) |
| `/hubs/[category]/[slug]` | Individual hub detail page |

Dynamic routing pattern:

```
/hubs/[category]/[slug]
```

Example:

```
/hubs/communities/richmond-kannada-sangha
```

---

## 🎨 Design System (Locked Standards)

uDeets follows a strict visual system to maintain consistency.

### Gradient System

All major surfaces use a two-color gradient:

```
bg-gradient-to-br from-teal-500 to-cyan-500
```

### Header Rules

- Full width layout
- Extreme left: logo + uDeets
- Extreme right: navigation / actions
- Shadow separator below header

### Footer Rules

- Compact height (`h-16`)
- Same gradient as header
- © text left
- Social icons right

### Styling Principles

- Clean, minimal hierarchy
- White primary text on gradient surfaces
- Tailwind-first architecture
- Reusable layout logic

---

## 🔎 Discover Page Behavior

- Search bar filters hubs client-side
- “Near Me” radius filter dynamically filters results
- When searching or selecting radius:
  - Only one unified Results section renders
  - All hub cards remain equal width
- No backend calls (mock-driven filtering)

---

## 🏗 System Architecture (High-Level)

Frontend (Next.js App Router)

User → Home → Discover → Hub Detail  
Discover & Hub pages read from mock data (client-side)  

Future:

Frontend → API Routes → Database  
Frontend → Auth Provider  

---

## 🔮 Roadmap

### Phase A – Component Consolidation

- Extract shared Header and Footer components
- Create reusable HubCard and HubGrid
- Centralize branding constants
- Move mock data to shared module

### Phase B – API Layer

- Introduce `/app/api/hubs`
- Convert Discover + Hub pages to fetch-based architecture
- Define stable data contracts

### Phase C – Authentication + Dashboard

- Add authentication provider
- Implement `/dashboard`
- Add subscription logic
- Introduce user feed
- Persist hub ownership and content

---

## 🧪 Running Locally

From project root:

```bash
npm install
npm run dev
```

App runs at:

```
http://localhost:3000
```

---

## 📌 Vision

uDeets aims to become the unified digital infrastructure layer for local communities, where organizations broadcast and users subscribe to information that matters.

**Information that matters. Portal that connects.**
