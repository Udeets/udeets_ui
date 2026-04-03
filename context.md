**uDeets**

Full Project Context Document

Generated: April 1, 2026 \| Updated: April 3, 2026 --- Session 4

Sessions: Claude.ai Architect + Claude Code Developer

**1. PRODUCT OVERVIEW**

uDeets --- \"Deets that matter. Simplified and organized.\"

A mobile-first community hub app where users create or join Hubs
(groups) for temples, restaurants, clubs, associations, and local
communities. Members stay informed via a structured activity feed called
Deets (slang for Details).

Bigger vision: uDeets is a free micro-website + community platform for
every small business and local community that can\'t afford or doesn\'t
want a website. It replaces WhatsApp groups, Facebook pages, Google
Business listings, and static websites for SMBs, vendors, handymen,
cloud kitchens, lawn mowers, and local communities.

-   Live URL: https://udeets-ui-web.vercel.app

-   Repo: GitHub (source of truth)

-   Local dev: http://localhost:3000

-   Initial market: Richmond, Virginia → US → India

**2. TECH STACK**

  ------------------------- -------------------------------------------------
  **Layer**                 **Technology**
  Frontend                  Next.js 16 App Router + Tailwind CSS v4
  Backend/Auth/DB/Storage   Supabase (cloud, project: psckhdbtissnmdgcfwgo)
  Deployment                Vercel
  Future Migration          AWS (Auth, API, DB, Storage) --- Phase 2
  ------------------------- -------------------------------------------------

Monorepo structure: apps/web/ is the Next.js app

**3. TEAM / ROLES**

  ---------------------- -----------------------
  **Role**               **Who**
  Product Owner          You
  Architect + UI/UX      Claude.ai
  Full Stack Developer   Claude Code (VS Code)
  Source of Truth        GitHub
  ---------------------- -----------------------

**4. DESIGN NORTH STAR**

Primary: Band App (band.us) --- mobile-first, clean, premium community
feel

Secondary: linear.app, resend.com, circle.so, luma.app

**Brand:**

-   Primary teal: \#0C5C57

-   Light teal accent: \#E3F1EF

-   Cover/placeholder teal: \#A9D1CA

-   White backgrounds everywhere (mint → white migration DONE)

-   Font: Serif bold headings + clean sans-serif body

**5. DATABASE SCHEMA (Supabase)**

**Tables built and migrated:**

> profiles (id, full\_name, avatar\_url, email, created\_at,
> updated\_at,
>
> notification\_preferences JSONB, privacy\_settings JSONB)
>
> hubs (id, name, category, visibility, hub\_type, cover\_url,
>
> logo\_url, description, tagline, location, created\_by,
>
> slug, template, website\_mode, accent\_color + many more cols)
>
> hub\_members (hub\_id, user\_id, role: creator\|admin\|member,
>
> status: active\|pending, created\_at)
>
> hub\_ctas (id, hub\_id, label, action\_type, action\_value,
>
> position, is\_visible, created\_at, updated\_at)
>
> deets/posts (id, hub\_id, user\_id, post\_type, content, pinned,
>
> created\_at, + media cols)
>
> attachments (id, post\_id, file\_url, file\_type, source)
>
> post\_likes (post\_id, user\_id, created\_at)
>
> post\_comments (id, post\_id, user\_id, content, created\_at)

**Migrations run:**

-   20260330\_create\_deets.sql

-   20260330\_enable\_deets\_rls.sql

-   20260330\_create\_deet\_media\_bucket.sql

-   20260330\_create\_hub\_members.sql + RLS fixes v1, v2

-   20260330\_backfill\_hub\_members.sql

-   20260330\_create\_profiles.sql

-   20260330\_add\_profile\_preferences.sql

-   20260401\_add\_hub\_visibility.sql

-   20260401\_create\_hub\_ctas.sql

-   20260401\_create\_hub\_sections.sql

-   20260402\_add\_hub\_accent\_color.sql (adds accent\_color text column to hubs)

-   20260402\_create\_deet\_interactions.sql (deet\_likes, deet\_comments tables + like\_count, comment\_count, view\_count on deets)

-   20260402\_hub\_members\_admin\_update\_rls.sql (allows hub creator to update any member row in their hub --- needed for approve/reject flow. Uses auth.uid()::text cast for created\_by comparison)

**Pending migrations:**

-   20260401\_add\_hub\_template\_fields.sql

-   20260401\_add\_attachment\_source.sql

**6. SERVICE LAYER ARCHITECTURE**

Rule: All Supabase calls go through service files, never directly in
pages/components.

> apps/web/lib/services/
>
> hubs/hub-types.ts + list-hubs.ts + update-hub.ts + query-utils.ts
>
> deets/deet-types.ts + list-deets.ts + create-deet.ts + query-utils.ts
>
> deets/deet-interactions.ts (toggleDeetLike, addDeetComment, listDeetComments, incrementDeetView, getDeetCounts, getDeetLikeStatus)
>
> members/member-types.ts + list-members.ts + list-members-client.ts + list-my-memberships.ts
>
> members/manage-members.ts (listPendingRequests, approveMemberRequest, rejectMemberRequest, fetchProfilesForUsers)
>
> attachments/attachment-types.ts
>
> profile/upsert-profile.ts
>
> ctas/cta-types.ts + list-ctas.ts + upsert-ctas.ts
>
> sections/section-types.ts + list-sections.ts
>
> apps/web/lib/hub-templates/ (ALL 10 CREATED)
>
> general (index.ts) \| food-dining.ts \| home-services.ts
>
> health-wellness.ts \| hoa.ts \| faith.ts
>
> pta.ts \| sports.ts \| events.ts \| retail.ts
>
> apps/web/lib/hub-color-themes.ts (6 preset themes: teal, blue, purple, coral, gold, slate)

**AWS Migration Readiness:**

-   ✅ All DB calls behind service files

-   ✅ No direct Supabase calls in pages/components

-   ✅ profiles table is canonical user data

-   ✅ Auth callback isolated

-   ⚠️ Storage bucket abstracted --- needs service file

-   ⚠️ Discover page raw fetch --- needs service file wrapper

**7. HUB TEMPLATE SYSTEM --- CORE ARCHITECTURE**

**The Big Vision**

uDeets is not just a community app. It is a free micro-website +
community platform for any small business or community that cannot
afford or does not want a website. Each Hub\'s About page looks and
feels like a real website for that business or community.

**Two Master Layouts**

-   Layout A --- Business Hub: Restaurant, Food Truck, Home Services,
    Health & Wellness, Events, Retail. Feel: Micro-website.
    Professional, discoverable, customer-facing.

-   Layout B --- Community Hub: HOA, Faith, PTA, Sports. Feel: Community
    portal. Warm, organized, member-focused.

**Template Config Architecture (getHubConfig returns):**

-   tabs\[\] --- which tabs show and in what order

-   postTypes\[\] --- what kinds of Deets can be posted

-   terminology{} --- renamed labels for this category

-   aboutSections\[\] --- which blocks appear on About page

-   defaultCTAs\[\] --- pre-populated CTA buttons

-   keyFields\[\] --- category-specific hub info fields

-   memberRoles{} --- role names and permissions

-   discoverCard{} --- how hub appears on Discover page

-   layout --- \'business\' \| \'community\'

**Members Tab --- Universal Rule (Decided April 2, 2026):**

ALL templates have a Members tab. Label is \'Members\' universally
across all 10 templates. No custom terminology per template for this
tab. Keeps code clean and UX consistent.

**Editable CTAs System:**

-   Admin can edit CTA buttons from Hub Settings

-   Button label (free text), Action type, Action value, Visibility
    toggle

-   Max 4 CTAs per hub

-   Pre-populated with category defaults on hub creation

-   CTA Action Types: url, whatsapp, phone, maps, email, doordash,
    ubereats, opentable, instagram, pdf

**Master Template Framework (9 points per category):**

1.  VARIANTS --- sub-types within category

2.  TERMINOLOGY --- renamed labels

3.  ABOUT PAGE --- sections and order

4.  TABS --- which tabs show

5.  POST TYPES --- what Deets can be posted

6.  KEY FIELDS --- category-specific info fields

7.  DEFAULT CTAs --- pre-populated buttons

8.  MEMBER ROLES --- role names and permissions

9.  DISCOVER CARD --- how it appears on Discover page

**8. HUB TEMPLATES --- STATUS**

  -------- ---------------------- --------------- -------------------------
  **\#**   **Template**           **Layout**      **Status**
  1        Food & Dining          Business Hub    ✅ Complete
  2        HOA & Residential      Community Hub   ✅ Complete
  3        Home Services          Business Hub    ✅ Config created
  4        Faith & Worship        Community Hub   ✅ Config created
  5        PTA & School           Community Hub   ✅ Config created
  6        Sports & Recreation    Community Hub   ✅ Config created
  7        Health & Wellness      Business Hub    ✅ Config created
  8        Events & Experiences   Business Hub    ✅ Config created
  9        Retail & Local Shop    Business Hub    ✅ Config created
  -------- ---------------------- --------------- -------------------------

All 10 templates use universal tabs: About, Posts, Attachments, Events, Members (simplified April 2, 2026). Template-specific sections (Menu, Services, etc.) will use images for now --- other options TBD.

**9. PAGES BUILT --- STATUS**

**✅ Completed Pages:**

-   Landing Page (/) --- needs premium redesign (resend/linear style)

-   Auth Page (/auth) --- Google OAuth + email/password

-   Dashboard (/dashboard) --- hubs rail + deets feed

-   Hub Page (/hubs/\[category\]/\[slug\]) --- full hub experience

-   Discover Page (/discover) --- server-side hub fetch

-   Profile Page (/profile) --- sidebar wiring pending

-   Settings Page (/settings) --- design refinement pending

-   Create Hub Page (/create-hub) --- multi-step modal

**10. PENDING FIXES**

**High Priority:**

10. Hub sidebar Settings highlight bug

11. Profile dropdown redesign (premium, Band-style)

12. Profile left sidebar wiring (My Hubs, My Posts, Requests,
    Invitations)

13. Settings page design improvement

14. Run preferences migration in Supabase dashboard

**Medium Priority:**

15. Unread dot on hub cards --- wire to real DB count

16. Author name in deet feed --- join with profiles

17. Post title showing \'Photo\' --- fix to show content preview

**11. DESIGN SYSTEM --- PENDING STANDARDIZATION**

Create apps/web/lib/theme.ts with:

**Colors:**

> PRIMARY: \#0C5C57 PRIMARY\_LIGHT: \#E3F1EF PRIMARY\_MID: \#A9D1CA
>
> PRIMARY\_DARK: \#1a3a35 BG\_PAGE: \#ffffff BG\_CARD: \#ffffff
>
> BG\_SUBTLE: \#fafafa TEXT\_PRIMARY: \#111111 TEXT\_SECONDARY: \#6b7280
>
> TEXT\_MUTED: \#9ca3af BORDER: \#e5e7eb BORDER\_FOCUS: \#0C5C57

**Buttons:**

> BTN\_PRIMARY: bg-\[\#0C5C57\] text-white hover:bg-\[\#0a4f4a\]
>
> BTN\_OUTLINE: border-\[\#0C5C57\] text-\[\#0C5C57\]
> hover:bg-\[\#E3F1EF\]
>
> BTN\_GHOST: text-\[\#0C5C57\] hover:bg-\[\#E3F1EF\]
>
> BTN\_DANGER: bg-red-500 text-white

**Animations:**

> TRANSITION\_DEFAULT: transition-colors duration-150
>
> HOVER\_SCALE: hover:scale-\[1.02\] transition-transform
>
> FADE\_IN: animate-fade-in (opacity 0→1, 150ms)

**12. TO-DOs (Session 2 --- April 1, 2026)**

**TO-DO \#1 --- Apple Sign In (Phase 1.5)**

-   Supabase supports Apple OAuth natively

-   Same callback route, same upsertProfile call

-   Requires Apple Developer account + Service ID

-   Mandatory before App Store submission

**TO-DO \#2 --- Email/Password Auth**

-   Keep as-is, already safe

-   Don\'t prominently promote --- Google + Apple are primary CTAs

**TO-DO \#3 --- Dashboard: Three-Tab Hub Rail**

-   My Hubs → role = \'creator\'

-   Joined Hubs → role IN (\'admin\',\'member\') AND status = \'active\'

-   Requested Hubs → status = \'pending\'

-   Ensure backfill migration doesn\'t auto-populate new users

**TO-DO \#4 --- Landing Page Redesign**

-   resend.com + linear.app aesthetic

-   Strong typography, subtle animations

-   Mobile + desktop equally treated

**TO-DO \#5 --- Hub Photos Auto-Population**

-   DP and cover uploads auto-appear in Photos section

-   Add source column to attachments table (\'cover\' \| \'dp\' \|
    \'post\')

-   Insert attachment record on cover/DP upload

**TO-DO \#6 --- Join Hub Confirmation Modal**

-   Public hub → bottom sheet confirming join + CTA to Deets

-   Private hub → \'Awaiting Approval\' state + confirmation message

**TO-DO \#7 --- Hub Content Gating**

-   Non-member + public hub → Header + About only + Join CTA

-   Non-member + private hub → Header + About only + Request CTA

-   Member → full tab access

-   Derive isMember + isPending in HubClient.tsx

**TO-DO \#8 --- Profile Photo Change**

-   Tap avatar → file picker → upload → update profiles.avatar\_url

-   Camera icon overlay on avatar hover/tap

**TO-DO \#9 --- Improved Confetti**

-   Multiple burst origins, higher particle count

-   Teal + white + gold mix

-   Staggered \'pop pop pop\' effect

**TO-DO \#10 --- Post Composer Photo Attachment**

-   Thumbnail strip below text input

-   Horizontal scroll for multiple photos, ✕ to remove each

**TO-DO \#11 --- Deet Card Image Consistency**

-   Fixed 16:9 aspect ratio

-   object-cover with max-height 280px

**TO-DO \#12 --- Post Types: News / Deals / Hazards**

-   Add NEWS, DEAL, HAZARD, ALERT post types

-   Filter chips on Deets feed: All \| Announcements \| News \| Deals \|
    Alerts

-   Hazard posts get red left-border accent

**TO-DO \#13 --- Full Responsive Hybrid Layout**

-   Mobile (\<768px): bottom nav bar, single column, bottom sheets

-   Desktop (≥1024px): top navbar, sidebars, multi-column

-   Every component designed at 375px first, adapted up

**TO-DO \#14 --- Hub Template System**

-   Add template, website\_mode, accent\_color columns to hubs table

-   Create hub\_ctas table

-   Create lib/hub-templates/ config files

-   Template selected during hub creation (new step)

-   HubClient.tsx reads template config and renders accordingly

-   10 templates total --- see Section 8

**TO-DO \#15 --- Editable CTAs**

-   hub\_ctas table (id, hub\_id, label, action\_type, action\_value,
    position, is\_visible)

-   Admin edits CTAs from Hub Settings

-   Max 4 CTAs per hub, pre-populated with category defaults

-   Action types: url, whatsapp, phone, maps, email, doordash, ubereats,
    opentable, instagram, pdf

**13. TO-DOs (Session 3 --- April 2, 2026)**

Issues discovered during live mobile testing of the hybrid layout
update:

**TO-DO \#16 --- Auth: Hide Supabase URL on Sign-In**

-   Supabase callback URL is being exposed on the sign-in screen

-   OAuth redirect must go through Vercel URL, not directly to Supabase

-   Fix redirect URL configuration in Supabase Auth settings + code

**TO-DO \#17 --- Enable Email/Password Auth**

-   Supabase dashboard → Authentication → Providers → Email → toggle ON

-   No code changes needed, just a config toggle

-   Promote email/password to same visual level as Google button on auth
    page

-   Reason: avoids dependency on Google OAuth during dev/testing

**TO-DO \#18 --- Basic Auth Validation**

-   Email format check

-   Password minimum length (8 characters)

-   Confirm password match on signup

-   Clear error messages for wrong credentials

**TO-DO \#19 --- Join Button State Update (Private Hub)**

-   After request modal is confirmed, button must flip to \'Requested /
    Awaiting Approval\' immediately

-   Optimistic UI update --- no page reload required

-   State should persist across tab switches

**TO-DO \#20 --- Public Hub Join: Insert hub\_members Record**

-   When user joins a public hub, insert row into hub\_members with
    status: active, role: member

-   Currently the insert may not be happening or tabs are not gating on
    membership check

-   Members tab should reflect the new member immediately after join

**TO-DO \#21 --- Discover Page: Show User\'s Own Hubs**

-   Currently user\'s own created hubs do not appear on Discover

-   Discover should show all hubs including where created\_by =
    current\_user

-   Check if query is filtering out creator\'s own hubs

**TO-DO \#22 --- Universal Members Tab Across All Templates**

-   Every hub template must include a Members tab

-   Label is \'Members\' universally --- no custom per-template
    terminology for this tab

-   Applies to all 10 templates including Faith & Worship (previously
    missing)

-   Decision made April 2, 2026 --- keep it simple and consistent

**TO-DO \#23 --- Avatar DP Circle Clipping Fix**

-   Profile picture / DP circle is showing only half, the rest is cut
    off

-   CSS fix: ensure overflow: hidden + correct centering + object-cover
    within avatar container

-   Check all avatar instances: hub DP, profile page, post composer,
    deet feed author

**13b. TO-DOs (Session 4 --- April 3, 2026)**

Continued from Session 3 batch 2. All completed this session.

**TO-DO \#24 --- Remove Cover Image Toast on DP Upload** ✅

-   useHubMediaFlow.ts: success toast now only shows for gallery uploads, not DP or cover

**TO-DO \#25 --- Remove Quick Action CTA Section** ✅

-   Entire CTA block removed from AboutSection.tsx (BLOCK 1.5)

**TO-DO \#26 --- Remove \"Display picture updated\" Text** ✅

-   Combined with \#24 --- both DP and cover success messages suppressed

**TO-DO \#27 --- Simplify All Template Tabs to Universal Set** ✅

-   All 10 templates now use: \[\"About\", \"Posts\", \"Attachments\", \"Events\", \"Members\"\]

-   Previously each template had different tab names (Notices, Polls, Reviews, etc.)

**TO-DO \#28 --- Preset BG Color Palette for Hub Templates** ✅

-   6 curated themes: Teal (default), Ocean Blue, Royal Purple, Warm Coral, Golden Amber, Classic Slate

-   New file: lib/hub-color-themes.ts (HubColorTheme type, getHubColorTheme helper)

-   accent\_color column added to hubs table

-   Color picker added to Settings \> Profile section

-   Wired through: hub-types.ts, update-hub.ts, query-utils.ts, useHubSettingsFlow.ts, SettingsSection.tsx, HubClient.tsx

**TO-DO \#29 --- Wire Requested Hubs Tab on Dashboard** ✅

-   Already implemented in Session 3: dashboard filters by status === \"pending\", shows \"Awaiting Approval\" badge on DashboardHubCard

**TO-DO \#30 --- Wire Likes, Comments, Views on Deets to Supabase** ✅

-   New tables: deet\_likes (user\_id + deet\_id, unique), deet\_comments (body + user\_id)

-   Denormalized counters: like\_count, comment\_count, view\_count on deets table

-   Service layer: deet-interactions.ts (toggleDeetLike, addDeetComment, listDeetComments, incrementDeetView, getDeetCounts, getDeetLikeStatus)

-   Hook: useDeetInteractions.ts (manages like state, optimistic UI with loading spinner)

-   DeetsSection.tsx: like button now shows filled heart when liked, spinner while processing

-   Mapper updated: map-deet-to-hub-feed-item.ts reads real DB counts instead of hardcoded 0

**TO-DO \#31 --- Reorder About Page Layout with Collapsible Cards** ✅

-   New layout order: Welcome header → Editable description → (Connect + About this hub + Members) as 3 collapsible cards side-by-side → Photos in horizontal scrollable row → Custom sections

-   Added CollapsibleCard component with ChevronDown toggle animation

-   Photos now display as a horizontal row of 28x28 thumbnails (max 6 visible + \"+N more\" button)

-   3-column grid collapses to stack on mobile

**TO-DO \#32 --- Member Approval Flow for Hub Admins** ✅

-   Problem: admins could see \"Requested\" status but had no way to approve/reject

-   New RLS policy: hub creator can update any membership row in their hub (uses hubs.created\_by = auth.uid()::text to avoid type mismatch)

-   New service: manage-members.ts (listPendingRequests, approveMemberRequest, rejectMemberRequest, fetchProfilesForUsers)

-   MembersSection.tsx: amber \"Pending Requests\" card shows at top of Members tab for admins, with green checkmark (approve) and red X (reject) per request

-   HubClient.tsx: loads pending requests alongside active members, handles approve/reject with optimistic UI (spinner during processing, moves approved users to member list, removes rejected)

-   Reject sets status to \"rejected\" (not delete) --- the text column accepts any value

**14. PHASE PLAN**

**Phase 1 --- Current (Richmond, VA launch):**

-   Fix all pending bugs

-   Implement responsive hybrid layout

-   Hub template system (10 categories)

-   Editable CTAs

-   Content gating for non-members

-   Three-tab dashboard (My Hubs / Joined / Requested)

-   Post types (News, Deal, Hazard, Alert)

-   Landing page redesign

**Phase 1.5:**

-   Apple Sign In

-   Theme standardization (lib/theme.ts)

-   ✅ Wire Like/Comment to Supabase (Session 4)

-   Real author names in feed

-   vercel.json monorepo deployment

**Phase 2 --- Scale:**

-   AWS migration (swap service layer)

-   More hub categories

-   HOA payment integration (Stripe)

-   Notifications system

-   Analytics for hub admins

-   India market launch

-   White-label for RWA/apartment communities

**Phase 3 --- Platform:**

-   Native mobile app (React Native or PWA)

-   Hub Pro + Business Hub paid tiers

-   AI features (post summarization, local news curation)

-   Events system

-   Polls with results visualization

**15. MONETIZATION (Future)**

  -------------- --------------- -------------------------------------------------------------
  **Tier**       **Price**       **Features**
  Free           \$0             Basic hub, uDeets branding, 1 admin
  Pro Hub        \$9.99/month    Custom accent color, remove branding, analytics, 3 admins
  Business Hub   \$19.99/month   Priority in Discover, booking integration, unlimited admins
  -------------- --------------- -------------------------------------------------------------

**16. AWS MIGRATION READINESS**

  --------------------------- -------------------------------
  **Concern**                 **Status**
  Service layer separation    ✅ Done
  No direct Supabase in UI    ✅ Done
  profiles table portable     ✅ Done
  Auth callback isolated      ✅ Done
  Storage bucket abstracted   ⚠️ Needs service file
  Discover page raw fetch     ⚠️ Needs service file wrapper
  --------------------------- -------------------------------

**Migration sequence when ready:**

18. Storage → S3 + CloudFront

19. Auth → Cognito

20. DB → Aurora Serverless

21. API → Lambda + API Gateway

**17. IMPORTANT DECISIONS MADE**

-   No chat in Phase 1

-   No Stripe in Phase 1 --- payment links only

-   Band app is UX north star

-   Mobile-first always --- 375px first, adapt up

-   White backgrounds throughout

-   hub\_members.role: creator \| admin \| member

-   Discover page accessible without login

-   Hub Type controls posting: broadcast \| admin\_members \| open

-   Always capture Full Name on OAuth signup

-   Confetti colors: teal palette

-   Create Hub is a modal overlay

-   Hub page: 2-column layout

-   Email/password kept but not prominently promoted

-   Local News/Deals/Hazards as post types with filter chips (Phase 1)

-   Hub content gated by membership

-   uDeets = free micro-website replacement for SMBs and communities

-   Hub About page = micro-website per category template

-   Editable CTAs replace static menu photos and links

-   No standalone HOA app --- HOA is a hub template inside uDeets

-   Initial focus: Richmond, Virginia → US → India

-   Template system built now (not Phase 2) to avoid full rewrite later

-   ALL templates have Members tab --- label \'Members\' universally
    (April 2, 2026)

-   Email/password auth to be enabled and equally visible as Google
    OAuth (April 2, 2026)

-   All templates use universal tabs: About, Posts, Attachments, Events, Members (April 2, 2026)

-   Preset color palette (6 themes) instead of full color picker (April 2, 2026)

-   Template-specific sections (Menu, Services, etc.) use images only for now (April 2, 2026)

-   About page layout: Welcome → Description → 3 collapsible cards (Connect, About, Members) → Photos row (April 3, 2026)

-   Member approval: admin approves/rejects from Members tab; reject sets status to \"rejected\" not delete (April 3, 2026)

-   hubs.created\_by is text type, auth.uid() is uuid --- always cast with ::text in RLS policies (April 3, 2026)

**18. DEVELOPMENT PRINCIPLES**

22. Service layer first --- all DB calls through lib/services/

23. Mobile-first always --- 375px, adapt up

24. Both breakpoints required --- mobile AND desktop for every feature

25. No hardcoded colors --- use lib/theme.ts

26. Lucide React only --- consistent stroke weight

27. White backgrounds --- BG\_SUBTLE (\#fafafa) for content areas

28. AWS-ready --- service interfaces swappable without touching UI

29. Schema changes = migration file --- no direct dashboard edits

30. Template-driven rendering --- HubClient reads config, never
    hardcodes category logic

31. Editable over static --- admins control their content, no hardcoded
    fields

**19. FILE ARCHITECTURE MAP**

> apps/web/
>
> ├── app/
>
> │ ├── page.tsx --- Landing page
>
> │ ├── layout.tsx --- Root layout
>
> │ ├── auth/page.tsx + callback/route.ts
>
> │ ├── dashboard/page.tsx + DashboardHubCard.tsx
>
> │ ├── discover/page.tsx + DiscoverPageContent.tsx
>
> │ ├── hubs/\[category\]/\[slug\]/
>
> │ │ └── page.tsx + HubClient.tsx + HubHeroHeader.tsx
>
> │ │ └── HubSidebarNav.tsx + components/about/AboutSection.tsx
>
> │ ├── profile/page.tsx
>
> │ ├── settings/page.tsx
>
> │ └── create-hub/page.tsx
>
> ├── lib/
>
> │ ├── theme.ts --- TO CREATE
>
> │ ├── supabase/client.ts + server.ts + middleware.ts
>
> │ ├── hub-templates/ --- TO CREATE
>
> │ │ └── food-dining.ts \| hoa.ts \| home-services.ts \| faith.ts
>
> │ │ └── pta.ts \| sports.ts \| health-wellness.ts \| events.ts
>
> │ │ └── retail.ts \| index.ts
>
> │ └── services/
>
> │ ├── hubs/hub-types.ts + list-hubs.ts + update-hub.ts + query-utils.ts
>
> │ ├── deets/deet-types.ts + list-deets.ts + create-deet.ts + query-utils.ts + deet-interactions.ts
>
> │ ├── members/member-types.ts + list-members.ts + list-members-client.ts + list-my-memberships.ts + manage-members.ts
>
> │ ├── attachments/attachment-types.ts
>
> │ ├── profile/upsert-profile.ts
>
> │ ├── ctas/cta-types.ts + list-ctas.ts + upsert-ctas.ts
>
> │ └── sections/section-types.ts + list-sections.ts
>
> ├── components/ --- navbar, shared UI
>
> └── supabase/migrations/
>
> ├── 20260330\_create\_deets.sql + enable\_deets\_rls + create\_deet\_media\_bucket
>
> ├── 20260330\_create\_hub\_members.sql + fix\_rls\_v1 + fix\_rls\_v2
>
> ├── 20260330\_create\_profiles.sql + add\_profile\_preferences + backfill\_hub\_members
>
> ├── 20260401\_add\_hub\_visibility.sql + create\_hub\_ctas.sql + create\_hub\_sections.sql
>
> ├── 20260402\_add\_hub\_accent\_color.sql
>
> ├── 20260402\_create\_deet\_interactions.sql (deet\_likes, deet\_comments, count cols)
>
> ├── 20260402\_hub\_members\_admin\_update\_rls.sql (creator can approve/reject)
>
> ├── 20260401\_add\_hub\_template\_fields.sql --- PENDING
>
> └── 20260401\_add\_attachment\_source.sql --- PENDING

*Context last updated: April 3, 2026 --- Session 4*

*Session 4 completed: All 8 batch-2 items + member approval flow. Clean TypeScript compile. Push to GitHub and run new migrations in Supabase before testing.*

*Next session priorities: Landing page redesign, profile sidebar wiring, real author names in deet feed, unread dot on hub cards, theme standardization (lib/theme.ts)*
