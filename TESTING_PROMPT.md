# AlegoMind — Complete User Flows & Chrome Tester Prompt

## DEMO ACCOUNTS
- **Seeker (client):** seeker@demo.com / Demo1234!
- **Dr. Andrei M. (Therapist):** andrei.m@demo.alegomind.ro / Demo1234!
- **Dr. Elena R. (Therapist):** elena.r@demo.alegomind.ro / Demo1234!
- **Mihai T. (Coach):** mihai.t@demo.alegomind.ro / Demo1234!
- **Lena P. (Coach):** lena.p@demo.alegomind.ro / Demo1234!
- **Ali R. (Mentor):** ali.r@demo.alegomind.ro / Demo1234!
- **Sara M. (Mentor):** sara.m@demo.alegomind.ro / Demo1234!
- **Base URL:** http://localhost:3001

---

## ALL USER FLOWS

### FLOW 1 — Public Home Page (/)
- Hero section with headline + CTA buttons ("Incepe acum", "Explorez profesioniști")
- Section showing 3 featured professionals (cards with name, type badge, specializations, price, rating)
- Click a professional card → goes to /profesionist/[id]
- "Incepe acum" → goes to /inregistrare (if not logged in)
- No auth required

### FLOW 2 — Explore Professionals (/explorez)
- Full list of professionals with filter/search
- Filter by type (Terapeut / Coach / Mentor), specialization, price, format
- Click a card → /profesionist/[id]

### FLOW 3 — Professional Profile (/profesionist/[id])
- Header: avatar, name, TypeBadge, specializations, rating, reviews
- Tabs: Despre / Specializari / Recenzii / Disponibilitate
- **Desktop sidebar:** two action buttons:
  - "Rezervă ședință" → /rezervare/[id]/tip
  - "Trimite mesaj" → should create a conversation with this professional and go to /conversatii/[newConvId]
    ⚠️ BUG: currently links to /conversatii (generic list) — needs to call createConversation(id) first
- **Mobile sticky bar (bottom):** same two buttons — "Mesaj" and "Rezervă ședință"

### FLOW 4 — Auth: Register (/inregistrare)
- Email + password + first name + last name
- Account type: SEEKER or PROFESSIONAL
- On success → /onboarding/tip (seeker) or /profesionist/inregistrare (professional)

### FLOW 5 — Auth: Login (/autentificare)
- Email + password
- On success → / or last visited page
- Shows error for wrong credentials

### FLOW 6 — Onboarding (seeker only, /onboarding/*)
- Step 1 /tip: Choose professional type (Terapeut / Coach / Mentor)
- Step 2 /obiective: Choose goals (multi-select)
- Step 3 /preferinte: Price range, session format preferences
- Step 4 /comunicare: Preferred communication style
- On complete → /acasa

### FLOW 7 — Dashboard Home (/acasa) [requires login as seeker]
- Quick links: Sesiuni, Conversatii, Profil, Asistent AI
- Upcoming session card (if any)
- Recommended professionals

### FLOW 8 — Book Session Flow [seeker]
- Step 1 /rezervare/[proId]/tip — select session type (video/voice/in-person)
- Step 2 /rezervare/[proId]/program — pick date/time from pro's availability calendar
- Step 3 /rezervare/[proId]/confirmare — review + pay with Stripe (test card 4242 4242 4242 4242, any future date, any CVC)
- On success → /rezervare/confirmat/[bookingId]
- Confirmed page shows booking details + buttons to view in Sesiuni or go back home

### FLOW 9 — Sessions Page (/sesiuni) [seeker]
- Two tabs: "Viitoare" (upcoming) and "Trecute" (past)
- **Upcoming session card shows:**
  - Professional name, type, date/time, format
  - "Mesaj profesionist" button → creates conversation with that pro → /conversatii/[id]
  - "Anulează" button → shows "Are you sure?" confirm dialog
    - If less than 24h before session: shows error "Cannot cancel within 24h"
    - If >24h: confirms cancellation, card moves to past tab as CANCELLED
- **Past session card shows:**
  - Status badge (COMPLETED or CANCELLED)
  - "Rezervă din nou" button → goes to /rezervare/[proId]/tip (for ALL past sessions including CANCELLED)
  - No cancel button

### FLOW 10 — Conversations List (/conversatii) [seeker]
- AI Assistant pinned at top with blue brand styling → links to /asistent
- Below: list of professional conversations sorted by most recent message
  - Avatar, professional name, TypeBadge
  - Last message preview + relative timestamp
  - Unread indicator (if applicable)
- Empty state: "Nu ai nicio conversație" + "Găsește un profesionist" CTA → /explorez
- Click any conversation → /conversatii/[id]

### FLOW 11 — CHAT PAGE (/conversatii/[id]) [seeker] ⬅️ MAIN NEW FEATURE
This is the core of the new feature. Here is exactly what should happen:

**When chat opens (PENDING_TOPIC state):**
1. Header: back arrow → /conversatii, professional avatar + name + TypeBadge
2. Professional's welcome message appears in the chat bubble (auto-sent when conversation was created)
3. Below the messages: "Alege un subiect pentru a incepe conversatia" label
4. Option cards appear:
   - **FREE option (green border, green badge "Gratuit"):** "Intrebare despre sedinta rezervata"
     - ONLY shown if seeker has an UPCOMING (PENDING or CONFIRMED) booking with this professional
     - If no upcoming booking → this card is hidden
   - **PAID options (regular cards, brand color badge with price in RON):**
     - These come from the professional's chat_services table
     - Example for Dr. Andrei: "Consultatie initiala" 60 RON, "Sesiune de urgenta" 80 RON
5. Input bar at bottom is DISABLED (opacity 40%, not clickable)

**When seeker selects FREE option:**
1. Topic tag appears below header: green background, "Gratuit" on right, topic label on left
2. Professional sends an automatic contextual response message in chat
3. Input bar becomes ACTIVE (full opacity, clickable)
4. Seeker can now type and send messages
5. Option cards disappear

**When seeker selects PAID option:**
1. Stripe payment modal slides up from bottom
2. Shows topic name + price
3. Card input field (Stripe Elements)
4. "Plateste X RON" button
5. Use test card: 4242 4242 4242 4242, 12/26, 123
6. On success → modal closes, topic tag appears below header (brand color, shows price)
7. Professional sends contextual response message
8. Input bar becomes ACTIVE
9. Option cards disappear

**When chat is ACTIVE:**
1. Seeker can type in the input bar and press Enter or the send button
2. Messages appear as bubbles (mine = right + brand color, theirs = left + white)
3. Date separator appears between days
4. Time shown under last message in a group
5. "Incarca mesaje mai vechi" button if more than 30 messages

**Entry points into a chat (how you start a conversation):**
1. From /sesiuni → "Mesaj profesionist" on an upcoming session card
2. From /profesionist/[id] → "Trimite mesaj" button (BUG: currently broken)
3. From /conversatii → clicking an existing conversation
4. Direct URL /conversatii/[id]

### FLOW 12 — AI Assistant (/asistent) [seeker]
- Chat interface with Claude AI
- General mental health / coaching questions

### FLOW 13 — Profile (/profil) [seeker]
- Edit display name, first/last name, avatar
- View/edit preferences
- Subscription tier (FREE / PLUS)

### FLOW 14 — Pro Panel (/profesionist/panou) [professional]
- Dashboard with stats: total sessions, upcoming, revenue, active clients
- Quick actions

### FLOW 15 — Pro Sessions (/profesionist/sedinte) [professional]
- List of upcoming and past sessions
- Accept/reject pending bookings
- Session details

### FLOW 16 — Pro Messages (/profesionist/mesaje) [professional]
- List of active conversations with clients
- Click → chat interface to respond to client messages

### FLOW 17 — Pro Clients (/profesionist/clienti) [professional]
- List of all clients who have booked or messaged
- Client details

### FLOW 18 — Pro Stats (/profesionist/statistici) [professional]
- Revenue charts, session counts, ratings

---

## KNOWN BUGS TO FIX (already identified)
1. `/profesionist/[id]` "Trimite mesaj" → links to /conversatii instead of creating conversation with that specific pro
2. After migration: chat page needs migration+seed run to show topic options
3. Chat page: no entry point from explore/profile works correctly yet

---

## CHROME EXTENSION TESTING PROMPT

Copy the text below and paste it into the Claude in Chrome extension:

---

You are a QA tester for AlegoMind, a Romanian mental health and coaching platform running at http://localhost:3001. Your job is to navigate through every user flow, report exactly what you see (including errors, missing UI elements, broken buttons, wrong behavior), and give me a numbered list of bugs found.

**DEMO ACCOUNTS:**
- Seeker: seeker@demo.com / Demo1234!
- Therapist Dr. Andrei: andrei.m@demo.alegomind.ro / Demo1234!
- All professionals use Demo1234!

**TEST CARD (Stripe):** 4242 4242 4242 4242 | 12/26 | 123

---

Test each flow below in order. For each one, tell me:
✅ PASS — if it works exactly as expected
❌ FAIL — what you expected vs what actually happened
⚠️ PARTIAL — works but something is off (describe it)

---

**FLOW 1: Public home page**
Go to http://localhost:3001
- Does the page load without errors?
- Are there professional cards visible?
- Click a professional card — does it go to /profesionist/[id]?
- Are there "Incepe acum" and "Explorez" buttons?

**FLOW 2: Professional profile page**
Go to http://localhost:3001/explorez, click any professional.
- Does the profile page load (avatar, name, TypeBadge, tabs)?
- Desktop: is there a sidebar with "Rezervă ședință" and "Trimite mesaj" buttons?
- Mobile (resize to 375px): is there a sticky bottom bar with "Mesaj" and "Rezervă ședință"?
- Click "Trimite mesaj" — does it GO to /conversatii/[id] with that specific professional, OR does it just go to the generic /conversatii list?
  (Expected: should create a conversation and go to /conversatii/[specificId]. Bug if it just goes to /conversatii)

**FLOW 3: Login**
Go to http://localhost:3001/autentificare
- Log in as seeker@demo.com / Demo1234!
- Does it redirect to home/dashboard after login?
- Does the navigation show the user is logged in?

**FLOW 4: Dashboard home**
Go to http://localhost:3001/acasa
- Does the page load?
- Are there quick-link cards (Sesiuni, Conversatii, Profil, Asistent)?
- Is there an upcoming session card if one exists?

**FLOW 5: Sessions page — Upcoming tab**
Go to http://localhost:3001/sesiuni
- Does "Viitoare" (upcoming) tab show bookings?
- Does each upcoming booking card have a "Mesaj profesionist" button?
- Click "Mesaj profesionist" on a booking — does it go to /conversatii/[id] for that professional? Or does it error?
- Does each upcoming booking have an "Anulează" button?
- Click "Anulează" — does a confirmation dialog appear ("Ești sigur?")?
- In the dialog, click confirm — does the session get cancelled?

**FLOW 6: Sessions page — Past tab**
Click the "Trecute" tab on /sesiuni
- Are past/cancelled sessions shown?
- Does EVERY past session (including CANCELLED ones) show a "Rezervă din nou" button?
- Is there NO "Anulează" button on past sessions?
- Click "Rezervă din nou" — does it go to /rezervare/[proId]/tip?

**FLOW 7: Conversations list**
Go to http://localhost:3001/conversatii
- Is the AI assistant pinned at the top (blue styling)?
- Are professional conversations listed below?
- Does each conversation show: avatar, name, TypeBadge, last message preview, timestamp?
- If no conversations: is there an empty state with "Găsește un profesionist" CTA?
- Click a conversation → does it go to /conversatii/[id]?

**FLOW 8: Chat page — PENDING_TOPIC state (most important)**
Click on a conversation or navigate to /conversatii/[id].
- Does the header show: back arrow, pro avatar, pro name, TypeBadge?
- Is there a welcome message from the professional in the chat?
- Are there option cards below the messages? Specifically:
  - Is there a GREEN card "Intrebare despre sedinta rezervata" with "Gratuit" badge? (only if seeker has upcoming booking with this pro)
  - Are there PAID option cards with prices in RON? (e.g. "Consultatie initiala 60 RON")
  - If NO cards appear at all — that is a critical bug (may need DB migration run)
- Is the input bar DISABLED / greyed out?
- Can you type in the input bar? (you should NOT be able to)

**FLOW 9: Chat — Select FREE topic**
(Only if a free option card is visible)
Click the green "Intrebare despre sedinta rezervata" card.
- Does a topic tag appear below the header (green background, "Gratuit" on right)?
- Does a new message appear from the professional (contextual response)?
- Does the input bar become ACTIVE (full opacity, clickable)?
- Can you now type and send a message?
- Does the sent message appear as a bubble on the right in brand color?
- Do the option cards disappear?

**FLOW 10: Chat — Select PAID topic**
(Start fresh or use a conversation without a selected topic)
Click a paid option card (e.g. "Consultatie initiala 60 RON").
- Does a Stripe payment modal appear?
- Does the modal show the topic name + price?
- Is there a card input field?
- Enter test card: 4242 4242 4242 4242 | 12/26 | 123
- Click "Plateste X RON"
- Does the payment succeed?
- Does the modal close?
- Does a topic tag appear below header (brand color, shows price)?
- Does a response message appear from the professional?
- Is the input bar now ACTIVE?
- Can you send a message?

**FLOW 11: Book session flow**
Go to any professional profile and click "Rezervă ședință".
- Step 1 (/tip): Can you select a session type (Video / Voice / In-person)?
- Step 2 (/program): Does the calendar load with available slots? Can you pick a slot?
- Step 3 (/confirmare): Does the order summary show? Is the Stripe card input present?
- Enter test card and confirm payment.
- Does it redirect to /rezervare/confirmat/[id]?
- Does the confirmation page show booking details?

**FLOW 12: Pro panel login and messages**
Log out, then log in as andrei.m@demo.alegomind.ro / Demo1234!
Go to http://localhost:3001/profesionist/panou
- Does the pro dashboard load?
- Go to /profesionist/mesaje — does the pro see conversations from clients?
- Click a conversation — can the pro see messages and reply?

---

After testing all flows, give me:
1. A numbered list of all FAILS and PARTIALS with exact details
2. Which flows PASSED
3. The most critical bugs to fix first (ranked by impact)
4. Any UI/UX issues that aren't bugs but should be improved

Be specific: include the URL, what you clicked, what you saw, and what you expected instead.
