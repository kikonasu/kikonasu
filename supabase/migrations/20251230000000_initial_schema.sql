-- ============================================================================
-- KIKONASU DATABASE SCHEMA
-- Production-Ready Migration
-- Version: 1.0.0
-- Created: 2025-12-30
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 2: CUSTOM TYPES (ENUMS)
-- ============================================================================

-- User role enum for role-based access control
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Clothing category enum for type safety
DO $$ BEGIN
    CREATE TYPE clothing_category AS ENUM ('Top', 'Bottom', 'Shoes', 'Dress', 'Outerwear', 'Accessory');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Plan type enum for suitcase planning
DO $$ BEGIN
    CREATE TYPE plan_type AS ENUM ('trip', 'week', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Match type enum for capsule matching
DO $$ BEGIN
    CREATE TYPE match_type AS ENUM ('auto', 'manual', 'suggested');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- SECTION 3: CORE TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 3.1 PROFILES TABLE
-- Stores user profile information, linked to auth.users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profile information extending auth.users';
COMMENT ON COLUMN public.profiles.user_id IS 'Foreign key to auth.users';
COMMENT ON COLUMN public.profiles.name IS 'User display name';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar image';

-- ---------------------------------------------------------------------------
-- 3.2 USER ROLES TABLE
-- Role-based access control for admin features
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role)
);

COMMENT ON TABLE public.user_roles IS 'Role assignments for users (admin, user)';

-- ---------------------------------------------------------------------------
-- 3.3 WARDROBE ITEMS TABLE
-- Core table for all clothing items in user wardrobes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wardrobe_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Top', 'Bottom', 'Shoes', 'Dress', 'Outerwear', 'Accessory')),
    image_url TEXT NOT NULL,
    ai_analysis TEXT,
    color TEXT,
    brand TEXT,
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT FALSE,
    wear_count INTEGER DEFAULT 0,
    last_worn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.wardrobe_items IS 'Core wardrobe items - all clothing pieces';
COMMENT ON COLUMN public.wardrobe_items.category IS 'Clothing category: Top, Bottom, Shoes, Dress, Outerwear, Accessory';
COMMENT ON COLUMN public.wardrobe_items.image_url IS 'Storage path: {user_id}/{timestamp}.jpg';
COMMENT ON COLUMN public.wardrobe_items.ai_analysis IS 'AI-generated description from classify-clothing function';
COMMENT ON COLUMN public.wardrobe_items.wear_count IS 'Number of times item has been worn';

-- ---------------------------------------------------------------------------
-- 3.4 WISH LIST ITEMS TABLE
-- Items users want to purchase
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wish_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Top', 'Bottom', 'Shoes', 'Dress', 'Outerwear', 'Accessory')),
    image_url TEXT NOT NULL,
    ai_analysis TEXT,
    notes TEXT,
    outfit_potential INTEGER DEFAULT 0,
    affiliate_link TEXT,
    price DECIMAL(10, 2),
    priority INTEGER DEFAULT 0,
    is_purchased BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.wish_list_items IS 'Items users want to purchase';
COMMENT ON COLUMN public.wish_list_items.outfit_potential IS 'Number of new outfits this item would enable';
COMMENT ON COLUMN public.wish_list_items.affiliate_link IS 'Shopping link for the item';

-- ---------------------------------------------------------------------------
-- 3.5 OUTFIT HISTORY TABLE
-- History of all generated/worn outfits
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.outfit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    top_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    bottom_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    shoes_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    dress_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    outerwear_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    accessory_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    occasion TEXT,
    weather_temp INTEGER,
    weather_condition TEXT,
    was_worn BOOLEAN DEFAULT FALSE,
    worn_at TIMESTAMPTZ,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_outfit CHECK (
        (dress_item_id IS NOT NULL AND shoes_item_id IS NOT NULL) OR
        (top_item_id IS NOT NULL AND bottom_item_id IS NOT NULL AND shoes_item_id IS NOT NULL)
    )
);

COMMENT ON TABLE public.outfit_history IS 'History of generated and worn outfits';
COMMENT ON CONSTRAINT valid_outfit ON public.outfit_history IS 'Outfit must have (Dress + Shoes) OR (Top + Bottom + Shoes)';

-- ---------------------------------------------------------------------------
-- 3.6 FAVORITE OUTFITS TABLE
-- User's saved favorite outfit combinations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorite_outfits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    top_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    bottom_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    shoes_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    dress_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    outerwear_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    accessory_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    occasion TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_favorite_outfit CHECK (
        (dress_item_id IS NOT NULL AND shoes_item_id IS NOT NULL) OR
        (top_item_id IS NOT NULL AND bottom_item_id IS NOT NULL AND shoes_item_id IS NOT NULL)
    )
);

COMMENT ON TABLE public.favorite_outfits IS 'Saved favorite outfit combinations';

-- ---------------------------------------------------------------------------
-- 3.7 SUITCASES TABLE
-- Trip planning containers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suitcases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trip_name TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    trip_type TEXT[],
    weather_data JSONB,
    plan_type TEXT CHECK (plan_type IN ('trip', 'week', 'custom')),
    is_local BOOLEAN DEFAULT FALSE,
    notes TEXT,
    packing_list JSONB,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

COMMENT ON TABLE public.suitcases IS 'Trip planning containers with weather and outfit tracking';
COMMENT ON COLUMN public.suitcases.trip_type IS 'Array of trip types: work, beach, hiking, casual, formal';
COMMENT ON COLUMN public.suitcases.weather_data IS 'Weather forecast data from edge function';

-- ---------------------------------------------------------------------------
-- 3.8 SUITCASE OUTFITS TABLE
-- Planned outfits for each day of a trip
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suitcase_outfits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    suitcase_id UUID NOT NULL REFERENCES public.suitcases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    outfit_date DATE NOT NULL,
    occasion TEXT DEFAULT 'casual',
    occasion_label TEXT,
    time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'all_day')),
    top_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    bottom_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    shoes_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    dress_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    outerwear_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    accessory_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.suitcase_outfits IS 'Planned outfits for each day of a trip';

-- ---------------------------------------------------------------------------
-- 3.9 CAPSULE WARDROBES TABLE
-- User-created capsule collections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.capsule_wardrobes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    item_ids TEXT[] NOT NULL DEFAULT '{}',
    total_outfits INTEGER DEFAULT 0,
    season TEXT,
    style TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.capsule_wardrobes IS 'User-created capsule wardrobe collections';
COMMENT ON COLUMN public.capsule_wardrobes.item_ids IS 'Array of wardrobe item UUIDs in this capsule';

-- ---------------------------------------------------------------------------
-- 3.10 USER CAPSULE ITEMS TABLE
-- Mapping between users and capsule template items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_capsule_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL,
    template_item_id TEXT NOT NULL,
    wardrobe_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
    match_type TEXT DEFAULT 'auto' CHECK (match_type IN ('auto', 'manual', 'suggested')),
    match_confidence DECIMAL(3, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, template_id, template_item_id)
);

COMMENT ON TABLE public.user_capsule_items IS 'User matches to capsule template items';

-- ---------------------------------------------------------------------------
-- 3.11 CAPSULE WISHLIST TABLE
-- Items users want to buy for completing capsules
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.capsule_wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL,
    template_item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_category TEXT NOT NULL,
    item_description TEXT,
    notes TEXT,
    price_range_low DECIMAL(10, 2),
    price_range_high DECIMAL(10, 2),
    target_price DECIMAL(10, 2),
    purchased BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMPTZ,
    purchase_link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, template_id, template_item_id)
);

COMMENT ON TABLE public.capsule_wishlist IS 'Items needed to complete capsule collections';

-- ---------------------------------------------------------------------------
-- 3.12 USER STYLE PREFERENCES TABLE
-- Computed style analytics and preferences
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_style_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    favorite_colors JSONB DEFAULT '[]'::jsonb,
    favorite_combinations JSONB DEFAULT '[]'::jsonb,
    item_usage JSONB DEFAULT '{}'::jsonb,
    occasion_preferences JSONB DEFAULT '{}'::jsonb,
    skip_patterns JSONB DEFAULT '[]'::jsonb,
    preferred_styles TEXT[],
    body_type TEXT,
    color_palette TEXT,
    last_computed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_style_preferences IS 'Computed style analytics and preferences';
COMMENT ON COLUMN public.user_style_preferences.item_usage IS 'Map of itemId to wear count';
COMMENT ON COLUMN public.user_style_preferences.skip_patterns IS 'Patterns of items user tends to skip';

-- ---------------------------------------------------------------------------
-- 3.13 ANALYTICS EVENTS TABLE
-- User activity tracking for analytics
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    session_id TEXT,
    device_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.analytics_events IS 'User activity tracking for analytics';
COMMENT ON COLUMN public.analytics_events.event_type IS 'Event types: user_signup, outfit_generated, item_uploaded, etc.';

-- ---------------------------------------------------------------------------
-- 3.14 USER INTERACTIONS TABLE
-- General user interaction tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL,
    interaction_data JSONB,
    target_id UUID,
    target_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_interactions IS 'General user interaction tracking';

-- ============================================================================
-- SECTION 4: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Wardrobe items indexes
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_id ON public.wardrobe_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_category ON public.wardrobe_items(category);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_category ON public.wardrobe_items(user_id, category);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_created_at ON public.wardrobe_items(created_at DESC);

-- Wish list items indexes
CREATE INDEX IF NOT EXISTS idx_wish_list_items_user_id ON public.wish_list_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wish_list_items_category ON public.wish_list_items(category);
CREATE INDEX IF NOT EXISTS idx_wish_list_items_outfit_potential ON public.wish_list_items(outfit_potential DESC);

-- Outfit history indexes
CREATE INDEX IF NOT EXISTS idx_outfit_history_user_id ON public.outfit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_history_created_at ON public.outfit_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outfit_history_user_date ON public.outfit_history(user_id, created_at DESC);

-- Favorite outfits indexes
CREATE INDEX IF NOT EXISTS idx_favorite_outfits_user_id ON public.favorite_outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_outfits_created_at ON public.favorite_outfits(created_at DESC);

-- Suitcases indexes
CREATE INDEX IF NOT EXISTS idx_suitcases_user_id ON public.suitcases(user_id);
CREATE INDEX IF NOT EXISTS idx_suitcases_start_date ON public.suitcases(start_date);
CREATE INDEX IF NOT EXISTS idx_suitcases_user_dates ON public.suitcases(user_id, start_date, end_date);

-- Suitcase outfits indexes
CREATE INDEX IF NOT EXISTS idx_suitcase_outfits_suitcase_id ON public.suitcase_outfits(suitcase_id);
CREATE INDEX IF NOT EXISTS idx_suitcase_outfits_user_id ON public.suitcase_outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_suitcase_outfits_outfit_date ON public.suitcase_outfits(outfit_date);

-- Capsule wardrobes indexes
CREATE INDEX IF NOT EXISTS idx_capsule_wardrobes_user_id ON public.capsule_wardrobes(user_id);

-- User capsule items indexes
CREATE INDEX IF NOT EXISTS idx_user_capsule_items_user_id ON public.user_capsule_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_capsule_items_template ON public.user_capsule_items(template_id);
CREATE INDEX IF NOT EXISTS idx_user_capsule_items_wardrobe_item ON public.user_capsule_items(wardrobe_item_id);

-- Capsule wishlist indexes
CREATE INDEX IF NOT EXISTS idx_capsule_wishlist_user_id ON public.capsule_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_capsule_wishlist_template ON public.capsule_wishlist(template_id);

-- User style preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_style_preferences_user_id ON public.user_style_preferences(user_id);

-- Analytics events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_type ON public.analytics_events(user_id, event_type);

-- User interactions indexes
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON public.user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_target ON public.user_interactions(target_id, target_type);

-- ============================================================================
-- SECTION 5: DATABASE FUNCTIONS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 5.1 Function to check if user has a specific role
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.has_role IS 'Check if user has a specific role';

-- ---------------------------------------------------------------------------
-- 5.2 Function to handle new user signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile for new user
    INSERT INTO public.profiles (user_id, name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.email
    );

    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');

    -- Initialize style preferences
    INSERT INTO public.user_style_preferences (user_id)
    VALUES (NEW.id);

    -- Track signup event
    INSERT INTO public.analytics_events (user_id, event_type, event_data)
    VALUES (NEW.id, 'user_signup', jsonb_build_object(
        'provider', NEW.raw_app_meta_data->>'provider',
        'created_at', NEW.created_at
    ));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Creates profile, role, and preferences for new users';

-- ---------------------------------------------------------------------------
-- 5.3 Function to update updated_at timestamp
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at_column IS 'Automatically updates updated_at column';

-- ---------------------------------------------------------------------------
-- 5.4 Function to increment wear count
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_wear_count(item_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.wardrobe_items
    SET
        wear_count = wear_count + 1,
        last_worn_at = NOW()
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_wear_count IS 'Increments wear count for a wardrobe item';

-- ---------------------------------------------------------------------------
-- 5.5 Function to calculate outfit potential for wish list item
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_outfit_potential(_user_id UUID, _category TEXT)
RETURNS INTEGER AS $$
DECLARE
    potential INTEGER := 0;
    has_tops BOOLEAN;
    has_bottoms BOOLEAN;
    has_shoes BOOLEAN;
    has_dresses BOOLEAN;
    top_count INTEGER;
    bottom_count INTEGER;
    shoes_count INTEGER;
    dress_count INTEGER;
BEGIN
    -- Count items by category
    SELECT
        COUNT(*) FILTER (WHERE category = 'Top') > 0,
        COUNT(*) FILTER (WHERE category = 'Bottom') > 0,
        COUNT(*) FILTER (WHERE category = 'Shoes') > 0,
        COUNT(*) FILTER (WHERE category = 'Dress') > 0,
        COUNT(*) FILTER (WHERE category = 'Top'),
        COUNT(*) FILTER (WHERE category = 'Bottom'),
        COUNT(*) FILTER (WHERE category = 'Shoes'),
        COUNT(*) FILTER (WHERE category = 'Dress')
    INTO has_tops, has_bottoms, has_shoes, has_dresses, top_count, bottom_count, shoes_count, dress_count
    FROM public.wardrobe_items
    WHERE user_id = _user_id;

    -- Calculate potential based on category
    CASE _category
        WHEN 'Top' THEN
            IF has_bottoms AND has_shoes THEN
                potential := bottom_count * shoes_count;
            END IF;
        WHEN 'Bottom' THEN
            IF has_tops AND has_shoes THEN
                potential := top_count * shoes_count;
            END IF;
        WHEN 'Shoes' THEN
            IF has_tops AND has_bottoms THEN
                potential := top_count * bottom_count;
            END IF;
            IF has_dresses THEN
                potential := potential + dress_count;
            END IF;
        WHEN 'Dress' THEN
            IF has_shoes THEN
                potential := shoes_count;
            END IF;
        ELSE
            -- Accessories and outerwear add variety to existing outfits
            potential := GREATEST(top_count * bottom_count * shoes_count / 2, dress_count * shoes_count / 2);
    END CASE;

    RETURN COALESCE(potential, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.calculate_outfit_potential IS 'Calculates number of new outfits a wish list item would enable';

-- ---------------------------------------------------------------------------
-- 5.6 Function to clean up old outfit history
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_old_outfit_history(_user_id UUID, _keep_count INTEGER DEFAULT 50)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH ranked_history AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
        FROM public.outfit_history
        WHERE user_id = _user_id
    ),
    to_delete AS (
        SELECT id FROM ranked_history WHERE rn > _keep_count
    )
    DELETE FROM public.outfit_history
    WHERE id IN (SELECT id FROM to_delete);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_old_outfit_history IS 'Removes old outfit history entries, keeping the most recent';

-- ---------------------------------------------------------------------------
-- 5.7 Function to get user wardrobe statistics
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_wardrobe_stats(_user_id UUID)
RETURNS TABLE (
    total_items BIGINT,
    items_by_category JSONB,
    outfits_this_week BIGINT,
    total_outfits BIGINT,
    favorite_count BIGINT,
    wish_list_count BIGINT,
    upcoming_trips BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.wardrobe_items WHERE user_id = _user_id),
        (SELECT jsonb_object_agg(category, cnt) FROM (
            SELECT category, COUNT(*) as cnt
            FROM public.wardrobe_items
            WHERE user_id = _user_id
            GROUP BY category
        ) c),
        (SELECT COUNT(*) FROM public.outfit_history
         WHERE user_id = _user_id
         AND created_at >= NOW() - INTERVAL '7 days'),
        (SELECT COUNT(*) FROM public.outfit_history WHERE user_id = _user_id),
        (SELECT COUNT(*) FROM public.favorite_outfits WHERE user_id = _user_id),
        (SELECT COUNT(*) FROM public.wish_list_items WHERE user_id = _user_id AND NOT COALESCE(is_purchased, FALSE)),
        (SELECT COUNT(*) FROM public.suitcases
         WHERE user_id = _user_id
         AND start_date >= CURRENT_DATE
         AND NOT COALESCE(is_archived, FALSE));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_wardrobe_stats IS 'Returns comprehensive wardrobe statistics for a user';

-- ============================================================================
-- SECTION 6: TRIGGERS
-- ============================================================================

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers for all tables with updated_at column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_wardrobe_items_updated_at ON public.wardrobe_items;
CREATE TRIGGER update_wardrobe_items_updated_at
    BEFORE UPDATE ON public.wardrobe_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_wish_list_items_updated_at ON public.wish_list_items;
CREATE TRIGGER update_wish_list_items_updated_at
    BEFORE UPDATE ON public.wish_list_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_suitcases_updated_at ON public.suitcases;
CREATE TRIGGER update_suitcases_updated_at
    BEFORE UPDATE ON public.suitcases
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_suitcase_outfits_updated_at ON public.suitcase_outfits;
CREATE TRIGGER update_suitcase_outfits_updated_at
    BEFORE UPDATE ON public.suitcase_outfits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_capsule_wardrobes_updated_at ON public.capsule_wardrobes;
CREATE TRIGGER update_capsule_wardrobes_updated_at
    BEFORE UPDATE ON public.capsule_wardrobes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_capsule_items_updated_at ON public.user_capsule_items;
CREATE TRIGGER update_user_capsule_items_updated_at
    BEFORE UPDATE ON public.user_capsule_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_capsule_wishlist_updated_at ON public.capsule_wishlist;
CREATE TRIGGER update_capsule_wishlist_updated_at
    BEFORE UPDATE ON public.capsule_wishlist
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_style_preferences_updated_at ON public.user_style_preferences;
CREATE TRIGGER update_user_style_preferences_updated_at
    BEFORE UPDATE ON public.user_style_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suitcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suitcase_outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capsule_wardrobes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_capsule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capsule_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_style_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 7.1 PROFILES POLICIES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7.2 USER ROLES POLICIES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 7.3 WARDROBE ITEMS POLICIES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own wardrobe items" ON public.wardrobe_items;
CREATE POLICY "Users can view own wardrobe items" ON public.wardrobe_items
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wardrobe items" ON public.wardrobe_items;
CREATE POLICY "Users can insert own wardrobe items" ON public.wardrobe_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wardrobe items" ON public.wardrobe_items;
CREATE POLICY "Users can update own wardrobe items" ON public.wardrobe_items
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own wardrobe items" ON public.wardrobe_items;
CREATE POLICY "Users can delete own wardrobe items" ON public.wardrobe_items
    FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7.4 WISH LIST ITEMS POLICIES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own wish list items" ON public.wish_list_items;
CREATE POLICY "Users can view own wish list items" ON public.wish_list_items
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wish list items" ON public.wish_list_items;
CREATE POLICY "Users can insert own wish list items" ON public.wish_list_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wish list items" ON public.wish_list_items;
CREATE POLICY "Users can update own wish list items" ON public.wish_list_items
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own wish list items" ON public.wish_list_items;
CREATE POLICY "Users can delete own wish list items" ON public.wish_list_items
    FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7.5 OUTFIT HISTORY POLICIES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own outfit history" ON public.outfit_history;
CREATE POLICY "Users can view own outfit history" ON public.outfit_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own outfit history" ON public.outfit_history;
CREATE POLICY "Users can insert own outfit history" ON public.outfit_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own outfit history" ON public.outfit_history;
CREATE POLICY "Users can update own outfit history" ON public.outfit_history
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own outfit history" ON public.outfit_history;
CREATE POLICY "Users can delete own outfit history" ON public.outfit_history
    FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7.6 FAVORITE OUTFITS POLICIES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own favorite outfits" ON public.favorite_outfits;
CREATE POLICY "Users can view own favorite outfits" ON public.favorite_outfits
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorite outfits" ON public.favorite_outfits;
CREATE POLICY "Users can insert own favorite outfits" ON public.favorite_outfits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorite outfits" ON public.favorite_outfits;
CREATE POLICY "Users can delete own favorite outfits" ON public.favorite_outfits
    FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7.7 SUITCASES POLICIES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own suitcases" ON public.suitcases;
CREATE POLICY "Users can view own suitcases" ON public.suitcases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own suitcases" ON public.suitcases;
CREATE POLICY "Users can insert own suitcases" ON public.suitcases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own suitcases" ON public.suitcases;
CREATE POLICY "Users can update own suitcases" ON public.suitcases
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own suitcases" ON public.suitcases;
CREATE POLICY "Users can delete own suitcases" ON public.suitcases
    FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7.8 SUITCASE OUTFITS POLICIES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own suitcase outfits" ON public.suitcase_outfits;
CREATE POLICY "Users can view own suitcase outfits" ON public.suitcase_outfits
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own suitcase outfits" ON public.suitcase_outfits;
CREATE POLICY "Users can insert own suitcase outfits" ON public.suitcase_outfits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own suitcase outfits" ON public.suitcase_outfits;
CREATE POLICY "Users can update own suitcase outfits" ON public.suitcase_outfits
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own suitcase outfits" ON public.suitcase_outfits;
CREATE POLICY "Users can delete own suitcase outfits" ON public.suitcase_outfits
    FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7.9 CAPSULE WARDROBES POLICIES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own capsule wardrobes" ON public.capsule_wardrobes;
CREATE POLICY "Users can view own capsule wardrobes" ON public.capsule_wardrobes
    FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

DROP POLICY IF EXISTS "Users can insert own capsule wardrobes" ON public.capsule_wardrobes;
CREATE POLICY "Users can insert own capsule wardrobes" ON public.capsule_wardrobes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own capsule wardrobes" ON public.capsule_wardrobes;
CREATE POLICY "Users can update own capsule wardrobes" ON public.capsule_wardrobes
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own capsule wardrobes" ON public.capsule_wardrobes;
CREATE POLICY "Users can delete own capsule wardrobes" ON public.capsule_wardrobes
    FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7.10 USER CAPSULE ITEMS POLICIES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own capsule items" ON public.user_capsule_items;
CREATE POLICY "Users can view own capsule items" ON public.user_capsule_items
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own capsule items" ON public.user_capsule_items;
CREATE POLICY "Users can insert own capsule items" ON public.user_capsule_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own capsule items" ON public.user_capsule_items;
CREATE POLICY "Users can update own capsule items" ON public.user_capsule_items
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own capsule items" ON public.user_capsule_items;
CREATE POLICY "Users can delete own capsule items" ON public.user_capsule_items
    FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7.11 CAPSULE WISHLIST POLICIES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own capsule wishlist" ON public.capsule_wishlist;
CREATE POLICY "Users can view own capsule wishlist" ON public.capsule_wishlist
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own capsule wishlist" ON public.capsule_wishlist;
CREATE POLICY "Users can insert own capsule wishlist" ON public.capsule_wishlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own capsule wishlist" ON public.capsule_wishlist;
CREATE POLICY "Users can update own capsule wishlist" ON public.capsule_wishlist
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own capsule wishlist" ON public.capsule_wishlist;
CREATE POLICY "Users can delete own capsule wishlist" ON public.capsule_wishlist
    FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7.12 USER STYLE PREFERENCES POLICIES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own style preferences" ON public.user_style_preferences;
CREATE POLICY "Users can view own style preferences" ON public.user_style_preferences
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own style preferences" ON public.user_style_preferences;
CREATE POLICY "Users can insert own style preferences" ON public.user_style_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own style preferences" ON public.user_style_preferences;
CREATE POLICY "Users can update own style preferences" ON public.user_style_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7.13 ANALYTICS EVENTS POLICIES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own analytics events" ON public.analytics_events;
CREATE POLICY "Users can view own analytics events" ON public.analytics_events
    FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can insert own analytics events" ON public.analytics_events;
CREATE POLICY "Users can insert own analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics_events;
CREATE POLICY "Admins can view all analytics" ON public.analytics_events
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 7.14 USER INTERACTIONS POLICIES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own interactions" ON public.user_interactions;
CREATE POLICY "Users can view own interactions" ON public.user_interactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own interactions" ON public.user_interactions;
CREATE POLICY "Users can insert own interactions" ON public.user_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SECTION 8: STORAGE BUCKET SETUP
-- ============================================================================

-- Create wardrobe-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'wardrobe-images',
    'wardrobe-images',
    TRUE,  -- Public bucket for easier image access
    5242880,  -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage policies for wardrobe-images bucket
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
CREATE POLICY "Users can upload own images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'wardrobe-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
CREATE POLICY "Users can view own images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'wardrobe-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Public can view all images" ON storage.objects;
CREATE POLICY "Public can view all images" ON storage.objects
    FOR SELECT USING (bucket_id = 'wardrobe-images');

DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
CREATE POLICY "Users can update own images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'wardrobe-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
CREATE POLICY "Users can delete own images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'wardrobe-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================================================
-- SECTION 9: GRANTS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to all tables for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant access to sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- SECTION 10: FINAL VERIFICATION
-- ============================================================================

-- Verify all tables exist
DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'profiles', 'user_roles', 'wardrobe_items', 'wish_list_items',
        'outfit_history', 'favorite_outfits', 'suitcases', 'suitcase_outfits',
        'capsule_wardrobes', 'user_capsule_items', 'capsule_wishlist',
        'user_style_preferences', 'analytics_events', 'user_interactions'
    ];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
            RAISE EXCEPTION 'Table % does not exist', tbl;
        END IF;
    END LOOP;
    RAISE NOTICE 'All tables verified successfully';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
