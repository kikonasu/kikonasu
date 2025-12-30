# Kikonasu - Supabase Production Setup Guide

## Quick Setup Instructions

### Step 1: Run the Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/zcvyfzxycnnzvhgwaqxf
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the entire contents of `supabase/migrations/20251230000000_initial_schema.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)

This will create:
- 14 database tables with proper relationships
- Row Level Security (RLS) policies for all tables
- Performance indexes
- Database functions and triggers
- Storage bucket with policies

### Step 2: Configure Edge Functions Secrets

Navigate to **Project Settings > Edge Functions** and add these secrets:

| Secret Name | Description | Get it from |
|------------|-------------|-------------|
| `LOVABLE_API_KEY` | AI classification API | Your Lovable project settings |
| `OPENWEATHERMAP_API_KEY` | Weather data | https://openweathermap.org/api (free tier) |

### Step 3: Deploy Edge Functions

From your terminal in the project directory:

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref zcvyfzxycnnzvhgwaqxf

# Deploy all edge functions
supabase functions deploy classify-clothing
supabase functions deploy get-weather
supabase functions deploy compute-style-preferences
supabase functions deploy generate-clothing-image
supabase functions deploy delete-user
supabase functions deploy grant-admin-role
```

### Step 4: Verify Setup

Run this SQL query to verify all tables were created:

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected output (14 tables):
- analytics_events
- capsule_wardrobes
- capsule_wishlist
- favorite_outfits
- outfit_history
- profiles
- suitcase_outfits
- suitcases
- user_capsule_items
- user_interactions
- user_roles
- user_style_preferences
- wardrobe_items
- wish_list_items

---

## Database Schema Overview

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (name, email, avatar) |
| `user_roles` | Role-based access (admin/user) |
| `wardrobe_items` | All clothing items |
| `wish_list_items` | Items users want to buy |

### Outfit Tables

| Table | Purpose |
|-------|---------|
| `outfit_history` | Generated/worn outfits |
| `favorite_outfits` | Saved favorite combinations |
| `suitcases` | Trip planning containers |
| `suitcase_outfits` | Outfits planned per trip day |

### Capsule Tables

| Table | Purpose |
|-------|---------|
| `capsule_wardrobes` | User-created capsule collections |
| `user_capsule_items` | Matches to capsule templates |
| `capsule_wishlist` | Items needed for capsules |

### Analytics Tables

| Table | Purpose |
|-------|---------|
| `user_style_preferences` | Computed style analytics |
| `analytics_events` | User activity tracking |
| `user_interactions` | General interaction logs |

---

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled. Users can only access their own data:
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

### Admin Access
Admins have additional privileges:
- View all analytics events
- Manage user roles
- Access admin dashboard

### Storage Security
- Images stored in `wardrobe-images` bucket
- Users can only upload to their own folder: `{user_id}/{filename}`
- Public read access for all images

---

## Database Functions

| Function | Purpose |
|----------|---------|
| `has_role(user_id, role)` | Check if user has specific role |
| `handle_new_user()` | Auto-creates profile on signup |
| `update_updated_at_column()` | Auto-updates timestamps |
| `increment_wear_count(item_id)` | Track item usage |
| `calculate_outfit_potential(user_id, category)` | Calculates wish list potential |
| `cleanup_old_outfit_history(user_id, keep_count)` | Prune old history |
| `get_wardrobe_stats(user_id)` | Dashboard statistics |

---

## Triggers

| Trigger | Table | Action |
|---------|-------|--------|
| `on_auth_user_created` | `auth.users` | Creates profile, role, preferences |
| `update_*_updated_at` | All tables | Auto-updates `updated_at` |

---

## Edge Functions

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `classify-clothing` | POST | AI clothing categorization |
| `get-weather` | POST | Weather data for outfits |
| `compute-style-preferences` | POST | Calculate style analytics |
| `generate-clothing-image` | POST | AI image generation |
| `delete-user` | POST | Account deletion |
| `grant-admin-role` | POST | Admin role assignment |

---

## Environment Variables

### Required in Vercel (already configured)

```env
VITE_SUPABASE_URL=https://zcvyfzxycnnzvhgwaqxf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=zcvyfzxycnnzvhgwaqxf
```

### Required in Supabase Edge Functions

```env
LOVABLE_API_KEY=your_lovable_api_key
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
```

---

## Troubleshooting

### "Permission denied" errors
- Verify RLS policies are correctly applied
- Check that the user is authenticated
- Ensure `user_id` matches `auth.uid()`

### Images not loading
- Verify storage bucket exists: `wardrobe-images`
- Check storage policies are applied
- Ensure image path format: `{user_id}/{timestamp}.jpg`

### Edge functions failing
- Check function secrets are configured
- Verify function is deployed: `supabase functions list`
- Check logs: `supabase functions logs classify-clothing`

### New users not getting profile
- Verify `on_auth_user_created` trigger exists
- Check `handle_new_user()` function is created
- Manually run profile creation if needed

---

## Make User Admin

To make a user an admin, run this SQL:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## Backup & Recovery

### Export Data
```sql
-- Export user's wardrobe
COPY (SELECT * FROM wardrobe_items WHERE user_id = 'uuid') TO '/tmp/wardrobe.csv' CSV HEADER;
```

### Data Retention
- Outfit history auto-cleans after 50 entries per user
- Analytics events retained indefinitely
- Soft delete available for suitcases (is_archived flag)
