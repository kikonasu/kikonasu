# Kikonasu Email Series
## Complete Welcome & Engagement Email System

---

## Table of Contents
1. [Onboarding Series](#1-onboarding-series)
2. [Feature Adoption Series](#2-feature-adoption-series)
3. [Milestone & Achievement Emails](#3-milestone--achievement-emails)
4. [Engagement & Activity Emails](#4-engagement--activity-emails)
5. [Re-engagement Series](#5-re-engagement-series)
6. [Transactional Emails](#6-transactional-emails)

---

# 1. ONBOARDING SERIES

## Email 1.1: Welcome Email
**Trigger:** `user_signup` event
**Timing:** Immediate (within 1 minute of signup)
**Subject Line:** Welcome to Kikonasu, {{name}}! Your style journey starts now

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hey {{name}},

Welcome to Kikonasu! We're thrilled to have you.

You've just unlocked a smarter way to manage your wardrobe
and discover outfit combinations you never knew existed.

Here's what you can do:

┌─────────────────────────────────────────────────────────┐
│  📸  UPLOAD YOUR CLOTHES                                │
│      Snap photos of your wardrobe items                 │
├─────────────────────────────────────────────────────────┤
│  ✨  GENERATE OUTFITS                                   │
│      Let AI create perfect combinations                 │
├─────────────────────────────────────────────────────────┤
│  🧳  PLAN YOUR TRIPS                                    │
│      Build capsule wardrobes for travel                 │
└─────────────────────────────────────────────────────────┘

Ready to get started?

         ┌────────────────────────────────┐
         │     ADD YOUR FIRST ITEM →      │
         └────────────────────────────────┘

Your wardrobe is waiting,
The Kikonasu Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 1.2: First Item Uploaded
**Trigger:** `item_uploaded` event (first occurrence)
**Timing:** Immediate
**Subject Line:** Your first piece is in! Here's what's next...

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nice work, {{name}}!

You just added your first item: a {{category}}.

That's one down—here's a quick tip:

┌─────────────────────────────────────────────────────────┐
│  💡 PRO TIP                                             │
│                                                         │
│  Add at least 3 items to unlock outfit generation.      │
│  The more variety (tops, bottoms, shoes), the better    │
│  your AI-generated outfits will be!                     │
└─────────────────────────────────────────────────────────┘

Your progress:
█░░░░░░░░░ 1/3 items for your first outfit

         ┌────────────────────────────────┐
         │      ADD MORE ITEMS →          │
         └────────────────────────────────┘

Keep building,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 1.3: Onboarding Complete (3 Items)
**Trigger:** `item_uploaded` count reaches 3
**Timing:** Immediate
**Subject Line:** You're ready! Generate your first outfit now

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{name}}, you did it!

Your wardrobe now has 3 items—which means you can
generate your very first AI-powered outfit.

┌─────────────────────────────────────────────────────────┐
│                                                         │
│              🎉 OUTFIT GENERATION UNLOCKED              │
│                                                         │
│    Our AI will mix and match your pieces to create      │
│    stylish combinations tailored just for you.          │
│                                                         │
└─────────────────────────────────────────────────────────┘

         ┌────────────────────────────────┐
         │    GENERATE YOUR FIRST LOOK →  │
         └────────────────────────────────┘

What happens next:
• See "Today's Look" suggestions daily
• Save outfits you love to Favorites
• Track what you've worn in History

The fun begins now,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 1.4: Gentle Nudge (No Activity After Signup)
**Trigger:** No `item_uploaded` event within 24 hours of `user_signup`
**Timing:** 24 hours after signup
**Subject Line:** {{name}}, your wardrobe is waiting...

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hey {{name}},

We noticed you haven't added any items yet—no worries,
we get it. Starting something new takes a moment.

Here's how easy it is:

    1. Open your closet
    2. Snap a photo of any piece
    3. Upload it to Kikonasu

That's it. Under 30 seconds.

┌─────────────────────────────────────────────────────────┐
│  🤔 NOT SURE WHERE TO START?                            │
│                                                         │
│  Try uploading your favorite go-to shirt or a pair      │
│  of jeans you wear all the time.                        │
└─────────────────────────────────────────────────────────┘

         ┌────────────────────────────────┐
         │       START UPLOADING →        │
         └────────────────────────────────┘

We'll be here when you're ready,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

# 2. FEATURE ADOPTION SERIES

## Email 2.1: First Outfit Generated
**Trigger:** `outfit_generated` event (first occurrence)
**Timing:** Immediate
**Subject Line:** Your first outfit is here! 👀

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{name}}, you just generated your first outfit!

How did it feel to see your clothes come together
in a new way?

Here's what you can do with your outfits:

┌─────────────────────────────────────────────────────────┐
│  ❤️  SAVE TO FAVORITES                                  │
│      Love it? Save it for quick access later            │
├─────────────────────────────────────────────────────────┤
│  🔄  REGENERATE                                         │
│      Not feeling it? Get a fresh combination            │
├─────────────────────────────────────────────────────────┤
│  📤  SHARE IT                                           │
│      Show off your style on Instagram or Pinterest      │
└─────────────────────────────────────────────────────────┘

         ┌────────────────────────────────┐
         │      VIEW TODAY'S LOOK →       │
         └────────────────────────────────┘

P.S. The more items you add, the more outfit
combinations become possible. Math is fun!

Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 2.2: First Favorite Saved
**Trigger:** `user_interactions` with type `favorite` (first occurrence)
**Timing:** Immediate
**Subject Line:** Saved! Your first favorite outfit

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Love at first sight, {{name}}?

You just saved your first favorite outfit.
Smart move—now you can access it anytime.

┌─────────────────────────────────────────────────────────┐
│  📂 YOUR FAVORITES COLLECTION                           │
│                                                         │
│  All your saved outfits live in one place.              │
│  Perfect for those "what do I wear?" moments.           │
│                                                         │
│  Current favorites: 1                                   │
└─────────────────────────────────────────────────────────┘

Pro tip: Save outfits for different occasions—
work, weekend, date night—so you're always prepared.

         ┌────────────────────────────────┐
         │      VIEW FAVORITES →          │
         └────────────────────────────────┘

Building your style library,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 2.3: Discover Capsule Wardrobes
**Trigger:** User has 10+ items AND has NOT created a capsule wardrobe
**Timing:** 3 days after reaching 10 items
**Subject Line:** Ready for the next level? Try Capsule Wardrobes

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{name}}, with {{item_count}} items in your wardrobe,
you're ready for something powerful: Capsule Wardrobes.

What's a capsule wardrobe?

┌─────────────────────────────────────────────────────────┐
│  A curated collection of versatile pieces that          │
│  work together to create multiple outfits.              │
│                                                         │
│  Less decision fatigue. More style.                     │
└─────────────────────────────────────────────────────────┘

We've got templates for:

    🏢  Work Essentials
    ✈️  Travel Light
    🌴  Vacation Vibes
    ❄️  Winter Basics
    ☀️  Summer Capsule

         ┌────────────────────────────────┐
         │    EXPLORE CAPSULE TEMPLATES → │
         └────────────────────────────────┘

Simplify your style,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 2.4: First Trip/Suitcase Created
**Trigger:** `plan_created` event (first occurrence)
**Timing:** Immediate
**Subject Line:** Trip planned! Your packing list is ready

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Adventure awaits, {{name}}!

You just created your first trip: {{trip_name}}

┌─────────────────────────────────────────────────────────┐
│  🧳 TRIP DETAILS                                        │
│                                                         │
│  Destination: {{destination}}                           │
│  Dates: {{start_date}} - {{end_date}}                   │
│  Duration: {{days}} days                                │
└─────────────────────────────────────────────────────────┘

Here's how to pack smart:

    1. Assign outfits to each day
    2. We'll generate a packing checklist
    3. Check off items as you pack

No more overpacking. No more "I forgot my..."

         ┌────────────────────────────────┐
         │      PLAN YOUR OUTFITS →       │
         └────────────────────────────────┘

Bon voyage,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 2.5: First Wishlist Item Added
**Trigger:** `wishlist_item_added` event (first occurrence)
**Timing:** Immediate
**Subject Line:** Smart shopping starts here

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Great choice, {{name}}!

You added "{{item_name}}" to your wishlist.

Your wishlist isn't just a shopping list—it's a
strategic planning tool.

┌─────────────────────────────────────────────────────────┐
│  🎯 WHY WISHLISTS WORK                                  │
│                                                         │
│  • See what gaps exist in your wardrobe                 │
│  • Track prices and links                               │
│  • Shop intentionally, not impulsively                  │
│  • Build capsules with items you don't own yet          │
└─────────────────────────────────────────────────────────┘

         ┌────────────────────────────────┐
         │      VIEW YOUR WISHLIST →      │
         └────────────────────────────────┘

Shop smarter,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 2.6: First Outfit Shared
**Trigger:** `user_interactions` with type `share` (first occurrence)
**Timing:** Immediate
**Subject Line:** You're officially a style influencer!

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Look at you, {{name}}!

You just shared your first outfit to {{platform}}.
Your style deserves to be seen!

┌─────────────────────────────────────────────────────────┐
│  📸 SHARING IDEAS                                       │
│                                                         │
│  • Share daily looks to build your style diary          │
│  • Ask friends for feedback on outfit choices           │
│  • Inspire others with your unique combinations         │
└─────────────────────────────────────────────────────────┘

Keep sharing, keep inspiring,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

# 3. MILESTONE & ACHIEVEMENT EMAILS

## Email 3.1: 10 Items Milestone
**Trigger:** `item_uploaded` count reaches 10
**Timing:** Immediate
**Subject Line:** 10 items! You're building something great

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{name}}, you hit double digits!

┌─────────────────────────────────────────────────────────┐
│                                                         │
│           🎉  10 ITEMS IN YOUR WARDROBE  🎉             │
│                                                         │
└─────────────────────────────────────────────────────────┘

With 10 items, here's what's possible:

    📊  {{outfit_potential}} potential outfit combinations
    ✨  More variety in your daily suggestions
    🎯  Better AI recommendations based on your style

Your wardrobe breakdown:
    Tops:       {{tops_count}}
    Bottoms:    {{bottoms_count}}
    Dresses:    {{dresses_count}}
    Shoes:      {{shoes_count}}
    Outerwear:  {{outerwear_count}}
    Accessories:{{accessories_count}}

         ┌────────────────────────────────┐
         │      VIEW YOUR WARDROBE →      │
         └────────────────────────────────┘

Here's to the next 10,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 3.2: 25 Items Milestone
**Trigger:** `item_uploaded` count reaches 25
**Timing:** Immediate
**Subject Line:** 25 items! Your wardrobe is thriving

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Impressive, {{name}}!

You've uploaded 25 items to your digital wardrobe.
That's dedication to organized style.

┌─────────────────────────────────────────────────────────┐
│  📈 YOUR STYLE STATS                                    │
│                                                         │
│  Total items:           25                              │
│  Outfit combinations:   {{outfit_potential}}+           │
│  Outfits generated:     {{outfits_generated}}           │
│  Favorites saved:       {{favorites_count}}             │
└─────────────────────────────────────────────────────────┘

Have you tried these features yet?

    ☐ Capsule Wardrobes - Curate mini collections
    ☐ Trip Planning - Pack smarter for travel
    ☐ Outfit History - Track what you've worn

         ┌────────────────────────────────┐
         │      EXPLORE FEATURES →        │
         └────────────────────────────────┘

Your wardrobe is becoming legendary,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 3.3: 50 Items Milestone
**Trigger:** `item_uploaded` count reaches 50
**Timing:** Immediate
**Subject Line:** 50 items! You're a wardrobe master

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{name}}, you're in the big leagues now.

┌─────────────────────────────────────────────────────────┐
│                                                         │
│          ⭐  50 ITEMS - WARDROBE MASTER  ⭐              │
│                                                         │
│     You now have one of the most complete              │
│     digital wardrobes on Kikonasu!                     │
│                                                         │
└─────────────────────────────────────────────────────────┘

What this means for you:

    🔮  Highly personalized outfit suggestions
    🎯  AI that truly understands your style
    ♾️   Thousands of outfit combinations
    📊  Rich data for style insights

You've unlocked the full Kikonasu experience.

         ┌────────────────────────────────┐
         │      VIEW YOUR EMPIRE →        │
         └────────────────────────────────┘

In awe of your commitment,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 3.4: First Week Anniversary
**Trigger:** 7 days since `user_signup`
**Timing:** 7 days after signup
**Subject Line:** One week with Kikonasu - Here's your recap

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Happy one week, {{name}}!

You joined Kikonasu 7 days ago. Let's look at
what you've accomplished:

┌─────────────────────────────────────────────────────────┐
│  📊 YOUR FIRST WEEK                                     │
│                                                         │
│  Items uploaded:      {{items_count}}                   │
│  Outfits generated:   {{outfits_count}}                 │
│  Favorites saved:     {{favorites_count}}               │
│  Times you regenerated: {{regenerate_count}}            │
└─────────────────────────────────────────────────────────┘

{{#if items_count > 0}}
You're off to a great start! Keep building your
wardrobe and watch the outfit magic happen.
{{else}}
Your wardrobe is still empty—but it's never too
late to start! Upload your first item today.
{{/if}}

         ┌────────────────────────────────┐
         │      CONTINUE YOUR JOURNEY →   │
         └────────────────────────────────┘

Here's to many more weeks,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 3.5: One Month Anniversary
**Trigger:** 30 days since `user_signup`
**Timing:** 30 days after signup
**Subject Line:** 30 days of better style decisions

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{name}}, it's been a month!

30 days ago, you took the first step toward a
smarter, more organized wardrobe.

┌─────────────────────────────────────────────────────────┐
│  🗓️ YOUR MONTHLY RECAP                                  │
│                                                         │
│  Total items:         {{items_count}}                   │
│  Outfits generated:   {{outfits_count}}                 │
│  Outfits favorited:   {{favorites_count}}               │
│  Trips planned:       {{trips_count}}                   │
│  Wishlist items:      {{wishlist_count}}                │
│                                                         │
│  Most worn category:  {{top_category}}                  │
└─────────────────────────────────────────────────────────┘

{{#if is_power_user}}
You're a Kikonasu power user! Your engagement is
in the top tier of our community.
{{/if}}

What's next? Have you explored:
    • Capsule Wardrobes for curated collections
    • Style Profile for personalized recommendations
    • Outfit History to track your choices

         ┌────────────────────────────────┐
         │      SEE YOUR FULL STATS →     │
         └────────────────────────────────┘

Cheers to your style evolution,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

# 4. ENGAGEMENT & ACTIVITY EMAILS

## Email 4.1: Upcoming Trip Reminder
**Trigger:** Suitcase `start_date` is 3 days away
**Timing:** 3 days before trip
**Subject Line:** {{trip_name}} is in 3 days! Are you packed?

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{name}}, your trip is almost here!

┌─────────────────────────────────────────────────────────┐
│  🧳 {{trip_name}}                                       │
│                                                         │
│  Starts: {{start_date}}                                 │
│  Duration: {{days}} days                                │
│  Days with outfits planned: {{planned_days}}/{{days}}   │
└─────────────────────────────────────────────────────────┘

{{#if planned_days < days}}
⚠️ You still have {{remaining_days}} days without
   outfit plans. Don't get caught unprepared!
{{else}}
✅ All your outfits are planned. Nice work!
   Review your packing list one more time.
{{/if}}

Quick checklist:
    ☐ Review outfit assignments
    ☐ Check the weather forecast
    ☐ Pack using your generated list
    ☐ Don't forget accessories!

         ┌────────────────────────────────┐
         │      FINALIZE YOUR TRIP →      │
         └────────────────────────────────┘

Safe travels,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 4.2: Unused Items Reminder
**Trigger:** Items not included in any outfit for 30+ days
**Timing:** Weekly digest (if applicable)
**Subject Line:** 5 items in your wardrobe need some love

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{name}}, some wardrobe items miss you!

We noticed these pieces haven't been in any
outfits lately:

┌─────────────────────────────────────────────────────────┐
│  👕 ITEMS WAITING TO BE WORN                            │
│                                                         │
│  • {{item_1_name}} - last worn {{item_1_days}} days ago │
│  • {{item_2_name}} - last worn {{item_2_days}} days ago │
│  • {{item_3_name}} - last worn {{item_3_days}} days ago │
│  • {{item_4_name}} - never used in an outfit            │
│  • {{item_5_name}} - never used in an outfit            │
└─────────────────────────────────────────────────────────┘

What to do:
    🔄 Generate a new outfit featuring these items
    🗑️ Consider if you still need them
    🎁 Donate what no longer serves you

         ┌────────────────────────────────┐
         │      REDISCOVER YOUR ITEMS →   │
         └────────────────────────────────┘

Every piece deserves a moment,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 4.3: Weekly Style Digest
**Trigger:** Every Monday (for active users)
**Timing:** Monday 8:00 AM local time
**Subject Line:** Your week in style + fresh outfit ideas

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Happy Monday, {{name}}!

Here's your weekly style snapshot:

┌─────────────────────────────────────────────────────────┐
│  📊 LAST WEEK                                           │
│                                                         │
│  Outfits generated:     {{weekly_outfits}}              │
│  New favorites:         {{weekly_favorites}}            │
│  Items added:           {{weekly_items}}                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🌤️ THIS WEEK'S WEATHER                                 │
│                                                         │
│  {{weather_summary}}                                    │
│  Recommended layers: {{layer_recommendation}}           │
└─────────────────────────────────────────────────────────┘

{{#if has_upcoming_trip}}
┌─────────────────────────────────────────────────────────┐
│  ✈️ UPCOMING TRIP                                       │
│                                                         │
│  {{trip_name}} starts in {{days_until}} days            │
│  Status: {{packing_status}}                             │
└─────────────────────────────────────────────────────────┘
{{/if}}

         ┌────────────────────────────────┐
         │      GET TODAY'S LOOK →        │
         └────────────────────────────────┘

Have a stylish week,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

# 5. RE-ENGAGEMENT SERIES

## Email 5.1: 7-Day Inactivity
**Trigger:** No activity for 7 days
**Timing:** 7 days after last activity
**Subject Line:** {{name}}, your wardrobe misses you

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hey {{name}},

It's been a week since we've seen you.
Your digital wardrobe is waiting!

┌─────────────────────────────────────────────────────────┐
│  📦 YOUR WARDROBE STATUS                                │
│                                                         │
│  Items in wardrobe:     {{items_count}}                 │
│  Potential outfits:     {{outfit_potential}}            │
│  Favorites saved:       {{favorites_count}}             │
└─────────────────────────────────────────────────────────┘

Quick ways to jump back in:

    ✨ Generate today's outfit in one tap
    📸 Add a new piece you recently bought
    ❤️ Browse your saved favorites

         ┌────────────────────────────────┐
         │      GET TODAY'S LOOK →        │
         └────────────────────────────────┘

We'll keep your wardrobe safe,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 5.2: 14-Day Inactivity
**Trigger:** No activity for 14 days
**Timing:** 14 days after last activity
**Subject Line:** Still there? Here's what's new

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{name}}, we haven't heard from you in a while.

Life gets busy—we get it. But your wardrobe
is still here, ready when you are.

In case you missed it, here's what you can do:

┌─────────────────────────────────────────────────────────┐
│  🆕 FEATURES YOU MIGHT NOT HAVE TRIED                   │
│                                                         │
│  • Capsule Wardrobes - Build curated collections        │
│  • Trip Planning - Pack smart for your next adventure   │
│  • Wishlist - Plan future purchases strategically       │
│  • Outfit History - See patterns in what you wear       │
└─────────────────────────────────────────────────────────┘

Your wardrobe at a glance:
    {{items_count}} items → {{outfit_potential}} possible outfits

         ┌────────────────────────────────┐
         │      COME BACK & EXPLORE →     │
         └────────────────────────────────┘

Your style is worth the investment,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 5.3: 30-Day Inactivity (Win-back)
**Trigger:** No activity for 30 days
**Timing:** 30 days after last activity
**Subject Line:** We saved your wardrobe. Ready to pick up where you left off?

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hey {{name}},

It's been 30 days. Your wardrobe is exactly
how you left it—{{items_count}} items, all
safe and organized.

┌─────────────────────────────────────────────────────────┐
│  💭 QUICK QUESTION                                      │
│                                                         │
│  What made you pause?                                   │
│                                                         │
│  • Too busy to upload items?                            │
│  • Outfits weren't matching your style?                 │
│  • Needed different features?                           │
│  • Just forgot about us?                                │
└─────────────────────────────────────────────────────────┘

Whatever the reason, we'd love to have you back.
One tap and you're right where you left off.

         ┌────────────────────────────────┐
         │      RETURN TO WARDROBE →      │
         └────────────────────────────────┘

P.S. Reply to this email if there's anything
we can help with. We read every message.

Hoping to see you soon,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 5.4: 60-Day Final Re-engagement
**Trigger:** No activity for 60 days
**Timing:** 60 days after last activity
**Subject Line:** Last call, {{name}}—your wardrobe awaits

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{name}},

This is our last email (we promise we're not
clingy). We just wanted to remind you:

    Your {{items_count}} wardrobe items are still here.
    Your {{favorites_count}} favorite outfits are saved.
    Everything is ready when you are.

┌─────────────────────────────────────────────────────────┐
│  If Kikonasu isn't for you, that's okay.               │
│  But if you ever want to come back—even months         │
│  from now—your wardrobe will be waiting.               │
└─────────────────────────────────────────────────────────┘

         ┌────────────────────────────────┐
         │      ONE MORE LOOK? →          │
         └────────────────────────────────┘

Take care,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Unsubscribe from re-engagement emails]
```

---

# 6. TRANSACTIONAL EMAILS

## Email 6.1: Password Reset
**Trigger:** User requests password reset
**Timing:** Immediate
**Subject Line:** Reset your Kikonasu password

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi {{name}},

We received a request to reset your password.

         ┌────────────────────────────────┐
         │      RESET PASSWORD →          │
         └────────────────────────────────┘

This link expires in 1 hour.

Didn't request this? You can safely ignore this
email. Your password won't change unless you
click the link above.

Stay secure,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 6.2: Account Deletion Confirmation
**Trigger:** User initiates account deletion
**Timing:** Immediate
**Subject Line:** Your Kikonasu account deletion request

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi {{name}},

We received your request to delete your account.

┌─────────────────────────────────────────────────────────┐
│  ⚠️ THIS ACTION IS PERMANENT                            │
│                                                         │
│  The following will be deleted:                         │
│  • {{items_count}} wardrobe items                       │
│  • {{outfits_count}} generated outfits                  │
│  • {{favorites_count}} favorite outfits                 │
│  • All trip plans and wishlists                         │
│  • Your style preferences and history                   │
└─────────────────────────────────────────────────────────┘

If you're sure, click below to confirm:

         ┌────────────────────────────────┐
         │      CONFIRM DELETION →        │
         └────────────────────────────────┘

Changed your mind? Simply ignore this email and
your account will remain active.

We're sorry to see you go,
Kikonasu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Email 6.3: Account Deleted (Farewell)
**Trigger:** Account deletion completed
**Timing:** Immediate after deletion
**Subject Line:** Goodbye from Kikonasu

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         [KIKONASU LOGO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi {{name}},

Your Kikonasu account has been deleted.

All your data has been permanently removed from
our systems, including your wardrobe items,
outfits, and preferences.

If you ever want to return, you're always welcome
to create a new account at kikonasu.com.

We wish you well on your style journey,
The Kikonasu Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

# IMPLEMENTATION NOTES

## Trigger Summary Table

| Email | Trigger Event | Timing |
|-------|--------------|--------|
| 1.1 Welcome | `user_signup` | Immediate |
| 1.2 First Item | `item_uploaded` (1st) | Immediate |
| 1.3 Onboarding Complete | `item_uploaded` (3rd) | Immediate |
| 1.4 Nudge | No items 24h after signup | 24 hours |
| 2.1 First Outfit | `outfit_generated` (1st) | Immediate |
| 2.2 First Favorite | `favorite` interaction (1st) | Immediate |
| 2.3 Capsule Discovery | 10+ items, no capsule | 3 days |
| 2.4 First Trip | `plan_created` (1st) | Immediate |
| 2.5 First Wishlist | `wishlist_item_added` (1st) | Immediate |
| 2.6 First Share | `share` interaction (1st) | Immediate |
| 3.1 10 Items | Item count = 10 | Immediate |
| 3.2 25 Items | Item count = 25 | Immediate |
| 3.3 50 Items | Item count = 50 | Immediate |
| 3.4 Week Anniversary | 7 days since signup | 7 days |
| 3.5 Month Anniversary | 30 days since signup | 30 days |
| 4.1 Trip Reminder | Trip starts in 3 days | 3 days before |
| 4.2 Unused Items | Items unused 30+ days | Weekly |
| 4.3 Weekly Digest | Active user, Monday | Weekly |
| 5.1 Inactive 7d | No activity 7 days | 7 days |
| 5.2 Inactive 14d | No activity 14 days | 14 days |
| 5.3 Inactive 30d | No activity 30 days | 30 days |
| 5.4 Inactive 60d | No activity 60 days | 60 days |
| 6.1 Password Reset | Reset requested | Immediate |
| 6.2 Delete Request | Deletion initiated | Immediate |
| 6.3 Deleted | Deletion completed | Immediate |

## Required Database Tables

```sql
-- Email notification tracking
CREATE TABLE email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email_type VARCHAR(100) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

-- User email preferences
CREATE TABLE email_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  onboarding_emails BOOLEAN DEFAULT true,
  feature_emails BOOLEAN DEFAULT true,
  milestone_emails BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  reengagement_emails BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Personalization Variables

Each email can use:
- `{{name}}` - User's display name
- `{{email}}` - User's email address
- `{{items_count}}` - Total wardrobe items
- `{{outfit_potential}}` - Calculated outfit combinations
- `{{favorites_count}}` - Saved favorites count
- `{{outfits_count}}` - Total outfits generated
- `{{category}}` - Item category (for item-specific emails)
- `{{trip_name}}`, `{{start_date}}`, `{{days}}` - Trip details
- `{{platform}}` - Social platform (for share emails)

---

*Document created for Kikonasu Email Marketing System*
